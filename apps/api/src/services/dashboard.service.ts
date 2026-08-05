import { prisma } from '../config/prisma.js';

const activeHospitalizationStatuses = [
  'WAITING',
  'HOSPITALIZED',
  'OBSERVATION',
  'PROCEDURE',
  'RECOVERY',
  'CRITICAL',
  'DISCHARGE_EXPECTED'
];

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const nextSixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const [
    activeHospitalizations,
    critical,
    expectedDischarges,
    beds,
    pendingProcedures,
    overdueProcedures,
    todayProcedures,
    pendingDoses,
    overdueDoses,
    upcomingDoses,
    administeredToday,
    recentRows
  ] = await Promise.all([
    prisma.hospitalization.count({
      where: { status: { in: activeHospitalizationStatuses }, dischargedAt: null }
    }),
    prisma.hospitalization.count({
      where: { status: 'CRITICAL', dischargedAt: null }
    }),
    prisma.hospitalization.count({
      where: {
        dischargedAt: null,
        expectedDischargeAt: { gte: todayStart, lte: todayEnd }
      }
    }),
    prisma.bed.findMany({
      where: { active: true },
      orderBy: [{ sector: 'asc' }, { name: 'asc' }],
      include: {
        hospitalizations: {
          where: { dischargedAt: null, status: { in: activeHospitalizationStatuses } },
          take: 1,
          include: { animal: true }
        }
      }
    }),
    prisma.procedure.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }
    }),
    prisma.procedure.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] }, scheduledAt: { lt: now } }
    }),
    prisma.procedure.findMany({
      where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      include: {
        hospitalization: {
          include: { animal: { include: { tutor: true } }, bed: true }
        }
      }
    }),
    prisma.medicationDose.count({ where: { status: 'PENDING' } }),
    prisma.medicationDose.count({
      where: { status: 'PENDING', scheduledAt: { lt: now } }
    }),
    prisma.medicationDose.findMany({
      where: { status: 'PENDING', scheduledAt: { gte: now, lte: nextSixHours } },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      include: {
        hospitalization: {
          include: { animal: { include: { tutor: true } }, bed: true }
        }
      }
    }),
    prisma.medicationDose.count({
      where: { status: 'ADMINISTERED', administeredAt: { gte: todayStart, lte: todayEnd } }
    }),
    prisma.hospitalization.findMany({
      where: { dischargedAt: null, status: { in: activeHospitalizationStatuses } },
      take: 6,
      orderBy: [{ priority: 'desc' }, { admittedAt: 'desc' }],
      include: { animal: { include: { tutor: true } }, bed: true }
    })
  ]);

  const occupiedBeds = beds.filter((bed) => bed.hospitalizations.length > 0).length;
  const availableBeds = beds.length - occupiedBeds;
  const occupancyRate = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;

  const sectorMap = new Map<string, { total: number; occupied: number }>();
  for (const bed of beds) {
    const current = sectorMap.get(bed.sector) ?? { total: 0, occupied: 0 };
    current.total += 1;
    if (bed.hospitalizations.length > 0) current.occupied += 1;
    sectorMap.set(bed.sector, current);
  }

  const sectors = Array.from(sectorMap.entries()).map(([name, value]) => ({
    name,
    total: value.total,
    occupied: value.occupied,
    available: value.total - value.occupied,
    occupancyRate: value.total > 0 ? Math.round((value.occupied / value.total) * 100) : 0
  }));

  const alerts = [
    ...(overdueDoses > 0
      ? [{ id: 'overdue-doses', level: 'danger', title: `${overdueDoses} dose(s) atrasada(s)`, description: 'Existem medicações pendentes com horário vencido.', href: '/medicacoes' }]
      : []),
    ...(overdueProcedures > 0
      ? [{ id: 'overdue-procedures', level: 'warning', title: `${overdueProcedures} procedimento(s) atrasado(s)`, description: 'Revise a agenda clínica e atualize os status.', href: '/procedimentos' }]
      : []),
    ...(critical > 0
      ? [{ id: 'critical-patients', level: 'danger', title: `${critical} paciente(s) crítico(s)`, description: 'Pacientes críticos exigem acompanhamento imediato.', href: '/internacoes' }]
      : []),
    ...(expectedDischarges > 0
      ? [{ id: 'expected-discharges', level: 'info', title: `${expectedDischarges} alta(s) prevista(s) hoje`, description: 'Confira os pacientes com previsão de alta para hoje.', href: '/internacoes' }]
      : []),
    ...(availableBeds > 0
      ? [{ id: 'available-beds', level: 'success', title: `${availableBeds} leito(s) disponível(is)`, description: 'Há capacidade disponível para novas internações.', href: '/leitos' }]
      : [])
  ];

  return {
    metrics: {
      hospitalized: activeHospitalizations,
      critical,
      totalBeds: beds.length,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      pendingProcedures,
      overdueProcedures,
      pendingMedications: pendingDoses,
      overdueMedications: overdueDoses,
      administeredToday,
      expectedDischarges
    },
    sectors,
    procedureStatus: {
      pending: pendingProcedures,
      overdue: overdueProcedures,
      completedToday: todayProcedures.filter((item) => item.status === 'COMPLETED').length
    },
    medicationStatus: {
      pending: pendingDoses,
      overdue: overdueDoses,
      administeredToday
    },
    alerts,
    agenda: {
      procedures: todayProcedures.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        scheduledAt: item.scheduledAt.toISOString(),
        patient: item.hospitalization.animal.name,
        tutor: item.hospitalization.animal.tutor.name,
        bed: item.hospitalization.bed?.name ?? 'Sem leito',
        responsible: item.responsible
      })),
      medications: upcomingDoses.map((item) => ({
        id: item.id,
        medication: item.medication,
        dose: item.dose,
        unit: item.unit,
        route: item.route,
        scheduledAt: item.scheduledAt.toISOString(),
        patient: item.hospitalization.animal.name,
        tutor: item.hospitalization.animal.tutor.name,
        bed: item.hospitalization.bed?.name ?? 'Sem leito'
      }))
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
