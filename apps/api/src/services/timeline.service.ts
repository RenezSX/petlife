import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import type { ClinicalEventInput } from '../validations/timeline.validation.js';

type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  date: Date;
  status: string;
  responsible?: string | null;
  professionalId?: string | null;
  editable?: boolean;
  vitals?: {
    temperature: number | null;
    heartRate: number | null;
    respiratoryRate: number | null;
    weight: number | null;
  } | null;
};

export async function getTimeline(id: string) {
  const hospitalization = await prisma.hospitalization.findUnique({
    where: { id },
    include: {
      animal: { include: { tutor: true } },
      bed: true,
      procedures: true,
      medicationDoses: true,
      prescriptions: true,
      clinicalEvents: true,
    },
  });

  if (!hospitalization) {
    throw new AppError(404, 'Internação não encontrada.');
  }

  const events: TimelineEvent[] = [
    {
      id: `admission-${hospitalization.id}`,
      type: 'ADMISSION',
      title: 'Internação iniciada',
      description: hospitalization.reason,
      date: hospitalization.admittedAt,
      status: hospitalization.status,
      responsible: hospitalization.veterinarian,
    },
  ];

  for (const event of hospitalization.clinicalEvents) {
    events.push({
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      date: event.eventAt,
      status: 'RECORDED',
      responsible: event.responsible,
      professionalId: event.professionalId,
      editable: true,
      vitals: {
        temperature: event.temperature,
        heartRate: event.heartRate,
        respiratoryRate: event.respiratoryRate,
        weight: event.weight,
      },
    });
  }

  for (const procedure of hospitalization.procedures) {
    events.push({
      id: procedure.id,
      type: 'PROCEDURE',
      title: procedure.title,
      description: procedure.description ?? procedure.notes,
      date: procedure.completedAt ?? procedure.scheduledAt,
      status: procedure.status,
      responsible: procedure.responsible,
    });
  }

  for (const dose of hospitalization.medicationDoses) {
    events.push({
      id: dose.id,
      type: 'MEDICATION',
      title: `${dose.medication}${dose.dose ? ` • ${dose.dose} ${dose.unit ?? ''}` : ''}`,
      description: dose.notes,
      date: dose.administeredAt ?? dose.scheduledAt,
      status: dose.status,
      responsible: dose.administeredBy,
    });
  }

  if (hospitalization.dischargedAt) {
    events.push({
      id: `discharge-${hospitalization.id}`,
      type: 'DISCHARGE',
      title: 'Alta realizada',
      description: hospitalization.dischargeSummary,
      date: hospitalization.dischargedAt,
      status: 'COMPLETED',
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const now = hospitalization.dischargedAt ?? new Date();
  const stayHours = Math.max(0, Math.round((now.getTime() - hospitalization.admittedAt.getTime()) / 3_600_000));

  return {
    hospitalization: {
      id: hospitalization.id,
      animal: hospitalization.animal,
      bed: hospitalization.bed,
      status: hospitalization.status,
      priority: hospitalization.priority,
      reason: hospitalization.reason,
      diagnosis: hospitalization.diagnosis,
      veterinarian: hospitalization.veterinarian,
      professionalId: hospitalization.professionalId,
      notes: hospitalization.notes,
      admittedAt: hospitalization.admittedAt,
      expectedDischargeAt: hospitalization.expectedDischargeAt,
      dischargedAt: hospitalization.dischargedAt,
      dischargeSummary: hospitalization.dischargeSummary,
    },
    summary: {
      totalEvents: events.length,
      clinicalEntries: hospitalization.clinicalEvents.length,
      procedures: hospitalization.procedures.length,
      medicationDoses: hospitalization.medicationDoses.length,
      stayHours,
    },
    events,
  };
}

async function resolveClinicalProfessional(data: ClinicalEventInput) {
  if (!data.professionalId) return { professionalId: null, responsible: data.responsible || null };
  const professional = await prisma.professional.findUnique({ where: { id: data.professionalId } });
  if (!professional || !professional.active) throw new AppError(400, 'Selecione um profissional ativo.');
  return { professionalId: professional.id, responsible: professional.name };
}

export async function createClinicalEvent(hospitalizationId: string, data: ClinicalEventInput) {
  const hospitalization = await prisma.hospitalization.findUnique({ where: { id: hospitalizationId } });
  if (!hospitalization) throw new AppError(404, 'Internação não encontrada.');

  const professional = await resolveClinicalProfessional(data);

  return prisma.clinicalEvent.create({
    data: {
      hospitalizationId,
      type: data.type,
      title: data.title,
      description: data.description,
      responsible: professional.responsible,
      professionalId: professional.professionalId,
      eventAt: data.eventAt,
      temperature: data.temperature ?? null,
      heartRate: data.heartRate ?? null,
      respiratoryRate: data.respiratoryRate ?? null,
      weight: data.weight ?? null,
    },
  });
}

export async function updateClinicalEvent(hospitalizationId: string, eventId: string, data: ClinicalEventInput) {
  const event = await prisma.clinicalEvent.findFirst({ where: { id: eventId, hospitalizationId } });
  if (!event) throw new AppError(404, 'Registro clínico não encontrado.');

  const professional = await resolveClinicalProfessional(data);

  return prisma.clinicalEvent.update({
    where: { id: eventId },
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      responsible: professional.responsible,
      professionalId: professional.professionalId,
      eventAt: data.eventAt,
      temperature: data.temperature ?? null,
      heartRate: data.heartRate ?? null,
      respiratoryRate: data.respiratoryRate ?? null,
      weight: data.weight ?? null,
    },
  });
}

export async function deleteClinicalEvent(hospitalizationId: string, eventId: string) {
  const event = await prisma.clinicalEvent.findFirst({ where: { id: eventId, hospitalizationId } });
  if (!event) throw new AppError(404, 'Registro clínico não encontrado.');
  await prisma.clinicalEvent.delete({ where: { id: eventId } });
}
