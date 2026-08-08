import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Pill, Stethoscope, LogOut } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

type AgendaItem = {
  id:string; sourceId:string; type:'PROCEDURE'|'MEDICATION'|'DISCHARGE'; title:string;
  scheduledAt:string; status:string; professional?:string|null; patient:string; tutor:string;
  bed?:string|null; sector?:string|null; hospitalizationId:string; detail?:string|null;
};
type Professional={id:string;name:string;role:string};
type AgendaResponse={date:string;items:AgendaItem[];stats:{total:number;procedures:number;medications:number;discharges:number;overdue:number}};

const isoDate=(date:Date)=>{const offset=date.getTimezoneOffset()*60000;return new Date(date.getTime()-offset).toISOString().slice(0,10)};
const addDays=(value:string,days:number)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+days);return isoDate(d)};
const typeLabel={PROCEDURE:'Procedimento',MEDICATION:'Medicação',DISCHARGE:'Alta prevista'};
const statusLabel:Record<string,string>={PENDING:'Pendente',IN_PROGRESS:'Em andamento',COMPLETED:'Concluído',CANCELED:'Cancelado',ADMINISTERED:'Administrada',NOT_ADMINISTERED:'Não administrada',REFUSED:'Recusada',EXPECTED:'Prevista'};

export function AgendaPage(){
  const [date,setDate]=useState(isoDate(new Date()));
  const [type,setType]=useState('all');
  const [professionalId,setProfessionalId]=useState('all');
  const [data,setData]=useState<AgendaResponse|null>(null);
  const [professionals,setProfessionals]=useState<Professional[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  const load=useCallback(async()=>{
    try{
      setLoading(true);setError('');
      const [agenda,pros]=await Promise.all([
        api.get('/agenda',{params:{date,type,professionalId}}),
        api.get('/professionals/options')
      ]);
      setData(agenda.data);
      const raw=pros.data;
      setProfessionals(Array.isArray(raw)?raw:(raw.items??raw.professionals??[]));
    }catch(e){console.error(e);setError('Não foi possível carregar a agenda clínica.');}
    finally{setLoading(false)}
  },[date,type,professionalId]);

  useEffect(()=>{void load()},[load]);

  const grouped=useMemo(()=>{
    const groups=new Map<string,AgendaItem[]>();
    for(const item of data?.items??[]){
      const hour=new Date(item.scheduledAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      groups.set(hour,[...(groups.get(hour)??[]),item]);
    }
    return [...groups.entries()];
  },[data]);

  const overdue=(item:AgendaItem)=>item.type!=='DISCHARGE'&&!['COMPLETED','ADMINISTERED','CANCELED'].includes(item.status)&&new Date(item.scheduledAt)<new Date();

  return <div className="agenda-page">
    <div className="page-heading">
      <div><p className="eyebrow">ROTINA DA CLÍNICA</p><h1>Agenda clínica</h1><p className="muted">Procedimentos, medicações e altas previstas em uma única visão.</p></div>
      <button className="secondary-button button-with-icon" onClick={()=>window.print()}><CalendarDays/>Imprimir agenda</button>
    </div>

    <div className="agenda-date-nav">
      <button className="icon-button" onClick={()=>setDate(addDays(date,-1))} aria-label="Dia anterior"><ChevronLeft/></button>
      <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
      <button className="secondary-button" onClick={()=>setDate(isoDate(new Date()))}>Hoje</button>
      <button className="icon-button" onClick={()=>setDate(addDays(date,1))} aria-label="Próximo dia"><ChevronRight/></button>
      <select value={type} onChange={e=>setType(e.target.value)}>
        <option value="all">Todos os eventos</option><option value="procedure">Procedimentos</option>
        <option value="medication">Medicações</option><option value="discharge">Altas previstas</option>
      </select>
      <select value={professionalId} onChange={e=>setProfessionalId(e.target.value)}>
        <option value="all">Todos os profissionais</option>
        {professionals.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>

    {data&&<div className="mini-metrics agenda-metrics">
      <article><CalendarDays/><div><strong>{data.stats.total}</strong><span>Eventos no dia</span></div></article>
      <article><ClipboardList/><div><strong>{data.stats.procedures}</strong><span>Procedimentos</span></div></article>
      <article><Pill/><div><strong>{data.stats.medications}</strong><span>Medicações</span></div></article>
      <article><AlertTriangle/><div><strong>{data.stats.overdue}</strong><span>Atrasados</span></div></article>
    </div>}

    {error&&<div className="form-error">{error}</div>}
    <section className="panel agenda-clinic-panel">
      {loading?<div className="empty-state"><CalendarDays size={40}/><h3>Carregando agenda...</h3></div>:
       grouped.length===0?<div className="empty-state"><CalendarDays size={44}/><h3>Agenda livre</h3><p>Não há procedimentos, doses ou altas previstas para esta data.</p></div>:
       <div className="clinical-timeline">{grouped.map(([hour,items])=><div className="clinical-time-row" key={hour}>
         <div className="clinical-hour">{hour}</div>
         <div className="clinical-events">{items.map(item=><article className={`clinical-event event-${item.type.toLowerCase()} ${overdue(item)?'event-overdue':''}`} key={item.id}>
           <div className="clinical-event-icon">{item.type==='MEDICATION'?<Pill/>:item.type==='DISCHARGE'?<LogOut/>:<ClipboardList/>}</div>
           <div className="clinical-event-main">
             <div className="clinical-event-title"><strong>{item.title}</strong><span>{typeLabel[item.type]}</span>{overdue(item)&&<em>Atrasado</em>}</div>
             <p><b>{item.patient}</b> • {item.tutor}{item.bed?` • ${item.bed}`:''}{item.sector?` • ${item.sector}`:''}</p>
             <small><Stethoscope size={14}/>{item.professional||'Profissional não definido'}{item.detail?` • ${item.detail}`:''}</small>
           </div>
           <div className="clinical-event-actions"><span className={`status ${item.status.toLowerCase()}`}>{statusLabel[item.status]??item.status}</span>
             <Link className="secondary-button" to={`/internacoes/${item.hospitalizationId}`}>Prontuário</Link>
           </div>
         </article>)}</div>
       </div>)}</div>}
    </section>
  </div>
}
