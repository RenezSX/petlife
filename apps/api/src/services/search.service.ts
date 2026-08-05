import { prisma } from '../config/prisma.js';

const LIMIT_PER_GROUP = 6;

export type GlobalSearchItem = {
  id: string;
  type: 'tutor' | 'animal' | 'hospitalization' | 'bed' | 'procedure' | 'medication';
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
};

export async function globalSearch(rawQuery: string) {
  const query = rawQuery.trim();

  if (query.length < 2) {
    return { query, total: 0, groups: [] };
  }

  const numericQuery = query.replace(/\D/g, '');

  const [tutors, animals, hospitalizations, beds, procedures, medications] = await Promise.all([
    prisma.tutor.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          ...(numericQuery ? [{ cpf: { contains: numericQuery } }] : []),
          { phone: { contains: query } },
          { whatsapp: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: { id: true, name: true, phone: true, email: true, active: true },
      orderBy: { name: 'asc' },
      take: LIMIT_PER_GROUP,
    }),
    prisma.animal.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { species: { contains: query } },
          { breed: { contains: query } },
          { microchip: { contains: query } },
          { tutor: { name: { contains: query } } },
        ],
      },
      select: {
        id: true,
        name: true,
        species: true,
        breed: true,
        active: true,
        tutor: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      take: LIMIT_PER_GROUP,
    }),
    prisma.hospitalization.findMany({
      where: {
        OR: [
          { animal: { name: { contains: query } } },
          { animal: { tutor: { name: { contains: query } } } },
          { reason: { contains: query } },
          { diagnosis: { contains: query } },
          { veterinarian: { contains: query } },
          { bed: { name: { contains: query } } },
        ],
      },
      select: {
        id: true,
        status: true,
        priority: true,
        animal: { select: { name: true, tutor: { select: { name: true } } } },
        bed: { select: { name: true, sector: true } },
      },
      orderBy: { admittedAt: 'desc' },
      take: LIMIT_PER_GROUP,
    }),
    prisma.bed.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { sector: { contains: query } },
          { notes: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        sector: true,
        active: true,
        hospitalizations: {
          where: { status: { in: ['HOSPITALIZED', 'OBSERVATION', 'CRITICAL'] }, dischargedAt: null },
          select: { animal: { select: { name: true } } },
          take: 1,
        },
      },
      orderBy: [{ sector: 'asc' }, { name: 'asc' }],
      take: LIMIT_PER_GROUP,
    }),
    prisma.procedure.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { responsible: { contains: query } },
          { hospitalization: { animal: { name: { contains: query } } } },
          { hospitalization: { animal: { tutor: { name: { contains: query } } } } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledAt: true,
        hospitalization: { select: { animal: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: LIMIT_PER_GROUP,
    }),
    prisma.medicationPrescription.findMany({
      where: {
        OR: [
          { medication: { contains: query } },
          { dose: { contains: query } },
          { route: { contains: query } },
          { hospitalization: { animal: { name: { contains: query } } } },
          { hospitalization: { animal: { tutor: { name: { contains: query } } } } },
        ],
      },
      select: {
        id: true,
        medication: true,
        dose: true,
        unit: true,
        route: true,
        active: true,
        hospitalization: { select: { animal: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: LIMIT_PER_GROUP,
    }),
  ]);

  const groups: Array<{ key: string; label: string; items: GlobalSearchItem[] }> = [
    {
      key: 'tutors',
      label: 'Tutores',
      items: tutors.map((item) => ({
        id: item.id,
        type: 'tutor',
        title: item.name,
        subtitle: item.phone || item.email || 'Sem contato informado',
        meta: item.active ? 'Ativo' : 'Inativo',
        href: '/tutores',
      })),
    },
    {
      key: 'animals',
      label: 'Animais',
      items: animals.map((item) => ({
        id: item.id,
        type: 'animal',
        title: item.name,
        subtitle: `${item.species}${item.breed ? ` • ${item.breed}` : ''} • ${item.tutor.name}`,
        meta: item.active ? 'Ativo' : 'Inativo',
        href: '/animais',
      })),
    },
    {
      key: 'hospitalizations',
      label: 'Internações',
      items: hospitalizations.map((item) => ({
        id: item.id,
        type: 'hospitalization',
        title: item.animal.name,
        subtitle: `${item.animal.tutor.name}${item.bed ? ` • ${item.bed.name}` : ' • Sem leito'}`,
        meta: `${item.status} • ${item.priority}`,
        href: `/internacoes/${item.id}`,
      })),
    },
    {
      key: 'beds',
      label: 'Leitos',
      items: beds.map((item) => ({
        id: item.id,
        type: 'bed',
        title: item.name,
        subtitle: `${item.sector}${item.hospitalizations[0] ? ` • ${item.hospitalizations[0].animal.name}` : ' • Disponível'}`,
        meta: item.active ? 'Ativo' : 'Inativo',
        href: '/leitos',
      })),
    },
    {
      key: 'procedures',
      label: 'Procedimentos',
      items: procedures.map((item) => ({
        id: item.id,
        type: 'procedure',
        title: item.title,
        subtitle: `${item.hospitalization.animal.name} • ${item.scheduledAt.toLocaleString('pt-BR')}`,
        meta: item.status,
        href: '/procedimentos',
      })),
    },
    {
      key: 'medications',
      label: 'Medicações',
      items: medications.map((item) => ({
        id: item.id,
        type: 'medication',
        title: item.medication,
        subtitle: `${item.dose} ${item.unit} • ${item.route} • ${item.hospitalization.animal.name}`,
        meta: item.active ? 'Ativa' : 'Suspensa',
        href: '/medicacoes',
      })),
    },
  ].filter((group) => group.items.length > 0);

  return {
    query,
    total: groups.reduce((sum, group) => sum + group.items.length, 0),
    groups,
  };
}
