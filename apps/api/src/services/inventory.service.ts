import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type ItemInput={
  name:string;category:string;unit:string;currentQuantity:number;minimumQuantity:number;
  batch?:string;expiryDate?:string;supplier?:string;location?:string;notes?:string;
};
type MovementInput={type:string;quantity:number;reason:string;responsible?:string;notes?:string};
const clean=(value?:string)=>value?.trim()||null;

export async function listInventory(query:Record<string,unknown>){
  const search=String(query.search??'').trim();
  const category=String(query.category??'all');
  const status=String(query.status??'active');
  const stock=String(query.stock??'all');

  const items=await prisma.inventoryItem.findMany({
    where:{
      ...(status==='active'?{active:true}:status==='inactive'?{active:false}:{}),
      ...(category!=='all'?{category}:{}),
      ...(search?{OR:[
        {name:{contains:search}},
        {batch:{contains:search}},
        {supplier:{contains:search}},
        {location:{contains:search}},
      ]}:{}),
    },
    include:{movements:{orderBy:{createdAt:'desc'},take:3}},
    orderBy:[{active:'desc'},{name:'asc'}],
  });

  const now=new Date();
  const thirtyDays=new Date(now.getTime()+30*24*60*60*1000);
  return items.filter((item)=>{
    if(stock==='low') return item.currentQuantity<=item.minimumQuantity;
    if(stock==='zero') return item.currentQuantity<=0;
    if(stock==='expiring') return Boolean(item.expiryDate&&item.expiryDate>=now&&item.expiryDate<=thirtyDays);
    if(stock==='expired') return Boolean(item.expiryDate&&item.expiryDate<now);
    return true;
  });
}

export async function inventoryStats(){
  const items=await prisma.inventoryItem.findMany({where:{active:true}});
  const now=new Date();
  const thirtyDays=new Date(now.getTime()+30*24*60*60*1000);
  return{
    total:items.length,
    low:items.filter(i=>i.currentQuantity<=i.minimumQuantity).length,
    zero:items.filter(i=>i.currentQuantity<=0).length,
    expiring:items.filter(i=>i.expiryDate&&i.expiryDate>=now&&i.expiryDate<=thirtyDays).length,
    expired:items.filter(i=>i.expiryDate&&i.expiryDate<now).length,
  };
}

export async function createInventoryItem(data:ItemInput){
  return prisma.$transaction(async tx=>{
    const item=await tx.inventoryItem.create({data:{
      name:data.name.trim(),category:data.category,unit:data.unit.trim(),
      currentQuantity:data.currentQuantity,minimumQuantity:data.minimumQuantity,
      batch:clean(data.batch),expiryDate:data.expiryDate?new Date(`${data.expiryDate}T12:00:00`):null,
      supplier:clean(data.supplier),location:clean(data.location),notes:clean(data.notes),
    }});
    if(data.currentQuantity>0){
      await tx.inventoryMovement.create({data:{
        itemId:item.id,type:'IN',quantity:data.currentQuantity,beforeQty:0,afterQty:data.currentQuantity,
        reason:'Estoque inicial',responsible:'Sistema',notes:null,
      }});
    }
    return item;
  });
}

export async function updateInventoryItem(id:string,data:ItemInput){
  const item=await prisma.inventoryItem.findUnique({where:{id}});
  if(!item)throw new AppError(404,'Item de estoque não encontrado.');
  const quantityChanged=item.currentQuantity!==data.currentQuantity;
  return prisma.$transaction(async tx=>{
    const updated=await tx.inventoryItem.update({where:{id},data:{
      name:data.name.trim(),category:data.category,unit:data.unit.trim(),
      currentQuantity:data.currentQuantity,minimumQuantity:data.minimumQuantity,
      batch:clean(data.batch),expiryDate:data.expiryDate?new Date(`${data.expiryDate}T12:00:00`):null,
      supplier:clean(data.supplier),location:clean(data.location),notes:clean(data.notes),
    }});
    if(quantityChanged){
      await tx.inventoryMovement.create({data:{
        itemId:id,type:'ADJUSTMENT',quantity:Math.abs(data.currentQuantity-item.currentQuantity),
        beforeQty:item.currentQuantity,afterQty:data.currentQuantity,reason:'Ajuste durante edição',
        responsible:'Sistema',notes:null,
      }});
    }
    return updated;
  });
}

export async function setInventoryActive(id:string,active:boolean){
  const item=await prisma.inventoryItem.findUnique({where:{id}});
  if(!item)throw new AppError(404,'Item de estoque não encontrado.');
  return prisma.inventoryItem.update({where:{id},data:{active}});
}

export async function createMovement(id:string,data:MovementInput){
  return prisma.$transaction(async tx=>{
    const item=await tx.inventoryItem.findUnique({where:{id}});
    if(!item)throw new AppError(404,'Item de estoque não encontrado.');
    if(!item.active)throw new AppError(409,'Reative o item antes de movimentar o estoque.');

    const before=item.currentQuantity;
    let after=before;
    if(data.type==='IN') after=before+data.quantity;
    if(data.type==='OUT') after=before-data.quantity;
    if(data.type==='ADJUSTMENT') after=data.quantity;
    if(after<0)throw new AppError(409,`Estoque insuficiente. Disponível: ${before} ${item.unit}.`);

    await tx.inventoryItem.update({where:{id},data:{currentQuantity:after}});
    return tx.inventoryMovement.create({data:{
      itemId:id,type:data.type,quantity:data.type==='ADJUSTMENT'?Math.abs(after-before):data.quantity,
      beforeQty:before,afterQty:after,reason:data.reason.trim(),responsible:clean(data.responsible),notes:clean(data.notes),
    }});
  });
}

export async function listMovements(id:string){
  const item=await prisma.inventoryItem.findUnique({where:{id}});
  if(!item)throw new AppError(404,'Item de estoque não encontrado.');
  return prisma.inventoryMovement.findMany({where:{itemId:id},orderBy:{createdAt:'desc'},take:100});
}

export async function inventoryOptions(){
  return prisma.inventoryItem.findMany({
    where:{active:true},
    select:{id:true,name:true,unit:true,currentQuantity:true,minimumQuantity:true,category:true,batch:true,expiryDate:true},
    orderBy:{name:'asc'},
  });
}
