import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Pill,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardAlert, DashboardData } from '../types';

const statusNames: Record<string, string> = {
  CRITICAL: 'Crítico',
  HOSPITALIZED: 'Internado',
  OBSERVATION: 'Observação',
  RECOVERY: 'Recuperação',
  PROCEDURE: 'Em procedimento',
  WAITING: 'Aguardando',
  DISCHARGE_EXPECTED: 'Alta prevista'
};

const alertIcons = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Clock3,
  success: CheckCircle2
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
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

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardData>('/dashboard/summary')
      .then((response) => setData(response.data))
      .catch(() => setError('Não foi possível carregar o dashboard. Verifique se a API está ativa.'));
  }, []);

  const cards = useMemo(() => data ? [
    { label: 'Internações ativas', value: data.metrics.hospitalized, detail: `${data.metrics.critical} paciente(s) crítico(s)`, icon: HeartPulse, tone: 'blue', href: '/internacoes' },
    { label: 'Taxa de ocupação', value: `${data.metrics.occupancyRate}%`, detail: `${data.metrics.occupiedBeds} de ${data.metrics.totalBeds} leitos`, icon: TrendingUp, tone: data.metrics.occupancyRate >= 85 ? 'red' : 'orange', href: '/leitos' },
    { label: 'Leitos disponíveis', value: data.metrics.availableBeds, detail: 'Capacidade para admissões', icon: BedDouble, tone: 'green', href: '/leitos' },
    { label: 'Procedimentos pendentes', value: data.metrics.pendingProcedures, detail: `${data.metrics.overdueProcedures} atrasado(s)`, icon: Stethoscope, tone: data.metrics.overdueProcedures ? 'red' : 'blue', href: '/procedimentos' },
    { label: 'Medicações pendentes', value: data.metrics.pendingMedications, detail: `${data.metrics.overdueMedications} atrasada(s)`, icon: Pill, tone: data.metrics.overdueMedications ? 'red' : 'orange', href: '/medicacoes' },
    { label: 'Altas previstas', value: data.metrics.expectedDischarges, detail: 'Previsão para hoje', icon: CalendarDays, tone: 'blue', href: '/internacoes' }
  ] : [], [data]);

  if (error) return <div className="state-card error-state">{error}</div>;
  if (!data) return <DashboardSkeleton />;

  return (
    <>
      <div className="dashboard-hero dashboard-hero-v5">
        <div>
          <p className="eyebrow hero-eyebrow">CENTRAL OPERACIONAL</p>
          <h1>Bom dia, equipe PetLife</h1>
          <p>Uma visão completa dos pacientes, leitos e atividades clínicas prioritárias.</p>
        </div>
        <div className="hero-actions">
          <span className="date-chip"><CalendarDays size={16} />{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</span>
          <Link className="primary-button button-with-icon" to="/internacoes">Nova internação <ArrowRight size={17} /></Link>
        </div>
      </div>

      <div className="metrics-grid metrics-grid-v5">
        {cards.map(({ label, value, detail, icon: Icon, tone, href }) => (
          <Link className={`metric-card metric-${tone} metric-link`} key={label} to={href}>
            <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
            <div className="metric-icon"><Icon /></div>
          </Link>
        ))}
      </div>

      <div className="dashboard-v5-grid">
        <section className="panel occupancy-panel">
          <div className="panel-header">
            <div><h2>Ocupação dos leitos</h2><p>Distribuição por setor em tempo real.</p></div>
            <Link className="outline-button" to="/leitos">Mapa de leitos</Link>
          </div>
          <div className="occupancy-overview">
            <div className="occupancy-donut" style={{ '--occupancy': `${data.metrics.occupancyRate * 3.6}deg` } as CSSProperties}>
              <div><strong>{data.metrics.occupancyRate}%</strong><span>ocupado</span></div>
            </div>
            <div className="occupancy-legend">
              <span><i className="legend-occupied" />{data.metrics.occupiedBeds} ocupados</span>
              <span><i className="legend-available" />{data.metrics.availableBeds} disponíveis</span>
            </div>
          </div>
          <div className="sector-bars">
            {data.sectors.length === 0 ? <div className="empty-state compact"><BedDouble /><h3>Nenhum leito cadastrado</h3></div> : data.sectors.map((sector) => (
              <div className="sector-row" key={sector.name}>
                <div><strong>{sector.name}</strong><span>{sector.occupied}/{sector.total} ocupados</span></div>
                <div className="progress-track"><span style={{ width: `${sector.occupancyRate}%` }} /></div>
                <b>{sector.occupancyRate}%</b>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel alerts-panel">
          <div className="panel-header"><div><h2>Central de alertas</h2><p>Itens que pedem atenção agora.</p></div><span className="alert-count">{data.alerts.length}</span></div>
          <div className="dashboard-alerts">
            {data.alerts.length === 0 ? <div className="empty-state compact"><CheckCircle2 /><h3>Tudo sob controle</h3><p>Nenhum alerta prioritário.</p></div> : data.alerts.map((alert) => <AlertItem alert={alert} key={alert.id} />)}
          </div>
        </aside>
      </div>

      <div className="dashboard-v5-grid agenda-dashboard-grid">
        <section className="panel">
          <div className="panel-header"><div><h2>Agenda clínica de hoje</h2><p>Procedimentos programados por horário.</p></div><Link className="outline-button" to="/procedimentos">Abrir agenda</Link></div>
          <div className="dashboard-agenda-list">
            {data.agenda.procedures.length === 0 ? <div className="empty-state compact"><Stethoscope /><h3>Nenhum procedimento hoje</h3></div> : data.agenda.procedures.map((item) => (
              <Link to="/procedimentos" className="dashboard-agenda-item" key={item.id}>
                <time>{formatTime(item.scheduledAt)}</time>
                <div><strong>{item.title}</strong><span>{item.patient} • {item.bed}</span></div>
                <span className={`status ${item.status.toLowerCase()}`}>{item.status === 'IN_PROGRESS' ? 'Em andamento' : item.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2>Próximas medicações</h2><p>Doses previstas para as próximas 6 horas.</p></div><Link className="outline-button" to="/medicacoes">Ver medicações</Link></div>
          <div className="dashboard-agenda-list">
            {data.agenda.medications.length === 0 ? <div className="empty-state compact"><Pill /><h3>Nenhuma dose próxima</h3></div> : data.agenda.medications.map((item) => (
              <Link to="/medicacoes" className="dashboard-agenda-item medication-agenda-item" key={item.id}>
                <time>{formatTime(item.scheduledAt)}</time>
                <div><strong>{item.medication} {item.dose ? `• ${item.dose} ${item.unit ?? ''}` : ''}</strong><span>{item.patient} • {item.bed}</span></div>
                <Pill size={18} />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="panel dashboard-main-panel dashboard-recent-v5">
        <div className="panel-header"><div><h2>Pacientes prioritários</h2><p>Internações ativas ordenadas por prioridade e entrada.</p></div><Link className="outline-button" to="/internacoes">Ver todas</Link></div>
        {data.recent.length === 0 ? <div className="empty-state"><BedDouble size={40} /><h3>Nenhuma internação ativa</h3><p>Os próximos pacientes internados aparecerão aqui.</p></div> : (
          <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Tutor</th><th>Leito</th><th>Prioridade</th><th>Status</th><th>Entrada</th></tr></thead><tbody>
            {data.recent.map((item) => <tr key={item.id}>
              <td><strong>{item.animal}</strong><span>{item.species}</span></td>
              <td>{item.tutor}</td><td>{item.bed}</td>
              <td><span className={`priority-pill priority-${item.priority.toLowerCase()}`}>{item.priority === 'HIGH' ? 'Alta' : item.priority === 'URGENT' ? 'Urgente' : item.priority === 'LOW' ? 'Baixa' : 'Normal'}</span></td>
              <td><span className={`status ${item.status.toLowerCase()}`}>{statusNames[item.status] ?? item.status}</span></td>
              <td>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.admittedAt))}</td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
    </>
  );
}
