import type { NextFunction, Request, Response } from 'express';
import * as settingsService from '../services/settings.service.js';
import { settingsBodySchema } from '../validations/settings.validation.js';

export async function get(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await settingsService.getSettings());
  } catch (error) {
    next(error);
  }
}

export async function update(request: Request, response: Response, next: NextFunction) {
  try {
    const input = settingsBodySchema.parse(request.body);
    response.json(await settingsService.updateSettings(input));
  } catch (error) {
    next(error);
  }
}
