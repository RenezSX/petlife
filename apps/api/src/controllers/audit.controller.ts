import type { NextFunction, Request, Response } from 'express';
import * as auditService from '../services/audit.service.js';
import { AppError } from '../utils/app-error.js';

export async function list(request: Request, response: Response, next: NextFunction) {
  try { response.json(await auditService.listAudit(request.query)); } catch (error) { next(error); }
}

export async function get(request: Request, response: Response, next: NextFunction) {
  try {
    const item = await auditService.getAudit(String(request.params.id));
    if (!item) throw new AppError(404, 'Registro de auditoria não encontrado.');
    response.json(item);
  } catch (error) { next(error); }
}

export async function stats(_request: Request, response: Response, next: NextFunction) {
  try { response.json(await auditService.auditStats()); } catch (error) { next(error); }
}
