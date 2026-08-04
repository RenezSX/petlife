import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type HospitalizationInput = {
  animalId: string;
  bedId?: string;
  status: string;
  priority: string;
  reason: string;
  diagnosis?: string;
  veterinarian?: string;
  notes?: string;
  admittedAt?: string;
  expectedDischargeAt?: string;
};

const activeStatuses = ['WAITING', 'HOSPITALIZED', 'OBSERVATION', 'PROCEDURE', 'RECOVERY', 'CRITICAL', 'DISCHARGE_EXPECTED'];
const clean = (value?: string) => value?.trim() || null;

export async function listHospitalizations(search: string, status: string, priority: string, page: number, pageSize: number) {
  const where: Prisma.HospitalizationWhereInput = {
    ...(status === 'active' ? { dischargedAt: null } : status === 'discharged' ? { dischargedAt: { not: null } } : status !== 'all' ? { status } : {}),
    ...(priority !== 'all' ? { priority } : {}),
    ...(search ? { OR: [
      { animal: { name: { contains: search } } },
      { animal: { tutor: { name: { contains: search } } } },
      { reason: { contains: search } },
      { veterinarian: { contains: search } },
      { bed: { name: { contains: search } } },
    ] } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.hospitalization.findMany({
      where,
      include: { animal: { include: { tutor: true } }, bed: true },
      orderBy: [{ dischargedAt: 'asc' }, { admittedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.hospitalization.count({ where }),
  ]);

  return { items, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function getHospitalization(id: string) {
  const item = await prisma.hospitalization.findUnique({
    where: { id },
    include: { animal: { include: { tutor: true } }, bed: true, procedures: true, medicationDoses: true },
  });
  if (!item) throw new AppError(404, 'Internação não encontrada.');
  return item;
}

async function validateAvailability(data: HospitalizationInput, currentId?: string) {
  const animal = await prisma.animal.findUnique({ where: { id: data.animalId } });
  if (!animal || !animal.active) throw new AppError(404, 'Animal não encontrado ou inativo.');

  const activeForAnimal = await prisma.hospitalization.findFirst({
    where: { animalId: data.animalId, dischargedAt: null, ...(currentId ? { id: { not: currentId } } : {}) },
  });
  if (activeForAnimal) throw new AppError(409, 'Este animal já possui uma internação ativa.');

  if (data.bedId) {
    const bed = await prisma.bed.findUnique({ where: { id: data.bedId } });
    if (!bed || !bed.active) throw new AppError(404, 'Leito não encontrado ou inativo.');
    const occupied = await prisma.hospitalization.findFirst({
      where: { bedId: data.bedId, dischargedAt: null, ...(currentId ? { id: { not: currentId } } : {}) },
    });
    if (occupied) throw new AppError(409, 'Este leito já está ocupado.');
  }
}

function normalize(data: HospitalizationInput) {
  return {
    animalId: data.animalId,
    bedId: clean(data.bedId),
    status: data.status,
    priority: data.priority,
    reason: data.reason.trim(),
    diagnosis: clean(data.diagnosis),
    veterinarian: clean(data.veterinarian),
    notes: clean(data.notes),
    ...(data.admittedAt ? { admittedAt: new Date(data.admittedAt) } : {}),
    expectedDischargeAt: data.expectedDischargeAt ? new Date(data.expectedDischargeAt) : null,
  };
}

export async function createHospitalization(data: HospitalizationInput) {
  await validateAvailability(data);
  return prisma.hospitalization.create({ data: normalize(data), include: { animal: { include: { tutor: true } }, bed: true } });
}

export async function updateHospitalization(id: string, data: HospitalizationInput) {
  const current = await getHospitalization(id);
  if (current.dischargedAt) throw new AppError(409, 'Uma internação finalizada não pode ser alterada.');
  await validateAvailability(data, id);
  return prisma.hospitalization.update({ where: { id }, data: normalize(data), include: { animal: { include: { tutor: true } }, bed: true } });
}

export async function dischargeHospitalization(id: string, summary: string, dischargedAt?: string) {
  const current = await getHospitalization(id);
  if (current.dischargedAt) throw new AppError(409, 'Esta internação já foi finalizada.');
  return prisma.hospitalization.update({
    where: { id },
    data: { status: 'DISCHARGED', dischargedAt: dischargedAt ? new Date(dischargedAt) : new Date(), dischargeSummary: summary.trim() },
    include: { animal: { include: { tutor: true } }, bed: true },
  });
}

export async function listHospitalizationOptions() {
  const [animals, beds] = await Promise.all([
    prisma.animal.findMany({
      where: { active: true, hospitalizations: { none: { dischargedAt: null } } },
      select: { id: true, name: true, species: true, tutor: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.bed.findMany({
      where: { active: true, hospitalizations: { none: { dischargedAt: null } } },
      select: { id: true, name: true, sector: true },
      orderBy: [{ sector: 'asc' }, { name: 'asc' }],
    }),
  ]);
  return { animals, beds };
}

export async function getHospitalizationStats() {
  const [active, critical, dischargeExpected, totalBeds, occupiedBeds] = await Promise.all([
    prisma.hospitalization.count({ where: { status: { in: activeStatuses }, dischargedAt: null } }),
    prisma.hospitalization.count({ where: { status: 'CRITICAL', dischargedAt: null } }),
    prisma.hospitalization.count({ where: { status: 'DISCHARGE_EXPECTED', dischargedAt: null } }),
    prisma.bed.count({ where: { active: true } }),
    prisma.hospitalization.count({ where: { dischargedAt: null, bedId: { not: null } } }),
  ]);
  return { active, critical, dischargeExpected, totalBeds, occupiedBeds, availableBeds: Math.max(0, totalBeds - occupiedBeds) };
}
