import type { NextFunction, Request, Response } from 'express';
import * as preventiveService from '../services/preventive.service.js';
import { preventiveBodySchema } from '../validations/preventive.validation.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try { res.json(await preventiveService.listPreventives(req.query)); } catch (error) { next(error); }
}

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try { res.json(await preventiveService.preventiveStats()); } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try { res.status(201).json(await preventiveService.createPreventive(preventiveBodySchema.parse(req.body))); } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try { res.json(await preventiveService.updatePreventive(String(req.params.id), preventiveBodySchema.parse(req.body))); } catch (error) { next(error); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try { res.json(await preventiveService.removePreventive(String(req.params.id))); } catch (error) { next(error); }
}
