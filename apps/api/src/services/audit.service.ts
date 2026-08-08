import { prisma } from '../config/prisma.js';

export type AuditInput = {
  action: string;
  module: string;
  entity: string;
  entityId?: string | null;
  description: string;
  actor?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};

function safeJson(value: unknown) {
  if (value === undefined || value === null) return null;
  try {
    const text = JSON.stringify(value);
    return text.length > 12000 ? JSON.stringify({ truncated: true, preview: text.slice(0, 11500) }) : text;
  } catch {
    return JSON.stringify({ unavailable: true });
  }
}

export async function recordAudit(input: AuditInput) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO AuditLog (id, action, module, entity, entityId, description, actor, beforeJson, afterJson, metadataJson, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      input.action,
      input.module,
      input.entity,
      input.entityId ?? null,
      input.description,
      input.actor ?? 'Sistema interno',
      safeJson(input.before),
      safeJson(input.after),
      safeJson(input.metadata),
    );
  } catch (error) {
    // Auditoria nunca deve derrubar a operação principal.
    console.error('Falha ao registrar auditoria:', error);
  }
}

export async function listAudit(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(query.pageSize ?? 20) || 20));
  const search = String(query.search ?? '').trim();
  const module = String(query.module ?? 'all');
  const action = String(query.action ?? 'all');
  const startDate = String(query.startDate ?? '').trim();
  const endDate = String(query.endDate ?? '').trim();

  const where: string[] = [];
  const params: unknown[] = [];

  if (search) {
    where.push('(description LIKE ? OR entity LIKE ? OR entityId LIKE ? OR actor LIKE ?)');
    const pattern = `%${search}%`;
    params.push(pattern, pattern, pattern, pattern);
  }
  if (module !== 'all') {
    where.push('module = ?');
    params.push(module);
  }
  if (action !== 'all') {
    where.push('action = ?');
    params.push(action);
  }
  if (startDate) {
    where.push('createdAt >= ?');
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    where.push('createdAt <= ?');
    params.push(`${endDate} 23:59:59`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, action, module, entity, entityId, description, actor, beforeJson, afterJson, metadataJson, createdAt
     FROM AuditLog ${whereSql}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    offset,
  );

  const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(
    `SELECT COUNT(*) as total FROM AuditLog ${whereSql}`,
    ...params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const modules = await prisma.$queryRawUnsafe<Array<{ module: string }>>(
    'SELECT DISTINCT module FROM AuditLog ORDER BY module ASC',
  );

  return {
    items: rows.map(parseAuditRow),
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    filters: { modules: modules.map((item: { module: string }) => item.module) },
  };
}

export async function getAudit(id: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, action, module, entity, entityId, description, actor, beforeJson, afterJson, metadataJson, createdAt
     FROM AuditLog WHERE id = ? LIMIT 1`,
    id,
  );
  return rows[0] ? parseAuditRow(rows[0]) : null;
}

export async function auditStats() {
  const rows = await prisma.$queryRawUnsafe<Array<{ total: bigint | number; today: bigint | number; created: bigint | number; updated: bigint | number; deleted: bigint | number }>>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN date(createdAt) = date('now', 'localtime') THEN 1 ELSE 0 END) AS today,
      SUM(CASE WHEN action = 'CREATE' THEN 1 ELSE 0 END) AS created,
      SUM(CASE WHEN action IN ('UPDATE','STATUS') THEN 1 ELSE 0 END) AS updated,
      SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) AS deleted
    FROM AuditLog
  `);
  const row = rows[0];
  return {
    total: Number(row?.total ?? 0),
    today: Number(row?.today ?? 0),
    created: Number(row?.created ?? 0),
    updated: Number(row?.updated ?? 0),
    deleted: Number(row?.deleted ?? 0),
  };
}

function parseJson(value: unknown) {
  if (typeof value !== 'string' || !value) return null;
  try { return JSON.parse(value); } catch { return value; }
}

function parseAuditRow(row: any) {
  return {
    id: row.id,
    action: row.action,
    module: row.module,
    entity: row.entity,
    entityId: row.entityId ?? null,
    description: row.description,
    actor: row.actor ?? 'Sistema interno',
    before: parseJson(row.beforeJson),
    after: parseJson(row.afterJson),
    metadata: parseJson(row.metadataJson),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}
