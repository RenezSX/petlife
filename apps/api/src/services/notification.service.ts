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

type NotificationLevel = 'danger' | 'warning' | 'info' | 'success';

type NotificationItem = {
  id: string;
  level: NotificationLevel;
  category: 'medication' | 'procedure' | 'hospitalization' | 'bed';
  title: string;
  description: string;
  occurredAt: string;
  href: string;
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

export async function listNotifications() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const nextTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [overdueDoses, upcomingDoses, overdueProcedures, criticalPatients, expectedDischarges, beds] =
    await Promise.all([
      prisma.medicationDose.findMany({
        where: { status: 'PENDING', scheduledAt: { lt: now } },
        orderBy: { scheduledAt: 'asc' },
        take: 12,
        include: {
          hospitalization: {
            include: { animal: true, bed: true }
          }
        }
      }),
      prisma.medicationDose.findMany({
        where: { status: 'PENDING', scheduledAt: { gte: now, lte: nextTwoHours } },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        include: {
          hospitalization: {
            include: { animal: true, bed: true }
          }
        }
      }),
      prisma.procedure.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          scheduledAt: { lt: now }
        },
        orderBy: { scheduledAt: 'asc' },
        take: 12,
        include: {
          hospitalization: {
            include: { animal: true, bed: true }
          }
        }
      }),
      prisma.hospitalization.findMany({
        where: { status: 'CRITICAL', dischargedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        include: { animal: true, bed: true }
      }),
      prisma.hospitalization.findMany({
        where: {
          dischargedAt: null,
          status: { in: activeStatuses },
          expectedDischargeAt: { gte: todayStart, lte: todayEnd }
        },
        orderBy: { expectedDischargeAt: 'asc' },
        take: 8,
        include: { animal: true, bed: true }
      }),
      prisma.bed.findMany({
        where: { active: true },
        include: {
          hospitalizations: {
            where: { dischargedAt: null, status: { in: activeStatuses } },
            take: 1
          }
        }
      })
    ]);

  const notifications: NotificationItem[] = [
    ...overdueDoses.map((dose) => ({
      id: `dose-overdue-${dose.id}`,
      level: 'danger' as const,
      category: 'medication' as const,
      title: `Dose atrasada: ${dose.medication}`,
      description: `${dose.hospitalization.animal.name} • ${dose.hospitalization.bed?.name ?? 'Sem leito'}`,
      occurredAt: dose.scheduledAt.toISOString(),
      href: '/medicacoes'
    })),
    ...overdueProcedures.map((procedure) => ({
      id: `procedure-overdue-${procedure.id}`,
      level: 'warning' as const,
      category: 'procedure' as const,
      title: `Procedimento atrasado: ${procedure.title}`,
      description: `${procedure.hospitalization.animal.name} • ${procedure.hospitalization.bed?.name ?? 'Sem leito'}`,
      occurredAt: procedure.scheduledAt.toISOString(),
      href: '/procedimentos'
    })),
    ...criticalPatients.map((hospitalization) => ({
      id: `critical-${hospitalization.id}`,
      level: 'danger' as const,
      category: 'hospitalization' as const,
      title: `Paciente crítico: ${hospitalization.animal.name}`,
      description: `${hospitalization.bed?.name ?? 'Sem leito'} • acompanhamento imediato`,
      occurredAt: hospitalization.updatedAt.toISOString(),
      href: `/internacoes/${hospitalization.id}`
    })),
    ...upcomingDoses.map((dose) => ({
      id: `dose-upcoming-${dose.id}`,
      level: 'info' as const,
      category: 'medication' as const,
      title: `Próxima dose: ${dose.medication}`,
      description: `${dose.hospitalization.animal.name} • ${dose.hospitalization.bed?.name ?? 'Sem leito'}`,
      occurredAt: dose.scheduledAt.toISOString(),
      href: '/medicacoes'
    })),
    ...expectedDischarges.map((hospitalization) => ({
      id: `discharge-${hospitalization.id}`,
      level: 'success' as const,
      category: 'hospitalization' as const,
      title: `Alta prevista: ${hospitalization.animal.name}`,
      description: `${hospitalization.bed?.name ?? 'Sem leito'} • previsão para hoje`,
      occurredAt: hospitalization.expectedDischargeAt!.toISOString(),
      href: `/internacoes/${hospitalization.id}`
    }))
  ];

  const availableBeds = beds.filter((bed) => bed.hospitalizations.length === 0).length;
  if (availableBeds > 0) {
    notifications.push({
      id: 'available-beds',
      level: 'success',
      category: 'bed',
      title: `${availableBeds} leito(s) disponível(is)`,
      description: 'Há capacidade disponível para novas internações.',
      occurredAt: now.toISOString(),
      href: '/leitos'
    });
  }

  const priority = { danger: 0, warning: 1, info: 2, success: 3 } as const;
  notifications.sort((a, b) => {
    const levelDifference = priority[a.level] - priority[b.level];
    if (levelDifference !== 0) return levelDifference;
    return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
  });

  return {
    items: notifications,
    summary: {
      total: notifications.length,
      urgent: notifications.filter((item) => item.level === 'danger').length,
      warning: notifications.filter((item) => item.level === 'warning').length,
      info: notifications.filter((item) => item.level === 'info').length
    },
    generatedAt: now.toISOString()
  };
}
