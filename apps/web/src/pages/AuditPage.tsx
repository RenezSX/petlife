import {
  Activity,
  CalendarDays,
  Download,
  Eye,
  FileText,
  History,
  Pencil,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { AuditItem, AuditStats, PaginatedAudit } from '../types';

const actionLabels: Record<string, string> = {
  CREATE: 'Cadastro',
  UPDATE: 'Atualização',
  STATUS: 'Status',
  DELETE: 'Exclusão',
  RESTORE: 'Restauração',
};

function actionIcon(action: string) {
  if (action === 'CREATE') return <PlusCircle />;
  if (action === 'DELETE') return <Trash2 />;
  if (action === 'UPDATE') return <Pencil />;
  return <Activity />;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.split('"').join('""')}"`;
}

export function AuditPage() {
  const [data, setData] = useState<PaginatedAudit | null>(null);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('all');
  const [action, setAction] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [listResponse, statsResponse] = await Promise.all([
        api.get('/audit', { params: { search, module, action, startDate, endDate, page, pageSize: 20 } }),
        api.get('/audit/stats'),
      ]);
      setData(listResponse.data);
      setStats(statsResponse.data);
    } catch (loadError) {
      console.error('Erro ao carregar auditoria:', loadError);
      setError('Não foi possível carregar o histórico de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [search, module, action, startDate, endDate, page]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 180);
    return () => window.clearTimeout(timeout);
  }, [load]);

  useEffect(() => setPage(1), [search, module, action, startDate, endDate]);

  const modules = data?.filters.modules ?? [];
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const detailJson = useMemo(() => {
    if (!selected) return '';
    const value = selected.after ?? selected.metadata ?? null;
    return value ? JSON.stringify(value, null, 2) : 'Nenhum detalhe adicional armazenado.';
  }, [selected]);

  function exportCsv() {
    const header = ['Data', 'Ação', 'Módulo', 'Entidade', 'ID', 'Descrição', 'Responsável'];
    const rows = items.map((item) => [
      formatDate(item.createdAt),
      actionLabels[item.action] ?? item.action,
      item.module,
      item.entity,
      item.entityId ?? '',
      item.description,
      item.actor,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `petlife-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-heading audit-heading">
        <div>
          <p className="eyebrow">RASTREABILIDADE</p>
          <h1>Auditoria</h1>
          <p className="muted">Histórico automático das principais operações realizadas no PetLife.</p>
        </div>
        <div className="audit-heading-actions">
          <button type="button" className="secondary-button button-with-icon" onClick={exportCsv} disabled={!items.length}>
            <Download size={18} /> Exportar CSV
          </button>
          <button type="button" className="primary-button button-with-icon" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin-icon' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {stats && (
        <div className="audit-metrics">
          <article><History /><div><strong>{stats.total}</strong><span>Total de ações</span></div></article>
          <article><CalendarDays /><div><strong>{stats.today}</strong><span>Ações hoje</span></div></article>
          <article><PlusCircle /><div><strong>{stats.created}</strong><span>Cadastros</span></div></article>
          <article><Pencil /><div><strong>{stats.updated}</strong><span>Atualizações</span></div></article>
          <article><Trash2 /><div><strong>{stats.deleted}</strong><span>Exclusões</span></div></article>
        </div>
      )}

      <section className="panel audit-panel">
        <div className="toolbar toolbar-wrap audit-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar descrição, entidade ou ID" />
          </div>
          <select value={module} onChange={(event) => setModule(event.target.value)}>
            <option value="all">Todos os módulos</option>
            {modules.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="all">Todas as ações</option>
            <option value="CREATE">Cadastros</option>
            <option value="UPDATE">Atualizações</option>
            <option value="STATUS">Alterações de status</option>
            <option value="DELETE">Exclusões</option>
            <option value="RESTORE">Restaurações</option>
          </select>
          <label className="audit-date-filter"><span>De</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="audit-date-filter"><span>Até</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        </div>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="empty-state"><RefreshCw className="spin-icon" size={36} /><h3>Carregando auditoria...</h3></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><History size={42} /><h3>Nenhuma ação registrada</h3><p>As próximas alterações feitas no sistema aparecerão aqui automaticamente.</p></div>
        ) : (
          <div className="audit-list">
            {items.map((item) => (
              <article className="audit-item" key={item.id}>
                <div className={`audit-action-icon action-${item.action.toLowerCase()}`}>{actionIcon(item.action)}</div>
                <div className="audit-item-main">
                  <div className="audit-item-title">
                    <strong>{item.description}</strong>
                    <span className={`audit-action-badge action-${item.action.toLowerCase()}`}>{actionLabels[item.action] ?? item.action}</span>
                  </div>
                  <p>{item.module} • {item.entity}{item.entityId ? ` • ${item.entityId}` : ''}</p>
                  <small>{formatDate(item.createdAt)} • {item.actor}</small>
                </div>
                <button type="button" className="icon-button" title="Ver detalhes" onClick={() => setSelected(item)}><Eye size={18} /></button>
              </article>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <span>{pagination.total} registros</span>
            <div>
              <button type="button" className="secondary-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</button>
              <strong>{page} / {pagination.totalPages}</strong>
              <button type="button" className="secondary-button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button>
            </div>
          </div>
        )}
      </section>

      {selected && (
        <Modal title="Detalhes da auditoria" subtitle={selected.description} onClose={() => setSelected(null)} wide>
          <div className="audit-detail">
            <div className="audit-detail-grid">
              <article><span>Data e hora</span><strong>{formatDate(selected.createdAt)}</strong></article>
              <article><span>Módulo</span><strong>{selected.module}</strong></article>
              <article><span>Ação</span><strong>{actionLabels[selected.action] ?? selected.action}</strong></article>
              <article><span>Responsável</span><strong>{selected.actor}</strong></article>
              <article><span>Entidade</span><strong>{selected.entity}</strong></article>
              <article><span>Identificador</span><strong>{selected.entityId ?? '—'}</strong></article>
            </div>
            <div className="audit-json-card">
              <div><FileText size={18} /><strong>Dados registrados</strong></div>
              <pre>{detailJson}</pre>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
