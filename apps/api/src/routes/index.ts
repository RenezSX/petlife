import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as tutorController from '../controllers/tutor.controller.js';
import * as animalController from '../controllers/animal.controller.js';
import * as hospitalizationController from '../controllers/hospitalization.controller.js';
import * as bedController from '../controllers/bed.controller.js';

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

routes.get('/hospitalizations/options', hospitalizationController.options);
routes.get('/hospitalizations/stats', hospitalizationController.stats);
routes.get('/hospitalizations', hospitalizationController.list);
routes.post('/hospitalizations', hospitalizationController.create);
routes.get('/hospitalizations/:id', hospitalizationController.get);
routes.put('/hospitalizations/:id', hospitalizationController.update);
routes.post('/hospitalizations/:id/discharge', hospitalizationController.discharge);

routes.get('/beds', bedController.list);
routes.post('/beds', bedController.create);
routes.put('/beds/:id', bedController.update);
routes.patch('/beds/:id/deactivate', bedController.deactivate);
routes.patch('/beds/:id/reactivate', bedController.reactivate);
