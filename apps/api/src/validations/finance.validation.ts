import { z } from 'zod';
const opt=z.string().trim().max(500).optional().or(z.literal(''));
export const financeBodySchema=z.object({
  type:z.enum(['INCOME','EXPENSE']),
  description:z.string().trim().min(2).max(160),
  category:z.string().trim().min(2).max(80),
  amount:z.coerce.number().positive(),
  status:z.enum(['PAID','PENDING','CANCELED']),
  paymentMethod:opt,
  occurredAt:z.string().min(8),
  dueAt:z.string().optional().or(z.literal('')),
  paidAt:z.string().optional().or(z.literal('')),
  animalId:z.string().optional().or(z.literal('')),
  hospitalizationId:z.string().optional().or(z.literal('')),
  notes:opt,
});
