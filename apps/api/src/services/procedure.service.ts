import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type ProcedureInput = { hospitalizationId:string; title:string; description?:string; responsible?:string; scheduledAt:string; notes?:string };
const clean=(v?:string)=>v?.trim()||null;

export async function listProcedures(query:Record<string,unknown>){
  const status=String(query.status??'all'); const date=String(query.date??''); const search=String(query.search??'').trim();
  const where:any={
    ...(status!=='all'?{status}:{}),
    ...(search?{OR:[{title:{contains:search}},{responsible:{contains:search}},{hospitalization:{animal:{name:{contains:search}}}}]}:{}),
  };
  if(date){const start=new Date(`${date}T00:00:00`);const end=new Date(`${date}T23:59:59.999`);where.scheduledAt={gte:start,lte:end};}
  return prisma.procedure.findMany({where,include:{hospitalization:{include:{animal:{include:{tutor:true}},bed:true}}},orderBy:{scheduledAt:'asc'}});
}

export async function createProcedure(data:ProcedureInput){
  const hospitalization=await prisma.hospitalization.findUnique({where:{id:data.hospitalizationId}});
  if(!hospitalization||hospitalization.dischargedAt) throw new AppError(400,'Selecione uma internação ativa.');
  return prisma.procedure.create({data:{hospitalizationId:data.hospitalizationId,title:data.title.trim(),description:clean(data.description),responsible:clean(data.responsible),scheduledAt:new Date(data.scheduledAt),notes:clean(data.notes)}});
}

export async function updateProcedure(id:string,data:ProcedureInput){
  const item=await prisma.procedure.findUnique({where:{id}}); if(!item) throw new AppError(404,'Procedimento não encontrado.');
  return prisma.procedure.update({where:{id},data:{title:data.title.trim(),description:clean(data.description),responsible:clean(data.responsible),scheduledAt:new Date(data.scheduledAt),notes:clean(data.notes)}});
}

export async function changeProcedureStatus(id:string,data:{status:string;responsible?:string;notes?:string}){
  const item=await prisma.procedure.findUnique({where:{id}}); if(!item) throw new AppError(404,'Procedimento não encontrado.');
  return prisma.procedure.update({where:{id},data:{status:data.status,responsible:clean(data.responsible)??item.responsible,notes:clean(data.notes)??item.notes,completedAt:data.status==='COMPLETED'?new Date():data.status==='PENDING'?null:item.completedAt}});
}

export async function procedureStats(){
  const now=new Date(); const end=new Date(now); end.setHours(23,59,59,999); const start=new Date(now);start.setHours(0,0,0,0);
  const [today,pending,completed,overdue]=await Promise.all([
    prisma.procedure.count({where:{scheduledAt:{gte:start,lte:end}}}),
    prisma.procedure.count({where:{status:{in:['PENDING','IN_PROGRESS']}}}),
    prisma.procedure.count({where:{status:'COMPLETED',completedAt:{gte:start,lte:end}}}),
    prisma.procedure.count({where:{status:'PENDING',scheduledAt:{lt:now}}}),
  ]); return {today,pending,completed,overdue};
}

export async function procedureOptions(){return prisma.hospitalization.findMany({where:{dischargedAt:null},select:{id:true,animal:{select:{id:true,name:true,tutor:{select:{name:true}}}},bed:{select:{name:true,sector:true}}},orderBy:{admittedAt:'desc'}})}
