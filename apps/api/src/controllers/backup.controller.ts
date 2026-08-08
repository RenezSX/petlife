import type { NextFunction, Request, Response } from 'express';
import * as backupService from '../services/backup.service.js';
import { recordAudit } from '../services/audit.service.js';

export async function exportBackup(_request: Request, response: Response, next: NextFunction) {
  try {
    const { fileName, payload } = await backupService.createBackup();
    void recordAudit({ action: 'EXPORT', module: 'Backup', entity: 'Backup', description: 'Backup exportado', after: { fileName, counts: payload.metadata.counts } });
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    response.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    next(error);
  }
}

export async function info(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await backupService.getBackupInfo());
  } catch (error) {
    next(error);
  }
}

export async function importBackup(request: Request, response: Response, next: NextFunction) {
  try {
    const result = await backupService.restoreBackup(request.body?.backup, request.body?.fileName);
    response.json(result);
  } catch (error) {
    next(error);
  }
}
