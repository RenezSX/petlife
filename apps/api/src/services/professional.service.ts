import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type ProfessionalInput = {
  name: string;
  role: string;
  crmv?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

const clean = (value?: string) => value?.trim() || null;

function professionalDatabaseError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') throw new AppError(409, 'Já existe um profissional com este CRMV.');
    if (error.code === 'P2021' || error.code === 'P2022') {
      throw new AppError(503, 'O banco ainda não possui a estrutura de profissionais. Execute npm run db:migrate e reinicie a API.');
    }
  }
  throw error;
}

export async function listProfessionals(search: string, status: string, role: string, page: number, pageSize: number) {
  const where: Prisma.ProfessionalWhereInput = {
    ...(status === 'active' ? { active: true } : status === 'inactive' ? { active: false } : {}),
    ...(role !== 'all' ? { role } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { crmv: { contains: search } },
        { specialty: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ],
    } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.professional.findMany({ where, orderBy: [{ active: 'desc' }, { name: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.professional.count({ where }),
  ]);

  return { items, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function getProfessional(id: string) {
  const item = await prisma.professional.findUnique({ where: { id } });
  if (!item) throw new AppError(404, 'Profissional não encontrado.');
  return item;
}

export async function professionalOptions() {
  return prisma.professional.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true, crmv: true, specialty: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
}

export async function professionalStats() {
  const [total, active, veterinarians, support] = await Promise.all([
    prisma.professional.count(),
    prisma.professional.count({ where: { active: true } }),
    prisma.professional.count({ where: { active: true, role: 'VETERINARIAN' } }),
    prisma.professional.count({ where: { active: true, role: { not: 'VETERINARIAN' } } }),
  ]);
  return { total, active, veterinarians, support, inactive: total - active };
}

export async function createProfessional(data: ProfessionalInput) {
  if (data.crmv?.trim()) {
    const duplicate = await prisma.professional.findUnique({ where: { crmv: data.crmv.trim() } });
    if (duplicate) throw new AppError(409, 'Já existe um profissional com este CRMV.');
  }
  try {
    return await prisma.professional.create({ data: {
      name: data.name.trim(), role: data.role, crmv: clean(data.crmv), specialty: clean(data.specialty),
      phone: clean(data.phone), email: clean(data.email), notes: clean(data.notes),
    }});
  } catch (error) {
    professionalDatabaseError(error);
  }
}

export async function updateProfessional(id: string, data: ProfessionalInput) {
  await getProfessional(id);
  if (data.crmv?.trim()) {
    const duplicate = await prisma.professional.findFirst({ where: { crmv: data.crmv.trim(), id: { not: id } } });
    if (duplicate) throw new AppError(409, 'Já existe um profissional com este CRMV.');
  }
  try {
    return await prisma.professional.update({ where: { id }, data: {
      name: data.name.trim(), role: data.role, crmv: clean(data.crmv), specialty: clean(data.specialty),
      phone: clean(data.phone), email: clean(data.email), notes: clean(data.notes),
    }});
  } catch (error) {
    professionalDatabaseError(error);
  }
}

export async function setProfessionalActive(id: string, active: boolean) {
  await getProfessional(id);
  return prisma.professional.update({ where: { id }, data: { active } });
}
