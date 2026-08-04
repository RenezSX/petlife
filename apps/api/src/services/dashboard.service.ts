import { prisma } from '../config/prisma.js';

const activeStatuses = [
  'WAITING',
  'HOSPITALIZED',
  'OBSERVATION',
  'PROCEDURE',
  'RECOVERY',
  'CRITICAL',
  'DISCHARGE_EXPECTED'
];

export async function getDashboardData() {
  const now = new Date();
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [hospitalized, critical, pendingProcedures, pendingMedications, recentRows] = await Promise.all([
    prisma.hospitalization.count({
      where: { status: { in: activeStatuses }, dischargedAt: null }
    }),
    prisma.hospitalization.count({
      where: { status: 'CRITICAL', dischargedAt: null }
    }),
    prisma.procedure.count({
      where: { completedAt: null, scheduledAt: { lte: nextDay } }
    }),
    prisma.medicationDose.count({
      where: { administeredAt: null, scheduledAt: { lte: nextDay } }
    }),
    prisma.hospitalization.findMany({
      where: { dischargedAt: null },
      take: 5,
      orderBy: { admittedAt: 'desc' },
      include: {
        animal: { include: { tutor: true } },
        bed: true
      }
    })
  ]);

  return {
    metrics: {
      hospitalized,
      critical,
      pendingProcedures,
      pendingMedications
    },
    recent: recentRows.map((item) => ({
      id: item.id,
      animal: item.animal.name,
      species: item.animal.species,
      tutor: item.animal.tutor.name,
      bed: item.bed?.name ?? 'Sem leito',
      status: item.status,
      priority: item.priority,
      admittedAt: item.admittedAt.toISOString()
    }))
  };
}
