import type { NextFunction, Request, Response } from 'express';
import { getDashboardData } from '../services/dashboard.service.js';
export async function summary(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await getDashboardData()); } catch (error) { next(error); }
}
