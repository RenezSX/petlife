import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'E-mail ou senha inválidos.');
  }
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  const token = jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, { ...options, subject: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export async function currentUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, active: true } });
  if (!user || !user.active) throw new AppError(401, 'Usuário não encontrado ou inativo.');
  return user;
}
