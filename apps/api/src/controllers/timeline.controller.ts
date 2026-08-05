import type { NextFunction, Request, Response } from 'express';
import {
  createClinicalEvent,
  deleteClinicalEvent,
  getTimeline,
  updateClinicalEvent,
} from '../services/timeline.service.js';
import { clinicalEventSchema } from '../validations/timeline.validation.js';

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getTimeline(String(req.params.id)));
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = clinicalEventSchema.parse(req.body);
    res.status(201).json(await createClinicalEvent(String(req.params.id), data));
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = clinicalEventSchema.parse(req.body);
    res.json(await updateClinicalEvent(String(req.params.id), String(req.params.eventId), data));
  } catch (error) {
    next(error);
  }
}

export async function removeEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteClinicalEvent(String(req.params.id), String(req.params.eventId));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
