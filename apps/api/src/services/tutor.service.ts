import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type TutorInput = { name:string; cpf?:string; phone:string; whatsapp?:string; email?:string; address?:string; notes?:string };
const clean = (value?: string) => value?.trim() || null;

export async function listTutors(search:string,page:number,pageSize:number,status:string) {
  const where: Prisma.TutorWhereInput = {
    ...(status !== 'all' ? { active: status === 'active' } : {}),
    ...(search ? { OR: [
      { name: { contains: search } }, { cpf: { contains: search.replace(/\D/g,'') } },
      { phone: { contains: search } }, { email: { contains: search } }
    ] } : {})
  };
  const [items,total] = await prisma.$transaction([
    prisma.tutor.findMany({ where, include:{ _count:{select:{animals:true}} }, orderBy:{name:'asc'}, skip:(page-1)*pageSize, take:pageSize }),
    prisma.tutor.count({where})
  ]);
  return { items, pagination:{page,pageSize,total,totalPages:Math.max(1,Math.ceil(total/pageSize))} };
}

export async function listTutorOptions() { return prisma.tutor.findMany({where:{active:true},select:{id:true,name:true,phone:true},orderBy:{name:'asc'}}); }
export async function getTutor(id:string) {
  const tutor = await prisma.tutor.findUnique({where:{id},include:{animals:{orderBy:{name:'asc'}}}});
  if (!tutor) throw new AppError(404,'Tutor não encontrado.');
  return tutor;
}
export async function createTutor(data:TutorInput) {
  try { return await prisma.tutor.create({data:{...data,cpf:clean(data.cpf)?.replace(/\D/g,''),whatsapp:clean(data.whatsapp),email:clean(data.email),address:clean(data.address),notes:clean(data.notes)}}); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') throw new AppError(409,'Já existe um tutor com este CPF.'); throw error; }
}
export async function updateTutor(id:string,data:TutorInput) {
  await getTutor(id);
  try { return await prisma.tutor.update({where:{id},data:{...data,cpf:clean(data.cpf)?.replace(/\D/g,''),whatsapp:clean(data.whatsapp),email:clean(data.email),address:clean(data.address),notes:clean(data.notes)}}); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002') throw new AppError(409,'Já existe um tutor com este CPF.'); throw error; }
}
export async function setTutorActive(id:string,active:boolean) { await getTutor(id); return prisma.tutor.update({where:{id},data:{active}}); }
