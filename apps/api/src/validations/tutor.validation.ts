import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));

export const tutorBodySchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome completo.'),
  cpf: optionalText.refine((value) => !value || /^\d{11}$/.test(value.replace(/\D/g, '')), 'CPF deve conter 11 números.'),
  phone: z.string().trim().min(8, 'Informe um telefone válido.'),
  whatsapp: optionalText,
  email: z.string().trim().email('Informe um e-mail válido.').optional().or(z.literal('')),
  address: optionalText,
  notes: optionalText,
});

export const listQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
});
