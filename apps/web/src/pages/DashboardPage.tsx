import { AlertTriangle, BedDouble, Clock3, Pill } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { DashboardData } from '../types';

const statusNames: Record<string,string> = { CRITICAL:'Crítico', HOSPITALIZED:'Internado', OBSERVATION:'Observação', RECOVERY:'Recuperação', PROCEDURE:'Em procedimento', WAITING:'Aguardando', DISCHARGE_EXPECTED:'Alta prevista' };
export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null); const [error, setError] = useState('');
  useEffect(() => { api.get<DashboardData>('/dashboard/summary').then(r=>setData(r.data)).catch(()=>setError('Não foi possível carregar o dashboard.')); }, []);
  if (error) return <div className="state-card error-state">{error}</div>;
  if (!data) return <div className="state-card">Carregando indicadores...</div>;
  const cards = [
    { label:'Animais internados', value:data.metrics.hospitalized, icon:BedDouble },
    { label:'Pacientes críticos', value:data.metrics.critical, icon:AlertTriangle },
    { label:'Procedimentos pendentes', value:data.metrics.pendingProcedures, icon:Clock3 },
    { label:'Medicações próximas', value:data.metrics.pendingMedications, icon:Pill }
  ];
  return <>
    <div className="page-heading"><div><p className="eyebrow">VISÃO GERAL</p><h1>Dashboard de internação</h1><p className="muted">Acompanhe a operação e os pacientes que exigem atenção.</p></div><div className="date-chip">Atualizado agora</div></div>
    <div className="metrics-grid">{cards.map(({label,value,icon:Icon})=><article className="metric-card" key={label}><div className="metric-icon"><Icon/></div><div><span>{label}</span><strong>{value}</strong></div></article>)}</div>
    <section className="panel"><div className="panel-header"><div><h2>Internações recentes</h2><p>Pacientes atualmente sob cuidados da clínica.</p></div><button className="secondary-button">Ver mapa completo</button></div>
      {data.recent.length === 0 ? <div className="empty-state">Nenhuma internação ativa.</div> : <div className="table-wrap"><table><thead><tr><th>Paciente</th><th>Tutor</th><th>Leito</th><th>Status</th><th>Entrada</th></tr></thead><tbody>{data.recent.map(item=><tr key={item.id}><td><strong>{item.animal}</strong><span>{item.species}</span></td><td>{item.tutor}</td><td>{item.bed}</td><td><span className={`status ${item.status.toLowerCase()}`}>{statusNames[item.status] ?? item.status}</span></td><td>{new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(item.admittedAt))}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
