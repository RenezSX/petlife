import {
  Activity,
  ArrowDownAZ,
  ArrowLeft,
  ArrowUpAZ,
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Edit3,
  FileText,
  HeartPulse,
  LogIn,
  LogOut,
  Pill,
  Plus,
  Printer,
  Search,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { HospitalizationTimeline, ProfessionalOption, TimelineEvent } from '../types';

type ClinicalEventForm = {
  type: 'EVOLUTION' | 'VITALS' | 'OBSERVATION';
  title: string;
  description: string;
  responsible: string;
  professionalId: string;
  eventAt: string;
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  weight: string;
};

const emptyForm: ClinicalEventForm = {
  type: 'EVOLUTION',
  title: '',
  description: '',
  responsible: '',
  professionalId: '',
  eventAt: '',
  temperature: '',
  heartRate: '',
  respiratoryRate: '',
  weight: '',
};

const eventLabels: Record<string, string> = {
  ADMISSION: 'Internação',
  EVOLUTION: 'Evolução',
  VITALS: 'Sinais vitais',
  OBSERVATION: 'Observação',
  PROCEDURE: 'Procedimento',
  MEDICATION: 'Medicação',
  DISCHARGE: 'Alta',
};

function iconFor(type: string) {
  if (type === 'PROCEDURE') return ClipboardList;
  if (type === 'MEDICATION') return Pill;
  if (type === 'DISCHARGE') return LogOut;
  if (type === 'EVOLUTION') return FileText;
  if (type === 'VITALS') return HeartPulse;
  if (type === 'OBSERVATION') return Activity;
  return LogIn;
}

function toLocalInput(value: string | Date) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function message(error: unknown) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? 'Não foi possível concluir a operação.';
}

function formatStay(hours: number) {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remaining = hours % 24;
  return remaining ? `${days}d ${remaining}h` : `${days}d`;
}

export function HospitalizationTimelinePage() {
  const { id } = useParams();
  const [data, setData] = useState<HospitalizationTimeline | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [form, setForm] = useState<ClinicalEventForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [ascending, setAscending] = useState(false);
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const [timelineResponse, professionalsResponse] = await Promise.all([
        api.get(`/hospitalizations/${id}/timeline`),
        api.get<ProfessionalOption[]>('/professionals/options'),
      ]);
      setData(timelineResponse.data);
      setProfessionals(Array.isArray(professionalsResponse.data) ? professionalsResponse.data : []);
    } catch {
      setError('Não foi possível carregar o prontuário.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const events = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = (data?.events ?? []).filter((event) => {
      const matchesType = type === 'ALL' || event.type === type;
      const matchesSearch = !query || [event.title, event.description, event.responsible]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      return matchesType && matchesSearch;
    });
    return [...filtered].sort((a, b) => {
      const difference = new Date(a.date).getTime() - new Date(b.date).getTime();
      return ascending ? difference : -difference;
    });
  }, [data, search, type, ascending]);

  function openNew() {
    setEditing(null);
    setError('');
    setForm({ ...emptyForm, professionalId: data?.hospitalization.professionalId ?? '', responsible: data?.hospitalization.veterinarian ?? '', eventAt: toLocalInput(new Date()) });
    setModal(true);
  }

  function openEdit(event: TimelineEvent) {
    setEditing(event);
    setError('');
    setForm({
      type: event.type as ClinicalEventForm['type'],
      title: event.title,
      description: event.description ?? '',
      responsible: event.responsible ?? '',
      professionalId: event.professionalId ?? '',
      eventAt: toLocalInput(event.date),
      temperature: event.vitals?.temperature?.toString() ?? '',
      heartRate: event.vitals?.heartRate?.toString() ?? '',
      respiratoryRate: event.vitals?.respiratoryRate?.toString() ?? '',
      weight: event.vitals?.weight?.toString() ?? '',
    });
    setModal(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        responsible: form.responsible.trim() || null,
        professionalId: form.professionalId || null,
        eventAt: new Date(form.eventAt).toISOString(),
        temperature: form.temperature === '' ? null : Number(form.temperature),
        heartRate: form.heartRate === '' ? null : Number(form.heartRate),
        respiratoryRate: form.respiratoryRate === '' ? null : Number(form.respiratoryRate),
        weight: form.weight === '' ? null : Number(form.weight),
      };
      if (editing) {
        await api.put(`/hospitalizations/${id}/timeline/events/${editing.id}`, payload);
      } else {
        await api.post(`/hospitalizations/${id}/timeline/events`, payload);
      }
      setModal(false);
      setEditing(null);
      await load();
    } catch (submitError) {
      setError(message(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(event: TimelineEvent) {
    if (!id || !window.confirm(`Excluir o registro “${event.title}”?`)) return;
    try {
      await api.delete(`/hospitalizations/${id}/timeline/events/${event.id}`);
      await load();
    } catch (removeError) {
      setError(message(removeError));
    }
  }

  if (loading) return <div className="timeline-skeleton"><div/><div/><div/></div>;
  if (error && !data) return <div className="form-error">{error}</div>;
  if (!data) return null;

  const h = data.hospitalization;

  return (
    <>
      <div className="page-heading print-hidden">
        <div>
          <Link className="back-link" to="/internacoes"><ArrowLeft />Voltar às internações</Link>
          <p className="eyebrow">PRONTUÁRIO DA INTERNAÇÃO</p>
          <h1>{h.animal.name}</h1>
          <p className="muted">{h.animal.species}{h.animal.breed ? ` • ${h.animal.breed}` : ''} • Tutor: {h.animal.tutor.name}</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button button-with-icon" onClick={() => window.print()}><Printer />Imprimir</button>
          {!h.dischargedAt && <button className="primary-button button-with-icon" onClick={openNew}><Plus />Novo registro</button>}
        </div>
      </div>

      <div className="timeline-print-header">
        <strong>PetLife São Caetano</strong>
        <span>Prontuário clínico • {h.animal.name}</span>
      </div>

      <div className="patient-summary patient-summary-expanded">
        <article><Stethoscope /><div><span>Veterinário</span><strong>{h.veterinarian || 'Não informado'}</strong></div></article>
        <article><BedDouble /><div><span>Leito</span><strong>{h.bed ? `${h.bed.sector} • ${h.bed.name}` : 'Sem leito'}</strong></div></article>
        <article><Clock3 /><div><span>Tempo internado</span><strong>{formatStay(data.summary.stayHours)}</strong></div></article>
        <article><CheckCircle2 /><div><span>Diagnóstico</span><strong>{h.diagnosis || 'Em investigação'}</strong></div></article>
      </div>

      <div className="timeline-metrics">
        <article><strong>{data.summary.totalEvents}</strong><span>Eventos registrados</span></article>
        <article><strong>{data.summary.clinicalEntries}</strong><span>Evoluções clínicas</span></article>
        <article><strong>{data.summary.procedures}</strong><span>Procedimentos</span></article>
        <article><strong>{data.summary.medicationDoses}</strong><span>Doses na timeline</span></article>
      </div>

      <section className="panel clinical-record-panel">
        <div className="panel-header">
          <div><h2>Linha do tempo clínica</h2><p>Histórico unificado de evoluções, sinais vitais, procedimentos e medicações.</p></div>
        </div>

        <div className="timeline-toolbar print-hidden">
          <div className="search-box"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na timeline" /></div>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="ALL">Todos os eventos</option>
            <option value="EVOLUTION">Evoluções</option>
            <option value="VITALS">Sinais vitais</option>
            <option value="OBSERVATION">Observações</option>
            <option value="PROCEDURE">Procedimentos</option>
            <option value="MEDICATION">Medicações</option>
            <option value="ADMISSION">Internação</option>
            <option value="DISCHARGE">Alta</option>
          </select>
          <button className="ghost-button button-with-icon" onClick={() => setAscending((value) => !value)}>
            {ascending ? <ArrowUpAZ /> : <ArrowDownAZ />}{ascending ? 'Mais antigos' : 'Mais recentes'}
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="clinical-timeline">
          {events.length === 0 ? <div className="empty-state"><FileText size={40}/><h3>Nenhum evento encontrado</h3><p>Altere os filtros ou registre uma nova evolução.</p></div> : events.map((event) => {
            const Icon = iconFor(event.type);
            return (
              <article key={`${event.type}-${event.id}`}>
                <div className={`timeline-icon type-${event.type.toLowerCase()}`}><Icon /></div>
                <div className="timeline-content">
                  <header>
                    <div>
                      <div className="timeline-title-row"><h3>{event.title}</h3><span className="event-type-badge">{eventLabels[event.type] ?? event.type}</span></div>
                      <span>{new Date(event.date).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="timeline-event-actions">
                      <span className={`status ${event.status.toLowerCase()}`}>{event.status}</span>
                      {event.editable && <div className="row-actions print-hidden"><button className="icon-button" title="Editar" onClick={() => openEdit(event)}><Edit3 /></button><button className="icon-button danger-icon" title="Excluir" onClick={() => void remove(event)}><Trash2 /></button></div>}
                    </div>
                  </header>
                  {event.description && <p>{event.description}</p>}
                  {event.vitals && [event.vitals.temperature, event.vitals.heartRate, event.vitals.respiratoryRate, event.vitals.weight].some((value) => value != null) && (
                    <div className="vitals-grid">
                      {event.vitals.temperature != null && <span><b>{event.vitals.temperature} °C</b>Temperatura</span>}
                      {event.vitals.heartRate != null && <span><b>{event.vitals.heartRate} bpm</b>Frequência cardíaca</span>}
                      {event.vitals.respiratoryRate != null && <span><b>{event.vitals.respiratoryRate} irpm</b>Frequência respiratória</span>}
                      {event.vitals.weight != null && <span><b>{event.vitals.weight} kg</b>Peso</span>}
                    </div>
                  )}
                  {event.responsible && <small>Responsável: {event.responsible}</small>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {modal && (
        <Modal title={editing ? 'Editar registro clínico' : 'Novo registro clínico'} subtitle="Adicione uma evolução, observação ou aferição de sinais vitais." onClose={() => setModal(false)} wide>
          <form className="entity-form" onSubmit={submit}>
            <div className="form-grid three-cols">
              <label>Tipo *<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ClinicalEventForm['type'] })}><option value="EVOLUTION">Evolução</option><option value="VITALS">Sinais vitais</option><option value="OBSERVATION">Observação</option></select></label>
              <label>Data e hora *<input required type="datetime-local" value={form.eventAt} onChange={(event) => setForm({ ...form, eventAt: event.target.value })}/></label>
              <label>Profissional responsável<select value={form.professionalId} onChange={(event) => { const professional = professionals.find((item) => item.id === event.target.value); setForm({ ...form, professionalId: event.target.value, responsible: professional?.name ?? '' }); }}><option value="">Não definido</option>{!form.professionalId && form.responsible && <option value="" disabled>{form.responsible} • registro antigo</option>}{professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}{professional.crmv ? ` • ${professional.crmv}` : ''}{professional.specialty ? ` • ${professional.specialty}` : ''}</option>)}</select></label>
              <label className="full">Título *<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label>
              <label className="full">Descrição clínica *<textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
              <div className="vitals-form full">
                <div><span>Sinais vitais opcionais</span><small>Preencha quando houver aferição.</small></div>
                <label>Temperatura (°C)<input type="number" step="0.1" min="20" max="50" value={form.temperature} onChange={(event) => setForm({ ...form, temperature: event.target.value })}/></label>
                <label>FC (bpm)<input type="number" min="0" value={form.heartRate} onChange={(event) => setForm({ ...form, heartRate: event.target.value })}/></label>
                <label>FR (irpm)<input type="number" min="0" value={form.respiratoryRate} onChange={(event) => setForm({ ...form, respiratoryRate: event.target.value })}/></label>
                <label>Peso (kg)<input type="number" step="0.01" min="0" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })}/></label>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="form-footer"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Cancelar</button><button className="primary-button" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar registro'}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
