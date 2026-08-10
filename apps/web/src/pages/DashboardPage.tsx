import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  PackageOpen,
  ShieldCheck,
  WalletCards,
  Pill,
  RefreshCw,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardActivity, DashboardAlert, DashboardData } from '../types';

const statusNames: Record<string, string> = {
  CRITICAL: 'Crítico',
  HOSPITALIZED: 'Internado',
  OBSERVATION: 'Observação',
  RECOVERY: 'Recuperação',
  PROCEDURE: 'Em procedimento',
  WAITING: 'Aguardando',
  DISCHARGE_EXPECTED: 'Alta prevista'
};

const priorityNames: Record<string, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa'
};

const alertIcons = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Clock3,
  success: CheckCircle2
};

const activityIcons = {
  ADMISSION: ArrowDownRight,
  DISCHARGE: ArrowUpRight,
  PROCEDURE: Stethoscope,
  MEDICATION: Pill,
  CLINICAL: Activity
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Carregando dashboard">
      <div className="skeleton skeleton-hero" />
      <div className="skeleton-grid">{Array.from({ length: 6 }).map((_, index) => <div className="skeleton skeleton-card" key={index} />)}</div>
      <div className="skeleton skeleton-panel" />
    </div>
  );
}

function AlertItem({ alert }: { alert: DashboardAlert }) {
  const Icon = alertIcons[alert.level];
  return (
    <Link to={alert.href} className={`dashboard-alert alert-${alert.level}`}>
      <span><Icon size={18} /></span>
      <div><strong>{alert.title}</strong><small>{alert.description}</small></div>
      <ArrowRight size={17} />
    </Link>
  );
}

function ActivityItem({ item }: { item: DashboardActivity }) {
  const Icon = activityIcons[item.type];
  return (
    <Link to={item.href} className={`movement-item movement-${item.type.toLowerCase()}`}>
      <span className="movement-icon"><Icon size={17} /></span>
      <div><strong>{item.title}</strong><span>{item.description}</span></div>
      <time>{formatDateTime(item.date)}</time>
    </Link>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const response = await api.get<DashboardData>('/dashboard/summary');
      setData(response.data);
      setError('');
    } catch {
      setError('Não foi possível carregar o dashboard. Verifique se a API está ativa.');
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const cards = useMemo(() => data ? [
    { label: 'Internações ativas', value: data.metrics.hospitalized, detail: `${data.metrics.critical} paciente(s) crítico(s)`, icon: HeartPulse, tone: 'blue', href: '/internacoes' },
    { label: 'Taxa de ocupação', value: `${data.metrics.occupancyRate}%`, detail: `${data.metrics.occupiedBeds} de ${data.metrics.totalBeds} leitos`, icon: TrendingUp, tone: data.metrics.occupancyRate >= 85 ? 'red' : 'orange', href: '/leitos' },
    { label: 'Leitos disponíveis', value: data.metrics.availableBeds, detail: 'Capacidade para admissões', icon: BedDouble, tone: 'green', href: '/leitos' },
    { label: 'Procedimentos pendentes', value: data.metrics.pendingProcedures, detail: `${data.metrics.overdueProcedures} atrasado(s)`, icon: Stethoscope, tone: data.metrics.overdueProcedures ? 'red' : 'blue', href: '/procedimentos' },
    { label: 'Medicações pendentes', value: data.metrics.pendingMedications, detail: `${data.metrics.overdueMedications} atrasada(s)`, icon: Pill, tone: data.metrics.overdueMedications ? 'red' : 'orange', href: '/medicacoes' },
    { label: 'Altas previstas', value: data.metrics.expectedDischarges, detail: 'Previsão para hoje', icon: CalendarDays, tone: 'blue', href: '/internacoes' }
  ] : [], [data]);

  if (error && !data) return <div className="state-card error-state">{error}</div>;
  if (!data) return <DashboardSkeleton />;

  const trendMaximum = Math.max(1, ...data.trends.flatMap((item) => [item.admissions, item.discharges, item.procedures, item.medications]));
  const totalPriorities = Math.max(1, data.priorityDistribution.reduce((sum, item) => sum + item.total, 0));

  return (
    <>
      <div className="dashboard-hero dashboard-hero-v6">
        <div>
          <p className="eyebrow hero-eyebrow">CENTRAL OPERACIONAL EM TEMPO REAL</p>
          <h1>Visão clínica da PetLife</h1>
          <p>Pacientes, atividades e movimentações atualizados automaticamente a cada 30 segundos.</p>
        </div>
        <div className="hero-actions dashboard-live-actions">
          <span className="live-chip"><i />Atualização automática</span>
          <button className="outline-button button-with-icon hero-refresh" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Atualizar
          </button>
          <Link className="primary-button button-with-icon" to="/internacoes">Nova internação <ArrowRight size={17} /></Link>
        </div>
      </div>

      <div className="dashboard-update-line">
        <span><CalendarDays size={15} />{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())}</span>
        <small>Última atualização: {formatTime(data.generatedAt)}</small>
      </div>

      {error && <div className="form-error dashboard-inline-error">{error}</div>}

      <div className="executive-grid">
        <Link to="/financeiro" className="executive-card"><WalletCards/><div><span>Saldo do mês</span><strong>{data.executive.finance.balance.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong><small>Entradas {data.executive.finance.income.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} • Saídas {data.executive.finance.expense.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</small></div></Link>
        <Link to="/estoque" className="executive-card"><PackageOpen/><div><span>Estoque em atenção</span><strong>{data.executive.inventory.low}</strong><small>{data.executive.inventory.expired} item(ns) vencido(s)</small></div></Link>
        <Link to="/preventivos" className="executive-card"><ShieldCheck/><div><span>Preventivos</span><strong>{data.executive.preventives.overdue} atrasado(s)</strong><small>{data.executive.preventives.dueSoon} próximo(s) nos próximos 30 dias</small></div></Link>
      </div>

      <div className="metrics-grid metrics-grid-v5">
        {cards.map(({ label, value, detail, icon: Icon, tone, href }) => (
          <Link className={`metric-card metric-${tone} metric-link`} key={label} to={href}>
            <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
            <div className="metric-icon"><Icon /></div>
          </Link>
        ))}
      </div>

      <div className="dashboard-v6-analytics-grid">
        <section className="panel trend-panel">
          <div className="panel-header">
            <div><h2>Movimento dos últimos 7 dias</h2><p>Internações, altas e atividades clínicas concluídas.</p></div>
            <div className="chart-legend"><span className="legend-admission">Internações</span><span className="legend-discharge">Altas</span><span className="legend-procedure">Procedimentos</span><span className="legend-medication">Medicações</span></div>
          </div>
          <div className="trend-chart" role="img" aria-label="Gráfico de movimento dos últimos sete dias">
            {data.trends.map((day) => (
              <div className="trend-day" key={day.date}>
                <div className="trend-bars">
                  <i className="trend-admission" title={`${day.admissions} internações`} style={{ height: `${Math.max(4, (day.admissions / trendMaximum) * 100)}%` }} />
                  <i className="trend-discharge" title={`${day.discharges} altas`} style={{ height: `${Math.max(4, (day.discharges / trendMaximum) * 100)}%` }} />
                  <i className="trend-procedure" title={`${day.procedures} procedimentos`} style={{ height: `${Math.max(4, (day.procedures / trendMaximum) * 100)}%` }} />
                  <i className="trend-medication" title={`${day.medications} medicações`} style={{ height: `${Math.max(4, (day.medications / trendMaximum) * 100)}%` }} />
                </div>
                <strong>{day.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel priority-panel-v6">
          <div className="panel-header"><div><h2>Prioridade dos pacientes</h2><p>Distribuição das internações ativas.</p></div><HeartPulse size={20} /></div>
          <div className="priority-distribution">
            {data.priorityDistribution.map((item) => (
              <div className="priority-distribution-row" key={item.priority}>
                <div><span className={`priority-dot priority-dot-${item.priority.toLowerCase()}`} /><strong>{priorityNames[item.priority] ?? item.priority}</strong><b>{item.total}</b></div>
                <div className="progress-track"><span className={`priority-bar priority-bar-${item.priority.toLowerCase()}`} style={{ width: `${(item.total / totalPriorities) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <Link className="outline-button priority-link" to="/internacoes">Acompanhar pacientes <ArrowRight size={16} /></Link>
        </section>
      </div>

      <div className="dashboard-v5-grid">
        <section className="panel occupancy-panel">
          <div className="panel-header"><div><h2>Ocupação dos leitos</h2><p>Distribuição por setor em tempo real.</p></div><Link className="outline-button" to="/leitos">Mapa de leitos</Link></div>
          <div className="occupancy-overview">
            <div className="occupancy-donut" style={{ '--occupancy': `${data.metrics.occupancyRate * 3.6}deg` } as CSSProperties}><div><strong>{data.metrics.occupancyRate}%</strong><span>ocupado</span></div></div>
            <div className="occupancy-legend"><span><i className="legend-occupied" />{data.metrics.occupiedBeds} ocupados</span><span><i className="legend-available" />{data.metrics.availableBeds} disponíveis</span></div>
          </div>
          <div className="sector-bars">
            {data.sectors.length === 0 ? <div className="empty-state compact"><BedDouble /><h3>Nenhum leito cadastrado</h3></div> : data.sectors.map((sector) => (
              <div className="sector-row" key={sector.name}><div><strong>{sector.name}</strong><span>{sector.occupied}/{sector.total} ocupados</span></div><div className="progress-track"><span style={{ width: `${sector.occupancyRate}%` }} /></div><b>{sector.occupancyRate}%</b></div>
            ))}
          </div>
        </section>

        <aside className="panel alerts-panel">
          <div className="panel-header"><div><h2>Central de alertas</h2><p>Itens que pedem atenção agora.</p></div><span className="alert-count">{data.alerts.length}</span></div>
          <div className="dashboard-alerts">{data.alerts.length === 0 ? <div className="empty-state compact"><CheckCircle2 /><h3>Tudo sob controle</h3><p>Nenhum alerta prioritário.</p></div> : data.alerts.map((alert) => <AlertItem alert={alert} key={alert.id} />)}</div>
        </aside>
      </div>

      <div className="dashboard-v5-grid agenda-dashboard-grid">
        <section className="panel">
          <div className="panel-header"><div><h2>Agenda clínica de hoje</h2><p>Procedimentos programados por horário.</p></div><Link className="outline-button" to="/procedimentos">Abrir agenda</Link></div>
          <div className="dashboard-agenda-list">{data.agenda.procedures.length === 0 ? <div className="empty-state compact"><Stethoscope /><h3>Nenhum procedimento hoje</h3></div> : data.agenda.procedures.map((item) => (
            <Link to="/procedimentos" className="dashboard-agenda-item" key={item.id}><time>{formatTime(item.scheduledAt)}</time><div><strong>{item.title}</strong><span>{item.patient} • {item.bed}</span></div><span className={`status ${item.status.toLowerCase()}`}>{item.status === 'IN_PROGRESS' ? 'Em andamento' : item.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}</span></Link>
          ))}</div>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2>Próximas medicações</h2><p>Doses previstas para as próximas 6 horas.</p></div><Link className="outline-button" to="/medicacoes">Ver medicações</Link></div>
          <div className="dashboard-agenda-list">{data.agenda.medications.length === 0 ? <div className="empty-state compact"><Pill /><h3>Nenhuma dose próxima</h3></div> : data.agenda.medications.map((item) => (
            <Link to="/medicacoes" className="dashboard-agenda-item medication-agenda-item" key={item.id}><time>{formatTime(item.scheduledAt)}</time><div><strong>{item.medication} {item.dose ? `• ${item.dose} ${item.unit ?? ''}` : ''}</strong><span>{item.patient} • {item.bed}</span></div><Pill size={18} /></Link>
          ))}</div>
        </section>
      </div>

      <div className="dashboard-v6-bottom-grid">
        <section className="panel movements-panel">
          <div className="panel-header"><div><h2>Últimas movimentações</h2><p>Atividades registradas recentemente no sistema.</p></div><Activity size={20} /></div>
          <div className="movement-list">{data.activity.length === 0 ? <div className="empty-state compact"><Activity /><h3>Nenhuma movimentação</h3></div> : data.activity.map((item) => <ActivityItem key={item.id} item={item} />)}</div>
        </section>

        <section className="panel critical-panel-v6">
          <div className="panel-header"><div><h2>Pacientes prioritários</h2><p>Acompanhamento imediato.</p></div><Link className="outline-button" to="/internacoes">Ver todos</Link></div>
          <div className="critical-patient-list">{data.recent.length === 0 ? <div className="empty-state compact"><BedDouble /><h3>Nenhuma internação ativa</h3></div> : data.recent.slice(0, 5).map((item) => (
            <Link to={`/internacoes/${item.id}`} className="critical-patient-card" key={item.id}><span className={`patient-priority-mark mark-${item.priority.toLowerCase()}`} /><div><strong>{item.animal}</strong><span>{item.bed} • {statusNames[item.status] ?? item.status}</span></div><b>{priorityNames[item.priority] ?? item.priority}</b><ArrowRight size={16} /></Link>
          ))}</div>
        </section>
      </div>
    </>
  );
}
