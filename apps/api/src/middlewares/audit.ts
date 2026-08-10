import type { NextFunction, Request, Response } from 'express';
import { recordAudit } from '../services/audit.service.js';

type Rule = { module: string; entity: string; action: string; description: string };

function ruleFor(method: string, url: string): Rule | null {
  const path = url.split('?')[0].replace(/^\/api\/v1/, '');
  if (path.startsWith('/audit')) return null;

  const rules: Array<[RegExp, Partial<Record<string, Rule>>]> = [
    [/^\/finance(?:\/|$)/, { POST:{module:'Financeiro',entity:'FinancialEntry',action:'CREATE',description:'Lançamento financeiro criado'}, PUT:{module:'Financeiro',entity:'FinancialEntry',action:'UPDATE',description:'Lançamento financeiro atualizado'}, DELETE:{module:'Financeiro',entity:'FinancialEntry',action:'DELETE',description:'Lançamento financeiro removido'} }],
    [/^\/preventives(?:\/|$)/, { POST:{module:'Preventivos',entity:'PreventiveRecord',action:'CREATE',description:'Preventivo registrado'}, PUT:{module:'Preventivos',entity:'PreventiveRecord',action:'UPDATE',description:'Preventivo atualizado'}, DELETE:{module:'Preventivos',entity:'PreventiveRecord',action:'DELETE',description:'Preventivo removido'} }],
    [/^\/inventory(?:\/|$)/, { POST:{module:'Estoque',entity:'InventoryItem',action:'CREATE',description:'Item ou movimentação de estoque registrada'}, PUT:{module:'Estoque',entity:'InventoryItem',action:'UPDATE',description:'Item de estoque atualizado'}, PATCH:{module:'Estoque',entity:'InventoryItem',action:'STATUS',description:'Situação do item de estoque alterada'} }],
    [/^\/professionals(?:\/|$)/, { POST:{module:'Profissionais',entity:'Professional',action:'CREATE',description:'Profissional cadastrado'}, PUT:{module:'Profissionais',entity:'Professional',action:'UPDATE',description:'Profissional atualizado'}, PATCH:{module:'Profissionais',entity:'Professional',action:'STATUS',description:'Situação do profissional alterada'} }],
    [/^\/tutors(?:\/|$)/, { POST:{module:'Tutores',entity:'Tutor',action:'CREATE',description:'Tutor cadastrado'}, PUT:{module:'Tutores',entity:'Tutor',action:'UPDATE',description:'Tutor atualizado'}, PATCH:{module:'Tutores',entity:'Tutor',action:'STATUS',description:'Situação do tutor alterada'} }],
    [/^\/animals(?:\/|$)/, { POST:{module:'Animais',entity:'Animal',action:'CREATE',description:'Animal cadastrado'}, PUT:{module:'Animais',entity:'Animal',action:'UPDATE',description:'Animal atualizado'}, PATCH:{module:'Animais',entity:'Animal',action:'STATUS',description:'Situação do animal alterada'} }],
    [/^\/hospitalizations\/[^/]+\/timeline\/events(?:\/|$)/, { POST:{module:'Prontuário',entity:'ClinicalEvent',action:'CREATE',description:'Registro clínico criado'}, PUT:{module:'Prontuário',entity:'ClinicalEvent',action:'UPDATE',description:'Registro clínico atualizado'}, DELETE:{module:'Prontuário',entity:'ClinicalEvent',action:'DELETE',description:'Registro clínico excluído'} }],
    [/^\/hospitalizations(?:\/|$)/, { POST:{module:'Internações',entity:'Hospitalization',action:'CREATE',description:'Internação aberta'}, PUT:{module:'Internações',entity:'Hospitalization',action:'UPDATE',description:'Internação atualizada'} }],
    [/^\/beds(?:\/|$)/, { POST:{module:'Leitos',entity:'Bed',action:'CREATE',description:'Leito cadastrado'}, PUT:{module:'Leitos',entity:'Bed',action:'UPDATE',description:'Leito atualizado'}, PATCH:{module:'Leitos',entity:'Bed',action:'STATUS',description:'Situação do leito alterada'} }],
    [/^\/procedures(?:\/|$)/, { POST:{module:'Procedimentos',entity:'Procedure',action:'CREATE',description:'Procedimento criado'}, PUT:{module:'Procedimentos',entity:'Procedure',action:'UPDATE',description:'Procedimento atualizado'}, PATCH:{module:'Procedimentos',entity:'Procedure',action:'STATUS',description:'Status do procedimento alterado'} }],
    [/^\/medications\/prescriptions(?:\/|$)/, { POST:{module:'Medicações',entity:'MedicationPrescription',action:'CREATE',description:'Prescrição criada'}, PATCH:{module:'Medicações',entity:'MedicationPrescription',action:'STATUS',description:'Situação da prescrição alterada'} }],
    [/^\/medications\/doses(?:\/|$)/, { PATCH:{module:'Medicações',entity:'MedicationDose',action:'STATUS',description:'Dose registrada'} }],
    [/^\/settings$/, { PUT:{module:'Configurações',entity:'ClinicSettings',action:'UPDATE',description:'Configurações da clínica atualizadas'} }],
    [/^\/backup\/import$/, { POST:{module:'Backup',entity:'Backup',action:'RESTORE',description:'Backup restaurado'} }],
  ];

  if (method === 'POST' && /\/hospitalizations\/[^/]+\/discharge$/.test(path)) {
    return {module:'Internações',entity:'Hospitalization',action:'STATUS',description:'Alta registrada'};
  }

  for (const [regex, byMethod] of rules) {
    if (regex.test(path)) return byMethod[method] ?? null;
  }
  return null;
}

function idFromUrl(url: string) {
  const path = url.split('?')[0].replace(/^\/api\/v1\//, '');
  const parts = path.split('/').filter(Boolean);
  const ignored = new Set(['professionals','tutors','animals','hospitalizations','beds','procedures','medications','prescriptions','doses','timeline','events','settings','backup','import','activate','suspend','administer','discharge','deactivate','reactivate','status']);
  return [...parts].reverse().find((part) => !ignored.has(part)) ?? null;
}

function sanitizedPayload(request: Request) {
  if (request.originalUrl.includes('/backup/import')) {
    return { fileName: request.body?.fileName ?? null, restored: true };
  }
  if (request.originalUrl === '/api/v1/settings' && request.body?.logoDataUrl) {
    return { ...request.body, logoDataUrl: '[imagem omitida da auditoria]' };
  }
  return request.body;
}

export function auditMiddleware(request: Request, response: Response, next: NextFunction) {
  const rule = ruleFor(request.method, request.originalUrl);
  if (!rule) return next();

  let responseBody: any = null;
  const originalJson = response.json.bind(response);
  response.json = ((body: any) => {
    responseBody = body;
    return originalJson(body);
  }) as Response['json'];

  response.on('finish', () => {
    if (response.statusCode < 200 || response.statusCode >= 400) return;
    const entityId = responseBody?.id ?? idFromUrl(request.originalUrl);
    void recordAudit({
      ...rule,
      entityId: entityId ? String(entityId) : null,
      after: responseBody?.id ? responseBody : sanitizedPayload(request),
      metadata: { method: request.method, path: request.originalUrl, statusCode: response.statusCode },
    });
  });

  next();
}
