import { z } from 'zod';

export const loginSchema=z.object({
  email:z.string().trim().email('Informe um e-mail válido.'),
  password:z.string().min(1,'Informe a senha.'),
});

const role=z.enum(['ADMIN','VETERINARIAN','ASSISTANT','RECEPTIONIST']);

export const userCreateSchema=z.object({
  name:z.string().trim().min(2,'Informe o nome.').max(100),
  email:z.string().trim().email('Informe um e-mail válido.'),
  password:z.string().min(8,'A senha deve ter pelo menos 8 caracteres.').max(100),
  role,
});

export const userUpdateSchema=z.object({
  name:z.string().trim().min(2).max(100),
  email:z.string().trim().email(),
  password:z.string().max(100).optional().or(z.literal('')),
  role,
});
