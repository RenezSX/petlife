import type { NextFunction, Request, Response } from 'express';
import { getAgenda } from '../services/agenda.service.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getAgenda(req.query));
  } catch (error) {
    next(error);
  }
}
