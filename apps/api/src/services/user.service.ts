import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

type CreateInput={name:string;email:string;password:string;role:string};
type UpdateInput={name:string;email:string;role:string;password?:string};

const publicSelect={id:true,name:true,email:true,role:true,active:true,createdAt:true,updatedAt:true} as const;

export async function listUsers() {
  return prisma.user.findMany({ select:publicSelect, orderBy:[{active:'desc'},{name:'asc'}] });
}

export async function createUser(data:CreateInput) {
  const email=data.email.trim().toLowerCase();
  const exists=await prisma.user.findUnique({where:{email}});
  if(exists) throw new AppError(409,'Já existe um usuário com este e-mail.');
  const passwordHash=await bcrypt.hash(data.password,12);
  return prisma.user.create({
    data:{name:data.name.trim(),email,passwordHash,role:data.role},
    select:publicSelect,
  });
}

export async function updateUser(id:string,data:UpdateInput) {
  const current=await prisma.user.findUnique({where:{id}});
  if(!current) throw new AppError(404,'Usuário não encontrado.');
  const email=data.email.trim().toLowerCase();
  const duplicate=await prisma.user.findFirst({where:{email,id:{not:id}}});
  if(duplicate) throw new AppError(409,'Já existe um usuário com este e-mail.');
  const passwordHash=data.password?.trim()?await bcrypt.hash(data.password,12):undefined;
  return prisma.user.update({
    where:{id},
    data:{name:data.name.trim(),email,role:data.role,...(passwordHash?{passwordHash}:{})},
    select:publicSelect,
  });
}

export async function setUserActive(id:string,active:boolean,currentUserId:string) {
  if(id===currentUserId&&!active) throw new AppError(400,'Você não pode inativar sua própria conta.');
  const item=await prisma.user.findUnique({where:{id}});
  if(!item) throw new AppError(404,'Usuário não encontrado.');
  return prisma.user.update({where:{id},data:{active},select:publicSelect});
}
