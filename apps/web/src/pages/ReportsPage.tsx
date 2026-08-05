import {
  BarChart3,
  BedDouble,
  CalendarDays,
  Download,
  FileDown,
  FileSpreadsheet,
  PawPrint,
  Pill,
  Printer,
  RefreshCw,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { ReportData, ReportType } from '../types';

const reportOptions: Array<{ value: ReportType; label: string; description: string; icon: typeof BarChart3; dated: boolean }> = [
  { value: 'hospitalizations', label: 'Internações', description: 'Entradas, altas, prioridade, setor e responsável.', icon: Stethoscope, dated: true },
  { value: 'procedures', label: 'Procedimentos', description: 'Agenda, responsáveis e situação das tarefas clínicas.', icon: CalendarDays, dated: true },
  { value: 'medications', label: 'Medicações', description: 'Doses programadas, registradas e pendências.', icon: Pill, dated: true },
  { value: 'animals', label: 'Animais', description: 'Cadastro de pacientes, tutor e situação atual.', icon: PawPrint, dated: false },
  { value: 'tutors', label: 'Tutores', description: 'Contatos, endereço e quantidade de animais.', icon: Users, dated: false },
  { value: 'beds', label: 'Leitos', description: 'Disponibilidade, ocupação e pacientes por setor.', icon: BedDouble, dated: false },
];

const statusOptions: Record<ReportType, Array<{ value: string; label: string }>> = {
  hospitalizations: [
    { value: 'all', label: 'Todos' }, { value: 'active', label: 'Ativas' }, { value: 'discharged', label: 'Com alta' },
    { value: 'HOSPITALIZED', label: 'Internadas' }, { value: 'OBSERVATION', label: 'Observação' }, { value: 'CRITICAL', label: 'Críticas' },
  ],
  procedures: [
    { value: 'all', label: 'Todos' }, { value: 'PENDING', label: 'Pendentes' }, { value: 'IN_PROGRESS', label: 'Em andamento' },
    { value: 'COMPLETED', label: 'Concluídos' }, { value: 'CANCELED', label: 'Cancelados' },
  ],
  medications: [
    { value: 'all', label: 'Todos' }, { value: 'PENDING', label: 'Pendentes' }, { value: 'ADMINISTERED', label: 'Administradas' },
    { value: 'NOT_ADMINISTERED', label: 'Não administradas' }, { value: 'REFUSED', label: 'Recusadas' },
  ],
  animals: [{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Ativos' }, { value: 'inactive', label: 'Inativos' }],
  tutors: [{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Ativos' }, { value: 'inactive', label: 'Inativos' }],
  beds: [{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Ativos' }, { value: 'inactive', label: 'Inativos' }],
};

function fileName(type: ReportType, extension: string) {
  return `petlife-${type}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function download(content: BlobPart, mime: string, name: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function htmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function exportCsv(report: ReportData) {
  const header = report.columns.map((column) => csvCell(column.label)).join(';');
  const rows = report.rows.map((row) => report.columns.map((column) => csvCell(row[column.key])).join(';'));
  download(`\uFEFF${[header, ...rows].join('\r\n')}`, 'text/csv;charset=utf-8', fileName(report.type, 'csv'));
}

function tableHtml(report: ReportData, printable = false) {
  const summary = Object.entries(report.summary)
    .map(([key, value]) => `<div><span>${htmlEscape(key)}</span><strong>${htmlEscape(value)}</strong></div>`)
    .join('');
  const headings = report.columns.map((column) => `<th>${htmlEscape(column.label)}</th>`).join('');
  const rows = report.rows.map((row) => `<tr>${report.columns.map((column) => `<td>${htmlEscape(row[column.key])}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>PetLife - ${htmlEscape(report.title)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#17323c;margin:${printable ? '22px' : '0'};font-size:12px}
    header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #087f91;padding-bottom:13px;margin-bottom:18px}
    h1{margin:0;color:#087f91;font-size:24px}.brand{font-weight:800;color:#ed751b}.muted{color:#71838a;font-size:11px}
    .summary{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:17px}.summary div{border:1px solid #dfeaec;border-radius:8px;padding:8px 11px;min-width:100px}.summary span{display:block;color:#71838a;font-size:9px;text-transform:uppercase}.summary strong{font-size:16px;color:#17323c}
    table{width:100%;border-collapse:collapse}th{background:#087f91;color:white;text-align:left;padding:8px;font-size:10px}td{border-bottom:1px solid #e3ecef;padding:7px;vertical-align:top}tr:nth-child(even) td{background:#f7fafb}
    footer{margin-top:18px;color:#7b8e95;font-size:9px;text-align:center}@media print{body{margin:0}@page{size:landscape;margin:12mm}}
  </style></head><body><header><div><div class="brand">PETLIFE SÃO CAETANO</div><h1>${htmlEscape(report.title)}</h1><div class="muted">Relatório gerado em ${new Date(report.generatedAt).toLocaleString('pt-BR')}</div></div><div class="muted">Clínica Veterinária 24h</div></header><section class="summary">${summary}</section><table><thead><tr>${headings}</tr></thead><tbody>${rows || `<tr><td colspan="${report.columns.length}">Nenhum registro encontrado.</td></tr>`}</tbody></table><footer>PetLife São Caetano • Cuidando com amor, tratando com excelência.</footer></body></html>`;
}

function exportExcel(report: ReportData) {
  download(`\uFEFF${tableHtml(report)}`, 'application/vnd.ms-excel;charset=utf-8', fileName(report.type, 'xls'));
}

function printPdf(report: ReportData) {
  const popup = window.open('', '_blank', 'width=1200,height=800');
  if (!popup) return;
  popup.document.open();
  popup.document.write(tableHtml(report, true));
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 350);
}

function summaryLabel(key: string) {
  const labels: Record<string, string> = {
    total: 'Total', active: 'Ativos', critical: 'Críticos', discharged: 'Altas', pending: 'Pendentes',
    completed: 'Concluídos', canceled: 'Cancelados', administered: 'Administradas', notAdministered: 'Não administradas',
    hospitalized: 'Internados', animals: 'Animais', available: 'Disponíveis', occupied: 'Ocupados',
  };
  return labels[key] ?? key;
}

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 8)}01`;
  const [type, setType] = useState<ReportType>('hospitalizations');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selected = useMemo(() => reportOptions.find((option) => option.value === type)!, [type]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<ReportData>('/reports', { params: { type, status, ...(selected.dated ? { from, to } : {}) } });
      setReport(response.data);
    } catch (loadError) {
      console.error('Erro ao carregar relatório:', loadError);
      setError('Não foi possível gerar o relatório. Confira se a API está ligada.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [type, status, from, to, selected.dated]);

  useEffect(() => { void load(); }, [load]);

  function changeType(next: ReportType) {
    setType(next);
    setStatus('all');
  }

  return (
    <>
      <div className="page-heading reports-heading">
        <div>
          <p className="eyebrow">GESTÃO E ANÁLISE</p>
          <h1>Relatórios</h1>
          <p className="muted">Visualize indicadores e exporte os dados da clínica em PDF, Excel ou CSV.</p>
        </div>
        <button type="button" className="secondary-button button-with-icon" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={loading ? 'spin-icon' : ''} /> Atualizar
        </button>
      </div>

      <div className="report-type-grid">
        {reportOptions.map(({ value, label, description, icon: Icon }) => (
          <button key={value} type="button" className={`report-type-card ${type === value ? 'active' : ''}`} onClick={() => changeType(value)}>
            <span><Icon /></span><div><strong>{label}</strong><small>{description}</small></div>
          </button>
        ))}
      </div>

      <section className="panel report-panel">
        <div className="report-filter-bar">
          <label>Relatório<select value={type} onChange={(event) => changeType(event.target.value as ReportType)}>{reportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label>Situação<select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions[type].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {selected.dated && <><label>De<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Até<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></>}
          <button type="button" className="primary-button button-with-icon" onClick={() => void load()} disabled={loading}><BarChart3 />Gerar relatório</button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="report-loading"><div className="skeleton report-skeleton-summary"/><div className="skeleton report-skeleton-table"/></div>
        ) : report ? (
          <>
            <div className="report-result-header">
              <div><p className="eyebrow">VISUALIZAÇÃO</p><h2>{report.title}</h2><span>Gerado em {new Date(report.generatedAt).toLocaleString('pt-BR')}</span></div>
              <div className="report-export-actions">
                <button type="button" className="secondary-button button-with-icon" onClick={() => exportCsv(report)}><Download />CSV</button>
                <button type="button" className="secondary-button button-with-icon" onClick={() => exportExcel(report)}><FileSpreadsheet />Excel</button>
                <button type="button" className="primary-button button-with-icon" onClick={() => printPdf(report)}><Printer />PDF / Imprimir</button>
              </div>
            </div>

            <div className="report-summary-grid">
              {Object.entries(report.summary).map(([key, value], index) => <article key={key} className={index === 0 ? 'main' : ''}><FileDown/><div><span>{summaryLabel(key)}</span><strong>{value}</strong></div></article>)}
            </div>

            <div className="report-table-wrap">
              <table className="report-table"><thead><tr>{report.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
                {report.rows.length === 0 ? <tr><td className="report-empty-cell" colSpan={report.columns.length}>Nenhum registro encontrado para os filtros selecionados.</td></tr> : report.rows.map((row, rowIndex) => <tr key={rowIndex}>{report.columns.map((column) => <td key={column.key}>{String(row[column.key] ?? '—')}</td>)}</tr>)}
              </tbody></table>
            </div>
          </>
        ) : null}
      </section>
    </>
  );
}
