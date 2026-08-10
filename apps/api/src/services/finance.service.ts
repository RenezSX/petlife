import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
type Input={type:string;description:string;category:string;amount:number;status:string;paymentMethod?:string;occurredAt:string;dueAt?:string;paidAt?:string;animalId?:string;hospitalizationId?:string;notes?:string};
const clean=(v?:string)=>v?.trim()||null;
export async function listFinance(query:Record<string,unknown>){
 const search=String(query.search??'').trim(),type=String(query.type??'all'),status=String(query.status??'all'),month=String(query.month??'');
 const where:any={...(type!=='all'?{type}:{}),...(status!=='all'?{status}:{}),...(search?{OR:[{description:{contains:search}},{category:{contains:search}}]}:{})};
 if(month){const [y,m]=month.split('-').map(Number);where.occurredAt={gte:new Date(y,m-1,1),lt:new Date(y,m,1)}}
 return prisma.financialEntry.findMany({where,include:{animal:{include:{tutor:true}},hospitalization:true},orderBy:{occurredAt:'desc'}});
}
export async function financeStats(month?:string){
 const now=new Date();const key=month||`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;const[y,m]=key.split('-').map(Number);const start=new Date(y,m-1,1),end=new Date(y,m,1);
 const items=await prisma.financialEntry.findMany({where:{occurredAt:{gte:start,lt:end},status:{not:'CANCELED'}}});
 const income=items.filter(i=>i.type==='INCOME'&&i.status==='PAID').reduce((s,i)=>s+i.amount,0);
 const expense=items.filter(i=>i.type==='EXPENSE'&&i.status==='PAID').reduce((s,i)=>s+i.amount,0);
 const pending=items.filter(i=>i.status==='PENDING').reduce((s,i)=>s+i.amount,0);
 return{month:key,income,expense,balance:income-expense,pending,total:items.length};
}
export async function createFinance(data:Input){return prisma.financialEntry.create({data:{type:data.type,description:data.description.trim(),category:data.category.trim(),amount:data.amount,status:data.status,paymentMethod:clean(data.paymentMethod),occurredAt:new Date(`${data.occurredAt}T12:00:00`),dueAt:data.dueAt?new Date(`${data.dueAt}T12:00:00`):null,paidAt:data.status==='PAID'?(data.paidAt?new Date(`${data.paidAt}T12:00:00`):new Date()):null,animalId:clean(data.animalId),hospitalizationId:clean(data.hospitalizationId),notes:clean(data.notes)}})}
export async function updateFinance(id:string,data:Input){const item=await prisma.financialEntry.findUnique({where:{id}});if(!item)throw new AppError(404,'Lançamento não encontrado.');return prisma.financialEntry.update({where:{id},data:{type:data.type,description:data.description.trim(),category:data.category.trim(),amount:data.amount,status:data.status,paymentMethod:clean(data.paymentMethod),occurredAt:new Date(`${data.occurredAt}T12:00:00`),dueAt:data.dueAt?new Date(`${data.dueAt}T12:00:00`):null,paidAt:data.status==='PAID'?(data.paidAt?new Date(`${data.paidAt}T12:00:00`):item.paidAt??new Date()):null,animalId:clean(data.animalId),hospitalizationId:clean(data.hospitalizationId),notes:clean(data.notes)}})}
export async function removeFinance(id:string){const item=await prisma.financialEntry.findUnique({where:{id}});if(!item)throw new AppError(404,'Lançamento não encontrado.');await prisma.financialEntry.delete({where:{id}});return{message:'Lançamento removido.'}}
