import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as tutorController from '../controllers/tutor.controller.js';
import * as animalController from '../controllers/animal.controller.js';
import * as hospitalizationController from '../controllers/hospitalization.controller.js';
import * as bedController from '../controllers/bed.controller.js';
import * as procedureController from '../controllers/procedure.controller.js';
import * as medicationController from '../controllers/medication.controller.js';
import * as timelineController from '../controllers/timeline.controller.js';
import * as searchController from '../controllers/search.controller.js';
import * as reportController from '../controllers/report.controller.js';
import * as notificationController from '../controllers/notification.controller.js';
import * as settingsController from '../controllers/settings.controller.js';
import * as backupController from '../controllers/backup.controller.js';
import * as auditController from '../controllers/audit.controller.js';
import * as professionalController from '../controllers/professional.controller.js';

export const routes = Router();

routes.get('/dashboard/summary', dashboardController.summary);
routes.get('/search', searchController.search);
routes.get('/reports', reportController.generate);
routes.get('/notifications', notificationController.list);
routes.get('/settings', settingsController.get);
routes.put('/settings', settingsController.update);
routes.get('/backup/export', backupController.exportBackup);
routes.get('/backup/info', backupController.info);
routes.post('/backup/import', backupController.importBackup);
routes.get('/audit/stats', auditController.stats);
routes.get('/audit', auditController.list);
routes.get('/audit/:id', auditController.get);


routes.get('/professionals/options', professionalController.options);
routes.get('/professionals/stats', professionalController.stats);
routes.get('/professionals', professionalController.list);
routes.post('/professionals', professionalController.create);
routes.get('/professionals/:id', professionalController.get);
routes.put('/professionals/:id', professionalController.update);
routes.patch('/professionals/:id/deactivate', professionalController.deactivate);
routes.patch('/professionals/:id/reactivate', professionalController.reactivate);

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


routes.get('/procedures/options', procedureController.options);
routes.get('/procedures/stats', procedureController.stats);
routes.get('/procedures', procedureController.list);
routes.post('/procedures', procedureController.create);
routes.put('/procedures/:id', procedureController.update);
routes.patch('/procedures/:id/status', procedureController.changeStatus);

routes.get('/medications/stats', medicationController.stats);
routes.get('/medications/prescriptions', medicationController.listPrescriptions);
routes.get('/medications/doses', medicationController.listDoses);
routes.post('/medications/prescriptions', medicationController.create);
routes.patch('/medications/prescriptions/:id/activate', medicationController.activate);
routes.patch('/medications/prescriptions/:id/suspend', medicationController.suspend);
routes.patch('/medications/doses/:id/administer', medicationController.administer);

routes.get('/hospitalizations/:id/timeline', timelineController.get);
routes.post('/hospitalizations/:id/timeline/events', timelineController.createEvent);
routes.put('/hospitalizations/:id/timeline/events/:eventId', timelineController.updateEvent);
routes.delete('/hospitalizations/:id/timeline/events/:eventId', timelineController.removeEvent);
