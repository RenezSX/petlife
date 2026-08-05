import { z } from 'zod';

const stringList = z.array(z.string().trim().min(1)).max(50);

export const settingsBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).optional().nullable(),
  cnpj: z.string().trim().max(30).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().optional().or(z.literal('')).nullable(),
  address: z.string().trim().max(220).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(40).optional().nullable(),
  zipCode: z.string().trim().max(20).optional().nullable(),
  logoDataUrl: z.string().max(2_500_000).optional().nullable(),
  openingHours: z.string().trim().max(300).optional().nullable(),
  sectors: stringList,
  priorities: stringList,
  species: stringList,
  medicationRoutes: stringList,
  theme: z.enum(['light', 'dark', 'system']),
  tagline: z.string().trim().max(180),
});
