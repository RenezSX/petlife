import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type Input = {
  hospitalizationId: string;
  medication: string;
  dose: string;
  unit: string;
  route: string;
  frequencyHours: number;
  startAt: string;
  endAt?: string;
  notes?: string;
  professionalId?: string;
  inventoryItemId?: string;
  inventoryQuantity?: number;
};

type AdministrationInput = {
  status: string;
  administeredBy?: string;
  professionalId?: string;
  notes?: string;
};

const clean = (value?: string) => value?.trim() || null;

function buildDoseDates(start: Date, end: Date | undefined, frequency: number) {
  const dates: Date[] = [];
  const max = end ?? new Date(start.getTime() + 72 * 60 * 60 * 1000);
  for (
    let date = new Date(start);
    date <= max && dates.length < 60;
    date = new Date(date.getTime() + frequency * 60 * 60 * 1000)
  ) {
    dates.push(date);
  }
  return dates;
}

async function resolveProfessional(professionalId?: string, fallbackName?: string) {
  if (!professionalId) {
    return { professionalId: null, professionalName: clean(fallbackName) };
  }

  const professional = await prisma.professional.findUnique({ where: { id: professionalId } });
  if (!professional || !professional.active) {
    throw new AppError(400, 'Selecione um profissional ativo.');
  }

  return { professionalId: professional.id, professionalName: professional.name };
}

export async function listPrescriptions(query: Record<string, unknown>) {
  const active = String(query.active ?? 'all');
  const search = String(query.search ?? '').trim();

  return prisma.medicationPrescription.findMany({
    where: {
      ...(active === 'true' ? { active: true } : active === 'false' ? { active: false } : {}),
      ...(search
        ? {
            OR: [
              { medication: { contains: search } },
              { responsible: { contains: search } },
              { hospitalization: { animal: { name: { contains: search } } } },
            ],
          }
        : {}),
    },
    include: {
      hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } },
      doses: { orderBy: { scheduledAt: 'asc' }, take: 8 },
      inventoryItem: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listDoses(query: Record<string, unknown>) {
  const date = String(query.date ?? '');
  const status = String(query.status ?? 'all');
  const where: Record<string, unknown> = { ...(status !== 'all' ? { status } : {}) };

  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    where.scheduledAt = { gte: start, lte: end };
  }

  return prisma.medicationDose.findMany({
    where,
    include: {
      hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } },
      prescription: true,
      inventoryItem: true,
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function createPrescription(data: Input) {
  const hospitalization = await prisma.hospitalization.findUnique({ where: { id: data.hospitalizationId } });
  if (!hospitalization || hospitalization.dischargedAt) {
    throw new AppError(400, 'Selecione uma internação ativa.');
  }

  const start = new Date(data.startAt);
  const end = data.endAt ? new Date(data.endAt) : undefined;
  if (end && end < start) throw new AppError(400, 'A data final deve ser posterior ao início.');

  const professional = await resolveProfessional(data.professionalId);
  let inventoryItem: { id: string; active: boolean } | null = null;
  if (data.inventoryItemId) {
    inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
    if (!inventoryItem || !inventoryItem.active) throw new AppError(400, 'Selecione um item de estoque ativo.');
    if (!data.inventoryQuantity || data.inventoryQuantity <= 0) throw new AppError(400, 'Informe o consumo de estoque por dose.');
  }
  const dates = buildDoseDates(start, end, data.frequencyHours);

  return prisma.$transaction(async (tx) => {
    const prescription = await tx.medicationPrescription.create({
      data: {
        hospitalizationId: data.hospitalizationId,
        medication: data.medication.trim(),
        dose: data.dose.trim(),
        unit: data.unit.trim(),
        route: data.route.trim(),
        frequencyHours: data.frequencyHours,
        startAt: start,
        endAt: end,
        notes: clean(data.notes),
        professionalId: professional.professionalId,
        responsible: professional.professionalName,
        inventoryItemId: inventoryItem?.id ?? null,
        inventoryQuantity: inventoryItem ? Number(data.inventoryQuantity) : null,
      },
    });

    await tx.medicationDose.createMany({
      data: dates.map((scheduledAt) => ({
        hospitalizationId: data.hospitalizationId,
        prescriptionId: prescription.id,
        medication: data.medication.trim(),
        dose: data.dose.trim(),
        unit: data.unit.trim(),
        route: data.route.trim(),
        inventoryItemId: inventoryItem?.id ?? null,
        inventoryQuantity: inventoryItem ? Number(data.inventoryQuantity) : null,
        scheduledAt,
        status: 'PENDING',
      })),
    });

    return prescription;
  });
}

export async function setPrescriptionActive(id: string, active: boolean) {
  const item = await prisma.medicationPrescription.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'Prescrição não encontrada.');
  return prisma.medicationPrescription.update({ where: { id }, data: { active } });
}

export async function administerDose(id: string, data: AdministrationInput) {
  const dose = await prisma.medicationDose.findUnique({
    where: { id },
    include: { hospitalization: { include: { animal: true } }, inventoryItem: true },
  });
  if (!dose) throw new AppError(404, 'Dose não encontrada.');
  if (dose.status !== 'PENDING') throw new AppError(409, 'Esta dose já foi registrada.');
  if (data.status !== 'ADMINISTERED' && !data.notes?.trim()) {
    throw new AppError(400, 'Informe a justificativa para não administrar a dose.');
  }

  const professional = await resolveProfessional(data.professionalId, data.administeredBy);
  if (!professional.professionalName) {
    throw new AppError(400, 'Selecione o profissional responsável.');
  }

  return prisma.$transaction(async (tx) => {
    if (data.status === 'ADMINISTERED' && dose.inventoryItemId && dose.inventoryQuantity) {
      const item = await tx.inventoryItem.findUnique({ where: { id: dose.inventoryItemId } });
      if (!item || !item.active) throw new AppError(409, 'O item vinculado ao estoque está inativo ou não existe.');
      if (item.currentQuantity < dose.inventoryQuantity) {
        throw new AppError(409, `Estoque insuficiente de ${item.name}. Disponível: ${item.currentQuantity} ${item.unit}.`);
      }

      const after = item.currentQuantity - dose.inventoryQuantity;
      await tx.inventoryItem.update({ where: { id: item.id }, data: { currentQuantity: after } });
      await tx.inventoryMovement.create({
        data: {
          itemId: item.id,
          type: 'OUT',
          quantity: dose.inventoryQuantity,
          beforeQty: item.currentQuantity,
          afterQty: after,
          reason: `Dose administrada • ${dose.hospitalization.animal.name} • ${dose.medication}`,
          responsible: professional.professionalName,
          notes: `Baixa automática da dose ${dose.id}`,
        },
      });
    }

    return tx.medicationDose.update({
      where: { id },
      data: {
        status: data.status,
        administeredBy: professional.professionalName,
        administeredByProfessionalId: professional.professionalId,
        notes: clean(data.notes),
        administeredAt: new Date(),
      },
    });
  });
}

export async function medicationStats() {
  const now = new Date();
  const soon = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const [pending, overdue, next, administered] = await Promise.all([
    prisma.medicationDose.count({ where: { status: 'PENDING' } }),
    prisma.medicationDose.count({ where: { status: 'PENDING', scheduledAt: { lt: now } } }),
    prisma.medicationDose.count({ where: { status: 'PENDING', scheduledAt: { gte: now, lte: soon } } }),
    prisma.medicationDose.count({ where: { status: 'ADMINISTERED' } }),
  ]);
  return { pending, overdue, next, administered };
}
