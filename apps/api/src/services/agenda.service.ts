import { prisma } from '../config/prisma.js';

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59.999`);
  return { start, end };
}

export async function getAgenda(query: Record<string, unknown>) {
  const date = String(query.date ?? new Date().toISOString().slice(0, 10));
  const professionalId = String(query.professionalId ?? 'all');
  const type = String(query.type ?? 'all');
  const { start, end } = dayRange(date);

  const professional = professionalId !== 'all' ? await prisma.professional.findUnique({ where: { id: professionalId } }) : null;
  const professionalName = professional?.name ?? null;

  const [procedures, doses, discharges] = await Promise.all([
    type === 'all' || type === 'procedure'
      ? prisma.procedure.findMany({
          where: {
            scheduledAt: { gte: start, lte: end },
            ...(professionalId !== 'all'
              ? { OR: [{ professionalId }, ...(professionalName ? [{ responsible: professionalName }] : [])] }
              : {}),
          },
          include: { hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } } },
          orderBy: { scheduledAt: 'asc' },
        })
      : [],
    type === 'all' || type === 'medication'
      ? prisma.medicationDose.findMany({
          where: {
            scheduledAt: { gte: start, lte: end },
            ...(professionalId !== 'all'
              ? {
                  OR: [
                    { administeredByProfessionalId: professionalId },
                    { prescription: { professionalId } },
                  ],
                }
              : {}),
          },
          include: {
            hospitalization: { include: { animal: { include: { tutor: true } }, bed: true } },
            prescription: true,
          },
          orderBy: { scheduledAt: 'asc' },
        })
      : [],
    type === 'all' || type === 'discharge'
      ? prisma.hospitalization.findMany({
          where: {
            dischargedAt: null,
            expectedDischargeAt: { gte: start, lte: end },
            ...(professionalId !== 'all'
              ? { OR: [{ professionalId }, ...(professionalName ? [{ veterinarian: professionalName }] : [])] }
              : {}),
          },
          include: { animal: { include: { tutor: true } }, bed: true },
          orderBy: { expectedDischargeAt: 'asc' },
        })
      : [],
  ]);

  const items = [
    ...procedures.map((item: any) => ({
      id: `procedure-${item.id}`,
      sourceId: item.id,
      type: 'PROCEDURE',
      title: item.title,
      scheduledAt: item.scheduledAt,
      status: item.status,
      professional: item.responsible,
      patient: item.hospitalization.animal.name,
      tutor: item.hospitalization.animal.tutor.name,
      bed: item.hospitalization.bed?.name ?? null,
      sector: item.hospitalization.bed?.sector ?? null,
      hospitalizationId: item.hospitalizationId,
      detail: item.description,
    })),
    ...doses.map((item: any) => ({
      id: `medication-${item.id}`,
      sourceId: item.id,
      type: 'MEDICATION',
      title: `${item.medication} • ${item.dose ?? ''} ${item.unit ?? ''}`.trim(),
      scheduledAt: item.scheduledAt,
      status: item.status,
      professional: item.administeredBy ?? item.prescription?.responsible ?? null,
      patient: item.hospitalization.animal.name,
      tutor: item.hospitalization.animal.tutor.name,
      bed: item.hospitalization.bed?.name ?? null,
      sector: item.hospitalization.bed?.sector ?? null,
      hospitalizationId: item.hospitalizationId,
      detail: item.route,
    })),
    ...discharges.map((item: any) => ({
      id: `discharge-${item.id}`,
      sourceId: item.id,
      type: 'DISCHARGE',
      title: 'Alta prevista',
      scheduledAt: item.expectedDischargeAt!,
      status: 'EXPECTED',
      professional: item.veterinarian,
      patient: item.animal.name,
      tutor: item.animal.tutor.name,
      bed: item.bed?.name ?? null,
      sector: item.bed?.sector ?? null,
      hospitalizationId: item.id,
      detail: item.reason,
    })),
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const now = new Date();
  const overdue = items.filter((item) =>
    item.type !== 'DISCHARGE' &&
    !['COMPLETED', 'ADMINISTERED', 'CANCELED'].includes(item.status) &&
    new Date(item.scheduledAt) < now
  ).length;

  return {
    date,
    items,
    stats: {
      total: items.length,
      procedures: procedures.length,
      medications: doses.length,
      discharges: discharges.length,
      overdue,
    },
  };
}
