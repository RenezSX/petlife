import { z } from 'zod';

const optionalText=z.string().trim().max(300).optional().or(z.literal(''));

export const inventoryItemSchema=z.object({
  name:z.string().trim().min(2,'Informe o nome do item.').max(120),
  category:z.enum(['MEDICATION','SUPPLY','FOOD','HYGIENE','OTHER']),
  unit:z.string().trim().min(1,'Informe a unidade.').max(30),
  currentQuantity:z.coerce.number().min(0,'A quantidade não pode ser negativa.'),
  minimumQuantity:z.coerce.number().min(0,'O estoque mínimo não pode ser negativo.'),
  batch:optionalText,
  expiryDate:z.string().optional().or(z.literal('')),
  supplier:optionalText,
  location:optionalText,
  notes:z.string().trim().max(1000).optional().or(z.literal('')),
});

export const inventoryMovementSchema=z.object({
  type:z.enum(['IN','OUT','ADJUSTMENT']),
  quantity:z.coerce.number().positive('Informe uma quantidade maior que zero.'),
  reason:z.string().trim().min(2,'Informe o motivo da movimentação.').max(200),
  responsible:optionalText,
  notes:z.string().trim().max(1000).optional().or(z.literal('')),
});
