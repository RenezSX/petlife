import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type AnimalInput = { name:string; species:string; breed?:string; sex?:string; birthDate?:string; approximateAge?:string; weight?:number|''; color?:string; microchip?:string; neutered?:boolean; allergies?:string; previousDiseases?:string; continuousMedications?:string; notes?:string; photoUrl?:string; tutorId:string };
const clean = (value?: string) => value?.trim() || null;
export async function listAnimals(search:string,species:string,tutorId:string,page:number,pageSize:number,status:string) {
  const where: Prisma.AnimalWhereInput = {
    ...(status!=='all'?{active:status==='active'}:{}), ...(species?{species}:{}), ...(tutorId?{tutorId}:{}),
    ...(search?{OR:[{name:{contains:search}},{breed:{contains:search}},{microchip:{contains:search}},{tutor:{name:{contains:search}}}]}:{})
  };
  const [items,total] = await prisma.$transaction([
    prisma.animal.findMany({where,include:{tutor:{select:{id:true,name:true,phone:true}}},orderBy:{name:'asc'},skip:(page-1)*pageSize,take:pageSize}),
    prisma.animal.count({where})
  ]);
  return {items,pagination:{page,pageSize,total,totalPages:Math.max(1,Math.ceil(total/pageSize))}};
}
export async function getAnimal(id:string) { const animal=await prisma.animal.findUnique({where:{id},include:{tutor:true,hospitalizations:{orderBy:{admittedAt:'desc'},take:5}}}); if(!animal) throw new AppError(404,'Animal não encontrado.'); return animal; }
function dataFor(data:AnimalInput) { return {...data,breed:clean(data.breed),sex:clean(data.sex),birthDate:data.birthDate?new Date(`${data.birthDate}T12:00:00`):null,approximateAge:clean(data.approximateAge),weight:data.weight===''||data.weight===undefined?null:Number(data.weight),color:clean(data.color),microchip:clean(data.microchip),neutered:Boolean(data.neutered),allergies:clean(data.allergies),previousDiseases:clean(data.previousDiseases),continuousMedications:clean(data.continuousMedications),notes:clean(data.notes),photoUrl:clean(data.photoUrl)}; }
export async function createAnimal(data:AnimalInput) { const tutor=await prisma.tutor.findFirst({where:{id:data.tutorId,active:true}}); if(!tutor) throw new AppError(400,'Selecione um tutor ativo.'); try{return await prisma.animal.create({data:dataFor(data),include:{tutor:true}})}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')throw new AppError(409,'Este microchip já está cadastrado.');throw error;} }
export async function updateAnimal(id:string,data:AnimalInput) { await getAnimal(id); const tutor=await prisma.tutor.findFirst({where:{id:data.tutorId,active:true}}); if(!tutor)throw new AppError(400,'Selecione um tutor ativo.'); try{return await prisma.animal.update({where:{id},data:dataFor(data),include:{tutor:true}})}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')throw new AppError(409,'Este microchip já está cadastrado.');throw error;} }
export async function setAnimalActive(id:string,active:boolean) { await getAnimal(id); return prisma.animal.update({where:{id},data:{active}}); }
