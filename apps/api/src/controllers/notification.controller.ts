import type { NextFunction, Request, Response } from 'express';
import * as notificationService from '../services/notification.service.js';

export async function list(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    response.json(await notificationService.listNotifications());
  } catch (error) {
    next(error);
  }
}
