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
  Download,
  FileText,
  HeartPulse,
  LogIn,
  LogOut,
  Paperclip,
  Pill,
  Plus,
  Printer,
  Upload,
  Search,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { ClinicalAttachment, HospitalizationTimeline, ProfessionalOption, TimelineEvent } from '../types';

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

function attachmentFileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes:number){
  if(bytes<1024)return `${bytes} B`;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
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
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentDescription, setAttachmentDescription] = useState('');
  const [attachmentCategory, setAttachmentCategory] = useState('EXAM');
  const [attachmentProfessionalId, setAttachmentProfessionalId] = useState('');


  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const [timelineResponse, professionalsResponse, attachmentsResponse] = await Promise.all([
        api.get(`/hospitalizations/${id}/timeline`),
        api.get<ProfessionalOption[]>('/professionals/options'),
        api.get<ClinicalAttachment[]>(`/hospitalizations/${id}/attachments`),
      ]);
      setData(timelineResponse.data);
      setProfessionals(Array.isArray(professionalsResponse.data) ? professionalsResponse.data : []);
      setAttachments(Array.isArray(attachmentsResponse.data) ? attachmentsResponse.data : []);
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

  async function submitAttachment(event: FormEvent) {
    event.preventDefault();
    if (!id || !attachmentFile) return;
    if (attachmentFile.size > 8 * 1024 * 1024) {
      setError('O anexo deve ter no máximo 8 MB.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const dataUrl = await attachmentFileToDataUrl(attachmentFile);
      await api.post(`/hospitalizations/${id}/attachments`, {
        fileName: attachmentFile.name,
        mimeType: attachmentFile.type || 'application/octet-stream',
        sizeBytes: attachmentFile.size,
        dataUrl,
        description: attachmentDescription.trim() || null,
        category: attachmentCategory,
        professionalId: attachmentProfessionalId || null,
      });
      setAttachmentModal(false);
      setAttachmentFile(null);
      setAttachmentDescription('');
      setAttachmentCategory('EXAM');
      setAttachmentProfessionalId('');
      await load();
    } catch (uploadError) {
      setError(message(uploadError));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeAttachment(item: ClinicalAttachment) {
    if (!id || !window.confirm(`Excluir o anexo “${item.fileName}”?`)) return;
    try {
      await api.delete(`/hospitalizations/${id}/attachments/${item.id}`);
      await load();
    } catch (removeError) {
      setError(message(removeError));
    }
  }

  function downloadAttachment(item: ClinicalAttachment) {
    const anchor = document.createElement('a');
    anchor.href = item.dataUrl;
    anchor.download = item.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
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
          <button className="secondary-button button-with-icon" onClick={() => setAttachmentModal(true)}><Paperclip />Anexar arquivo</button>
          {!h.dischargedAt && <button className="primary-button button-with-icon" onClick={openNew}><Plus />Novo registro</button>}
        </div>
      </div>

      <div className="timeline-print-header">
        <strong>PetLife</strong>
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

      {data.events.filter((event) => event.vitals && [event.vitals.temperature,event.vitals.heartRate,event.vitals.respiratoryRate,event.vitals.weight].some((value)=>value!=null)).length > 1 && (
        <section className="panel vitals-trend-panel print-hidden">
          <div className="panel-header"><div><h2>Evolução dos sinais vitais</h2><p>Comparação dos últimos registros da internação.</p></div></div>
          <div className="vitals-trend-grid">
            {[
              ['Temperatura','temperature','°C'],
              ['Freq. cardíaca','heartRate','bpm'],
              ['Freq. respiratória','respiratoryRate','irpm'],
              ['Peso','weight','kg']
            ].map(([label,key,unit])=>{
              const points=data.events.filter((event)=>(event.vitals as any)?.[key]!=null).slice(-8);
              const values=points.map((event)=>Number((event.vitals as any)?.[key]??0));
              const min=Math.min(...values),max=Math.max(...values),span=Math.max(1,max-min);
              return <article key={key}><span>{label}</span>{values.length?<><strong>{values.at(-1)} {unit}</strong><div className="sparkline">{values.map((value,index)=><i key={index} style={{height:`${20+((value-min)/span)*60}%`}} title={`${value} ${unit}`}/>)}</div><small>{values.length} registro(s)</small></>:<small>Sem dados</small>}</article>
            })}
          </div>
        </section>
      )}

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

      <section className="panel clinical-attachments-panel print-hidden">
        <div className="panel-header">
          <div><h2>Anexos clínicos</h2><p>Exames, imagens e documentos vinculados a esta internação.</p></div>
          <button className="primary-button button-with-icon" onClick={() => setAttachmentModal(true)}><Upload />Novo anexo</button>
        </div>
        {attachments.length === 0 ? (
          <div className="empty-state"><Paperclip size={40}/><h3>Nenhum anexo</h3><p>Adicione exames, imagens ou documentos ao prontuário.</p></div>
        ) : (
          <div className="clinical-attachment-grid">
            {attachments.map((item) => (
              <article className="clinical-attachment-card" key={item.id}>
                <div className="attachment-preview">
                  {item.mimeType.startsWith('image/') ? <img src={item.dataUrl} alt={item.fileName}/> : <FileText size={34}/>}
                </div>
                <div className="attachment-info">
                  <strong title={item.fileName}>{item.fileName}</strong><em className="attachment-category">{({EXAM:'Exame',IMAGE:'Imagem',REPORT:'Laudo',PRESCRIPTION:'Receita',OTHER:'Outro'} as Record<string,string>)[item.category] ?? 'Outro'}</em>
                  <span>{formatBytes(item.sizeBytes)} • {new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                  {item.description && <p>{item.description}</p>}
                  <small>Responsável: {item.professionalName || 'Não informado'}</small>
                </div>
                <div className="attachment-actions">
                  <button className="icon-button" title="Baixar" onClick={() => downloadAttachment(item)}><Download/></button>
                  <button className="icon-button danger-icon" title="Excluir" onClick={() => void removeAttachment(item)}><Trash2/></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {attachmentModal && (
        <Modal title="Novo anexo clínico" subtitle={`Vincular arquivo ao prontuário de ${h.animal.name}.`} onClose={() => setAttachmentModal(false)} wide>
          <form className="entity-form" onSubmit={submitAttachment}>
            <div className="form-grid">
              <label className="full attachment-drop-field">
                Arquivo *
                <input required type="file" accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx" onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}/>
                <span><Upload/> {attachmentFile ? `${attachmentFile.name} • ${formatBytes(attachmentFile.size)}` : 'Selecione um arquivo de até 8 MB'}</span>
              </label>
              <label>Categoria
                <select value={attachmentCategory} onChange={(event)=>setAttachmentCategory(event.target.value)}>
                  <option value="EXAM">Exame</option><option value="IMAGE">Imagem</option><option value="REPORT">Laudo</option><option value="PRESCRIPTION">Receita</option><option value="OTHER">Outro</option>
                </select>
              </label>
              <label>Profissional responsável
                <select value={attachmentProfessionalId} onChange={(event) => setAttachmentProfessionalId(event.target.value)}>
                  <option value="">Não informado</option>
                  {professionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}{professional.crmv ? ` • ${professional.crmv}` : ''}</option>)}
                </select>
              </label>
              <label className="full">Descrição
                <textarea rows={3} maxLength={500} placeholder="Ex.: Hemograma realizado na admissão." value={attachmentDescription} onChange={(event) => setAttachmentDescription(event.target.value)}/>
              </label>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="form-footer"><button type="button" className="secondary-button" onClick={() => setAttachmentModal(false)}>Cancelar</button><button className="primary-button" disabled={submitting || !attachmentFile}>{submitting ? 'Enviando...' : 'Adicionar ao prontuário'}</button></div>
          </form>
        </Modal>
      )}

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
