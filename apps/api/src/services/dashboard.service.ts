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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const nextSixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

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
    recentRows,
    activeByPriority,
    admissionsTrend,
    dischargesTrend,
    completedProceduresTrend,
    administeredDosesTrend,
    recentAdmissions,
    recentDischarges,
    recentCompletedProcedures,
    recentAdministeredDoses,
    recentClinicalEvents
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
      take: 8,
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
      take: 8,
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
      take: 8,
      orderBy: [{ priority: 'desc' }, { admittedAt: 'desc' }],
      include: { animal: { include: { tutor: true } }, bed: true }
    }),
    prisma.hospitalization.groupBy({
      by: ['priority'],
      where: { dischargedAt: null, status: { in: activeHospitalizationStatuses } },
      _count: { _all: true }
    }),
    prisma.hospitalization.findMany({
      where: { admittedAt: { gte: sevenDaysAgo } },
      select: { admittedAt: true }
    }),
    prisma.hospitalization.findMany({
      where: { dischargedAt: { gte: sevenDaysAgo } },
      select: { dischargedAt: true }
    }),
    prisma.procedure.findMany({
      where: { status: 'COMPLETED', completedAt: { gte: sevenDaysAgo } },
      select: { completedAt: true }
    }),
    prisma.medicationDose.findMany({
      where: { status: 'ADMINISTERED', administeredAt: { gte: sevenDaysAgo } },
      select: { administeredAt: true }
    }),
    prisma.hospitalization.findMany({
      orderBy: { admittedAt: 'desc' },
      take: 5,
      include: { animal: true, bed: true }
    }),
    prisma.hospitalization.findMany({
      where: { dischargedAt: { not: null } },
      orderBy: { dischargedAt: 'desc' },
      take: 5,
      include: { animal: true, bed: true }
    }),
    prisma.procedure.findMany({
      where: { status: 'COMPLETED', completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { hospitalization: { include: { animal: true } } }
    }),
    prisma.medicationDose.findMany({
      where: { status: 'ADMINISTERED', administeredAt: { not: null } },
      orderBy: { administeredAt: 'desc' },
      take: 5,
      include: { hospitalization: { include: { animal: true } } }
    }),
    prisma.clinicalEvent.findMany({
      orderBy: { eventAt: 'desc' },
      take: 5,
      include: { hospitalization: { include: { animal: true } } }
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

  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const key = dateKey(date);
    return {
      date: key,
      label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''),
      admissions: admissionsTrend.filter((item) => dateKey(item.admittedAt) === key).length,
      discharges: dischargesTrend.filter((item) => item.dischargedAt && dateKey(item.dischargedAt) === key).length,
      procedures: completedProceduresTrend.filter((item) => item.completedAt && dateKey(item.completedAt) === key).length,
      medications: administeredDosesTrend.filter((item) => item.administeredAt && dateKey(item.administeredAt) === key).length
    };
  });

  const priorityOrder = ['URGENT', 'HIGH', 'NORMAL', 'LOW'];
  const priorities = priorityOrder.map((priority) => ({
    priority,
    total: activeByPriority.find((item) => item.priority === priority)?._count._all ?? 0
  }));

  const activity = [
    ...recentAdmissions.map((item) => ({
      id: `admission-${item.id}`,
      type: 'ADMISSION',
      title: 'Paciente internado',
      description: `${item.animal.name} foi admitido${item.bed ? ` no leito ${item.bed.name}` : ''}.`,
      patient: item.animal.name,
      date: item.admittedAt.toISOString(),
      href: `/internacoes/${item.id}`
    })),
    ...recentDischarges.filter((item) => item.dischargedAt).map((item) => ({
      id: `discharge-${item.id}`,
      type: 'DISCHARGE',
      title: 'Alta realizada',
      description: `${item.animal.name} teve a internação encerrada.`,
      patient: item.animal.name,
      date: item.dischargedAt!.toISOString(),
      href: `/internacoes/${item.id}`
    })),
    ...recentCompletedProcedures.filter((item) => item.completedAt).map((item) => ({
      id: `procedure-${item.id}`,
      type: 'PROCEDURE',
      title: 'Procedimento concluído',
      description: `${item.title} • ${item.hospitalization.animal.name}`,
      patient: item.hospitalization.animal.name,
      date: item.completedAt!.toISOString(),
      href: '/procedimentos'
    })),
    ...recentAdministeredDoses.filter((item) => item.administeredAt).map((item) => ({
      id: `dose-${item.id}`,
      type: 'MEDICATION',
      title: 'Dose administrada',
      description: `${item.medication} • ${item.hospitalization.animal.name}`,
      patient: item.hospitalization.animal.name,
      date: item.administeredAt!.toISOString(),
      href: '/medicacoes'
    })),
    ...recentClinicalEvents.map((item) => ({
      id: `clinical-${item.id}`,
      type: 'CLINICAL',
      title: item.title,
      description: `${item.hospitalization.animal.name} • ${item.type === 'VITALS' ? 'Sinais vitais' : 'Registro clínico'}`,
      patient: item.hospitalization.animal.name,
      date: item.eventAt.toISOString(),
      href: `/internacoes/${item.hospitalizationId}`
    }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    generatedAt: now.toISOString(),
    refreshIntervalSeconds: 30,
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
    priorityDistribution: priorities,
    trends: trendDays,
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
    activity,
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
