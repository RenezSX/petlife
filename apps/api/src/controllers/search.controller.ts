import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { globalSearch } from '../services/search.service.js';

const searchQuerySchema = z.object({
  q: z.string().trim().max(100).default(''),
});

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    res.json(await globalSearch(q));
  } catch (error) {
    next(error);
  }
}
