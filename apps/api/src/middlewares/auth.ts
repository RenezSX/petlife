import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Token de autenticação não informado.'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & {
      email: string;
      role: NonNullable<Request['user']>['role'];
    };
    if (!payload.sub) throw new Error('Token sem usuário');
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Sessão inválida ou expirada.'));
  }
}
