import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type BedInput = { name: string; sector: string; notes?: string };
const clean = (value?: string) => value?.trim() || null;

export async function listBeds() {
  const beds = await prisma.bed.findMany({
    include: { hospitalizations: { where: { dischargedAt: null }, include: { animal: true }, take: 1 } },
    orderBy: [{ sector: 'asc' }, { name: 'asc' }],
  });
  return beds.map((bed) => ({ ...bed, currentHospitalization: bed.hospitalizations[0] ?? null, hospitalizations: undefined }));
}

export async function createBed(data: BedInput) {
  try { return await prisma.bed.create({ data: { name: data.name.trim(), sector: data.sector.trim(), notes: clean(data.notes) } }); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new AppError(409, 'Já existe um leito com este nome.'); throw error; }
}

export async function updateBed(id: string, data: BedInput) {
  const bed = await prisma.bed.findUnique({ where: { id } });
  if (!bed) throw new AppError(404, 'Leito não encontrado.');
  try { return await prisma.bed.update({ where: { id }, data: { name: data.name.trim(), sector: data.sector.trim(), notes: clean(data.notes) } }); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new AppError(409, 'Já existe um leito com este nome.'); throw error; }
}

export async function setBedActive(id: string, active: boolean) {
  const bed = await prisma.bed.findUnique({ where: { id } });
  if (!bed) throw new AppError(404, 'Leito não encontrado.');
  if (!active) {
    const occupied = await prisma.hospitalization.findFirst({ where: { bedId: id, dischargedAt: null } });
    if (occupied) throw new AppError(409, 'Não é possível inativar um leito ocupado.');
  }
  return prisma.bed.update({ where: { id }, data: { active } });
}
