import type { NextFunction, Request, Response } from 'express';
import * as service from '../services/hospitalization.service.js';
import { dischargeSchema, hospitalizationBodySchema, hospitalizationListQuerySchema } from '../validations/hospitalization.validation.js';

export async function list(req: Request, res: Response, next: NextFunction) { try { const q = hospitalizationListQuerySchema.parse(req.query); res.json(await service.listHospitalizations(q.search, q.status, q.priority, q.page, q.pageSize)); } catch (e) { next(e); } }
export async function get(req: Request, res: Response, next: NextFunction) { try { res.json(await service.getHospitalization(req.params.id)); } catch (e) { next(e); } }
export async function create(req: Request, res: Response, next: NextFunction) { try { res.status(201).json(await service.createHospitalization(hospitalizationBodySchema.parse(req.body))); } catch (e) { next(e); } }
export async function update(req: Request, res: Response, next: NextFunction) { try { res.json(await service.updateHospitalization(req.params.id, hospitalizationBodySchema.parse(req.body))); } catch (e) { next(e); } }
export async function discharge(req: Request, res: Response, next: NextFunction) { try { const body = dischargeSchema.parse(req.body); res.json(await service.dischargeHospitalization(req.params.id, body.summary, body.dischargedAt)); } catch (e) { next(e); } }
export async function options(_req: Request, res: Response, next: NextFunction) { try { res.json(await service.listHospitalizationOptions()); } catch (e) { next(e); } }
export async function stats(_req: Request, res: Response, next: NextFunction) { try { res.json(await service.getHospitalizationStats()); } catch (e) { next(e); } }
