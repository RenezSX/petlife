import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

export async function documentOptions() {
  return prisma.hospitalization.findMany({
    include: { animal: { include: { tutor: true } }, bed: true },
    orderBy: { admittedAt: 'desc' },
    take: 200,
  });
}

export async function getDocumentData(id: string) {
  const [hospitalization, settings] = await Promise.all([
    prisma.hospitalization.findUnique({
      where: { id },
      include: {
        animal: { include: { tutor: true } },
        bed: true,
        procedures: { orderBy: { scheduledAt: 'asc' } },
        prescriptions: { orderBy: { createdAt: 'asc' } },
        medicationDoses: { orderBy: { scheduledAt: 'asc' } },
        clinicalEvents: { orderBy: { eventAt: 'asc' } },
      },
    }),
    prisma.clinicSettings.findUnique({ where: { id: 'clinic' } }),
  ]);
  if (!hospitalization) throw new AppError(404, 'Internação não encontrada.');
  return { hospitalization, settings };
}
