import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middlewares/auth.js';

export const routes = Router();
routes.post('/auth/login', authController.login);
routes.get('/auth/me', requireAuth, authController.me);
routes.get('/dashboard/summary', requireAuth, dashboardController.summary);
