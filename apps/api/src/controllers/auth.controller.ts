import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const credentials = loginSchema.parse(req.body);
    res.json(await authService.login(credentials.email, credentials.password));
  } catch (error) {
    next(error);
  }
}
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ user: await authService.currentUser(req.user!.id) });
  } catch (error) {
    next(error);
  }
}
