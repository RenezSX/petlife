import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export type AuthUser = {
  id:string;
  name:string;
  email:string;
  role:string;
};

function publicUser(user:{id:string;name:string;email:string;role:string}):AuthUser {
  return { id:user.id, name:user.name, email:user.email, role:user.role };
}

export async function login(email:string,password:string) {
  const user = await prisma.user.findUnique({ where:{ email:email.trim().toLowerCase() } });
  if (!user || !user.active) throw new AppError(401,'E-mail ou senha inválidos.');

  const valid = await bcrypt.compare(password,user.passwordHash);
  if (!valid) throw new AppError(401,'E-mail ou senha inválidos.');

  const options:SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  const token = jwt.sign(
    { sub:user.id, name:user.name, email:user.email, role:user.role },
    env.JWT_SECRET,
    options,
  );

  return { token, user:publicUser(user) };
}

export async function getAuthenticatedUser(id:string) {
  const user = await prisma.user.findUnique({
    where:{ id },
    select:{ id:true,name:true,email:true,role:true,active:true },
  });
  if (!user || !user.active) throw new AppError(401,'Usuário não autorizado.');
  return publicUser(user);
}
