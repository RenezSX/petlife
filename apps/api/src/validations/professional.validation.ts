import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));

export const professionalBodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do profissional.'),
  role: z.enum(['VETERINARIAN', 'ASSISTANT', 'RECEPTIONIST', 'GROOMER', 'OTHER']),
  crmv: optionalText,
  specialty: optionalText,
  phone: optionalText,
  email: z.string().trim().email('Informe um e-mail válido.').optional().or(z.literal('')),
  notes: optionalText,
});

export const professionalListQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
  role: z.string().trim().optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});
