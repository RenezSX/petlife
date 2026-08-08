import { z } from 'zod';

const nullableNumber = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? null : Number(value),
  z.number().finite().nullable(),
);

const nullableInteger = z.preprocess(
  (value) => value === '' || value === null || value === undefined ? null : Number(value),
  z.number().int().nonnegative().nullable(),
);

export const clinicalEventSchema = z.object({
  type: z.enum(['EVOLUTION', 'VITALS', 'OBSERVATION']),
  title: z.string().trim().min(2, 'Informe um título.').max(120),
  description: z.string().trim().min(2, 'Informe a descrição.').max(4000),
  responsible: z.string().trim().max(120).nullable().optional(),
  professionalId: z.string().trim().nullable().optional(),
  eventAt: z.coerce.date(),
  temperature: nullableNumber.optional(),
  heartRate: nullableInteger.optional(),
  respiratoryRate: nullableInteger.optional(),
  weight: nullableNumber.optional(),
});

export type ClinicalEventInput = z.infer<typeof clinicalEventSchema>;
