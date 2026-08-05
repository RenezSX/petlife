import { z } from 'zod';

export const procedureBodySchema = z.object({
  hospitalizationId: z.string().min(1, 'Selecione uma internação.'),
  title: z.string().trim().min(2, 'Informe o procedimento.'),
  description: z.string().trim().optional().default(''),
  responsible: z.string().trim().optional().default(''),
  scheduledAt: z.string().datetime(),
  notes: z.string().trim().optional().default(''),
});

export const procedureStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']),
  responsible: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
