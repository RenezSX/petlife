import { z } from 'zod';

export const bedBodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do leito.'),
  sector: z.string().trim().min(2, 'Informe o setor.'),
  notes: z.string().trim().optional().or(z.literal('')),
});
