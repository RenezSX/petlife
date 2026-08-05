import type { NextFunction, Request, Response } from 'express';
import { generateReport } from '../services/report.service.js';

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await generateReport(req.query));
  } catch (error) {
    next(error);
  }
}
