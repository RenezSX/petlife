import type { NextFunction, Request, Response } from 'express';
import * as service from '../services/professional.service.js';
import { professionalBodySchema, professionalListQuerySchema } from '../validations/professional.validation.js';

export async function list(req: Request, res: Response, next: NextFunction) { try { const q = professionalListQuerySchema.parse(req.query); res.json(await service.listProfessionals(q.search, q.status, q.role, q.page, q.pageSize)); } catch (e) { next(e); } }
export async function get(req: Request, res: Response, next: NextFunction) { try { res.json(await service.getProfessional(String(req.params.id))); } catch (e) { next(e); } }
export async function options(_req: Request, res: Response, next: NextFunction) { try { res.json(await service.professionalOptions()); } catch (e) { next(e); } }
export async function stats(_req: Request, res: Response, next: NextFunction) { try { res.json(await service.professionalStats()); } catch (e) { next(e); } }
export async function create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await service.createProfessional(professionalBodySchema.parse(req.body))); } catch (e) { next(e); } }
export async function update(req: Request, res: Response, next: NextFunction) { try { res.json(await service.updateProfessional(String(req.params.id), professionalBodySchema.parse(req.body))); } catch (e) { next(e); } }
export async function deactivate(req: Request, res: Response, next: NextFunction) { try { res.json(await service.setProfessionalActive(String(req.params.id), false)); } catch (e) { next(e); } }
export async function reactivate(req: Request, res: Response, next: NextFunction) { try { res.json(await service.setProfessionalActive(String(req.params.id), true)); } catch (e) { next(e); } }
