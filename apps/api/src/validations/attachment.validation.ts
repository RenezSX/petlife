import { z } from 'zod';

export const attachmentBodySchema = z.object({
  fileName: z.string().trim().min(1, 'Informe o nome do arquivo.').max(180),
  mimeType: z.string().trim().min(1, 'Tipo de arquivo inválido.').max(120),
  sizeBytes: z.coerce.number().int().positive().max(8 * 1024 * 1024, 'O arquivo deve ter no máximo 8 MB.'),
  dataUrl: z.string().min(10, 'Arquivo inválido.').refine(
    (value) => value.startsWith('data:'),
    'O conteúdo do arquivo é inválido.',
  ),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  category: z.enum(['EXAM','IMAGE','REPORT','PRESCRIPTION','OTHER']).optional().default('OTHER'),
  professionalId: z.string().trim().optional().or(z.literal('')),
});

export const animalPhotoSchema = z.object({
  dataUrl: z.string().min(10).max(5_000_000).refine(
    (value) => /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(value),
    'Selecione uma imagem PNG, JPG ou WEBP.',
  ),
});
