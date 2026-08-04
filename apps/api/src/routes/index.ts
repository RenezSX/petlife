import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as tutorController from '../controllers/tutor.controller.js';
import * as animalController from '../controllers/animal.controller.js';

export const routes = Router();

routes.get('/dashboard/summary', dashboardController.summary);

routes.get('/tutors/options', tutorController.options);
routes.get('/tutors', tutorController.list);
routes.post('/tutors', tutorController.create);
routes.get('/tutors/:id', tutorController.get);
routes.put('/tutors/:id', tutorController.update);
routes.patch('/tutors/:id/deactivate', tutorController.deactivate);
routes.patch('/tutors/:id/reactivate', tutorController.reactivate);

routes.get('/animals', animalController.list);
routes.post('/animals', animalController.create);
routes.get('/animals/:id', animalController.get);
routes.put('/animals/:id', animalController.update);
routes.patch('/animals/:id/deactivate', animalController.deactivate);
routes.patch('/animals/:id/reactivate', animalController.reactivate);