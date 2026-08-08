import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));

export const hospitalizationBodySchema = z.object({
  animalId: z.string().trim().min(1, 'Selecione um animal.'),
  bedId: optionalText,
  status: z.enum(['WAITING', 'HOSPITALIZED', 'OBSERVATION', 'PROCEDURE', 'RECOVERY', 'CRITICAL', 'DISCHARGE_EXPECTED']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']),
  reason: z.string().trim().min(3, 'Informe o motivo da internação.'),
  diagnosis: optionalText,
  veterinarian: optionalText,
  professionalId: optionalText,
  notes: optionalText,
  admittedAt: z.string().datetime().optional().or(z.literal('')),
  expectedDischargeAt: z.string().datetime().optional().or(z.literal('')),
});

export const hospitalizationListQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  status: z.string().trim().optional().default('active'),
  priority: z.string().trim().optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const dischargeSchema = z.object({
  summary: z.string().trim().min(3, 'Informe um resumo da alta.'),
  dischargedAt: z.string().datetime().optional().or(z.literal('')),
});
