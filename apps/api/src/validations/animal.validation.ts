import { z } from 'zod';

const optionalText = z.string().trim().optional().or(z.literal(''));

export const animalBodySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do animal.'),
  species: z.string().trim().min(2, 'Informe a espécie.'),
  breed: optionalText,
  sex: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  approximateAge: optionalText,
  weight: z.union([z.coerce.number().positive('O peso deve ser maior que zero.'), z.literal(''), z.undefined()]),
  color: optionalText,
  microchip: optionalText,
  neutered: z.boolean().optional().default(false),
  allergies: optionalText,
  previousDiseases: optionalText,
  continuousMedications: optionalText,
  notes: optionalText,
  photoUrl: z.string().url('Informe uma URL válida.').optional().or(z.literal('')),
  tutorId: z.string().min(1, 'Selecione o tutor.'),
});

export const animalListQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  species: z.string().trim().optional().default(''),
  tutorId: z.string().trim().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(['active', 'inactive', 'all']).optional().default('active'),
});
