import type { NextFunction, Request, Response } from 'express';
import * as service from '../services/bed.service.js';
import { bedBodySchema } from '../validations/bed.validation.js';

export async function list(_req: Request, res: Response, next: NextFunction) { try { res.json(await service.listBeds()); } catch (e) { next(e); } }
export async function create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await service.createBed(bedBodySchema.parse(req.body))); } catch (e) { next(e); } }
export async function update(req: Request, res: Response, next: NextFunction) { try { res.json(await service.updateBed(req.params.id, bedBodySchema.parse(req.body))); } catch (e) { next(e); } }
export async function deactivate(req: Request, res: Response, next: NextFunction) { try { res.json(await service.setBedActive(req.params.id, false)); } catch (e) { next(e); } }
export async function reactivate(req: Request, res: Response, next: NextFunction) { try { res.json(await service.setBedActive(req.params.id, true)); } catch (e) { next(e); } }
