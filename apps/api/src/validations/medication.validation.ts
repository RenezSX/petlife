import { z } from 'zod';

export const prescriptionBodySchema = z.object({
  hospitalizationId: z.string().min(1, 'Selecione uma internação.'),
  medication: z.string().trim().min(2, 'Informe o medicamento.'),
  dose: z.string().trim().min(1, 'Informe a dose.'),
  unit: z.string().trim().min(1, 'Informe a unidade.'),
  route: z.string().trim().min(1, 'Informe a via.'),
  frequencyHours: z.coerce.number().int().min(1).max(168),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().trim().optional().default(''),
});

export const administrationBodySchema = z.object({
  status: z.enum(['ADMINISTERED', 'NOT_ADMINISTERED', 'REFUSED']),
  administeredBy: z.string().trim().min(2, 'Informe o responsável.'),
  notes: z.string().trim().optional().default(''),
});
