import { AlertTriangle, BedDouble, CalendarDays, Clock3, Pill, Plus, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { DashboardData } from '../types';

const statusNames: Record<string, string> = {
  CRITICAL: 'Crítico', HOSPITALIZED: 'Internado', OBSERVATION: 'Observação', RECOVERY: 'Recuperação',
  PROCEDURE: 'Em procedimento', WAITING: 'Aguardando', DISCHARGE_EXPECTED: 'Alta prevista'
};

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardData>('/dashboard/summary')
      .then((response) => setData(response.data))
      .catch(() => setError('Não foi possível carregar o dashboard. Verifique se a API está ativa.'));
  }, []);

  if (error) return <div className="state-card error-state">{error}</div>;
  if (!data) return <div className="state-card loading-state">Carregando indicadores da clínica...</div>;

  const cards = [
    { label: 'Internações ativas', value: data.metrics.hospitalized, detail: 'Pacientes sob cuidados', icon: BedDouble, tone: 'blue' },
    { label: 'Pacientes críticos', value: data.metrics.critical, detail: 'Exigem atenção imediata', icon: AlertTriangle, tone: 'orange' },
    { label: 'Procedimentos pendentes', value: data.metrics.pendingProcedures, detail: 'Programados para hoje', icon: Clock3, tone: 'blue' },
    { label: 'Medicações próximas', value: data.metrics.pendingMedications, detail: 'Doses aguardando registro', icon: Pill, tone: 'orange' }
  ];

  return (
    <>
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow hero-eyebrow">VISÃO GERAL DA CLÍNICA</p>
          <h1>Dashboard</h1>
          <p>Acompanhe a operação da PetLife e os pacientes que precisam de atenção.</p>
        </div>
        <div className="hero-actions">
          <span className="date-chip"><CalendarDays size={16} />{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}</span>
          <Link className="primary-button button-with-icon" to="/animais"><Plus size={17} />Novo paciente</Link>
        </div>
      </div>

      <div className="metrics-grid">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className={`metric-card metric-${tone}`} key={label}>
            <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
            <div className="metric-icon"><Icon /></div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel dashboard-main-panel">
          <div className="panel-header">
            <div><h2>Internações recentes</h2><p>Pacientes atualmente sob os cuidados da equipe.</p></div>
            <Link className="outline-button" to="/internacoes">Ver todas</Link>
          </div>
          {data.recent.length === 0 ? (
            <div className="empty-state"><BedDouble size={40} /><h3>Nenhuma internação ativa</h3><p>Os próximos pacientes internados aparecerão aqui.</p></div>
          ) : (
            <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Tutor</th><th>Leito</th><th>Status</th><th>Entrada</th></tr></thead><tbody>
              {data.recent.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.animal}</strong><span>{item.species}</span></td>
                  <td>{item.tutor}</td><td>{item.bed}</td>
                  <td><span className={`status ${item.status.toLowerCase()}`}>{statusNames[item.status] ?? item.status}</span></td>
                  <td>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.admittedAt))}</td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </section>

        <aside className="panel quick-panel">
          <div className="panel-header"><div><h2>Acesso rápido</h2><p>Atalhos da rotina.</p></div></div>
          <Link to="/tutores" className="quick-link"><span><UserRound /></span><div><strong>Novo tutor</strong><small>Cadastre um responsável</small></div><b>→</b></Link>
          <Link to="/animais" className="quick-link"><span><Plus /></span><div><strong>Novo animal</strong><small>Adicione um paciente</small></div><b>→</b></Link>
          <Link to="/internacoes" className="quick-link"><span><BedDouble /></span><div><strong>Internações</strong><small>Acesse o mapa clínico</small></div><b>→</b></Link>
          <div className="clinic-status"><span className="online-dot" /><div><strong>Sistema operacional</strong><small>API e banco conectados</small></div></div>
        </aside>
      </div>
    </>
  );
}
