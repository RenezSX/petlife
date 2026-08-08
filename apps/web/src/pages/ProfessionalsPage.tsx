import { ArchiveRestore, BriefcaseMedical, Edit3, Plus, Search, Stethoscope, UserRoundCheck, UserRoundX } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { api } from '../services/api';
import type { Paginated, Professional, ProfessionalStats } from '../types';

const roleLabels: Record<string, string> = {
  VETERINARIAN: 'Veterinário(a)', ASSISTANT: 'Auxiliar veterinário', RECEPTIONIST: 'Recepção', GROOMER: 'Banho e tosa', OTHER: 'Outro',
};
const empty = { name: '', role: 'VETERINARIAN', crmv: '', specialty: '', phone: '', email: '', notes: '' };
function errorMessage(error: unknown) { const e = error as { response?: { data?: { message?: string } } }; return e.response?.data?.message ?? 'Não foi possível concluir a operação.'; }

export function ProfessionalsPage() {
  const [data, setData] = useState<Paginated<Professional> | null>(null);
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Professional | null | undefined>(undefined);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [list, summary] = await Promise.all([
        api.get<Paginated<Professional>>('/professionals', { params: { search, status, role, page } }),
        api.get<ProfessionalStats>('/professionals/stats'),
      ]);
      setData(list.data); setStats(summary.data);
    } catch { setError('Não foi possível carregar os profissionais.'); }
    finally { setLoading(false); }
  }, [search, status, role, page]);

  useEffect(() => { const id = window.setTimeout(() => void load(), 220); return () => window.clearTimeout(id); }, [load]);
  useEffect(() => { if (!success) return; const id = window.setTimeout(() => setSuccess(''), 2800); return () => window.clearTimeout(id); }, [success]);

  function open(item?: Professional) {
    setEditing(item ?? null); setError('');
    setForm(item ? { name: item.name, role: item.role, crmv: item.crmv ?? '', specialty: item.specialty ?? '', phone: item.phone ?? '', email: item.email ?? '', notes: item.notes ?? '' } : empty);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      if (editing) await api.put(`/professionals/${editing.id}`, form); else await api.post('/professionals', form);
      setSuccess(editing ? 'Profissional atualizado com sucesso.' : 'Profissional cadastrado com sucesso.');
      setEditing(undefined); await load();
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  }

  async function toggle(item: Professional) {
    if (!confirm(`${item.active ? 'Inativar' : 'Reativar'} ${item.name}?`)) return;
    try {
      await api.patch(`/professionals/${item.id}/${item.active ? 'deactivate' : 'reactivate'}`);
      setSuccess(item.active ? 'Profissional inativado.' : 'Profissional reativado.');
      await load();
    } catch (err) { setError(errorMessage(err)); }
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">EQUIPE CLÍNICA</p><h1>Profissionais</h1><p className="muted">Cadastre veterinários e equipe de apoio e use-os nos fluxos clínicos do PetLife.</p></div><button className="primary-button button-with-icon" onClick={() => open()}><Plus />Novo profissional</button></div>
    {stats && <div className="mini-metrics professional-metrics"><article><BriefcaseMedical/><div><strong>{stats.active}</strong><span>Profissionais ativos</span></div></article><article><Stethoscope/><div><strong>{stats.veterinarians}</strong><span>Veterinários</span></div></article><article><UserRoundCheck/><div><strong>{stats.support}</strong><span>Equipe de apoio</span></div></article><article><UserRoundX/><div><strong>{stats.inactive}</strong><span>Inativos</span></div></article></div>}
    {success && <div className="success-banner" role="status">{success}</div>}
    <section className="panel">
      <div className="toolbar toolbar-wrap"><div className="search-box"><Search/><input aria-label="Pesquisar profissionais" placeholder="Buscar por nome, CRMV, especialidade ou contato" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></div><select aria-label="Filtrar por função" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}><option value="all">Todas as funções</option>{Object.entries(roleLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select><select aria-label="Filtrar por situação" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option></select></div>
      {error && editing === undefined && <div className="form-error">{error}</div>}
      {loading && !data ? <div className="empty-state">Carregando...</div> : data?.items.length === 0 ? <div className="empty-state"><Stethoscope size={40}/><h3>Nenhum profissional encontrado</h3><p>Cadastre a equipe clínica ou altere os filtros.</p></div> : <div className="table-wrap"><table><thead><tr><th>Profissional</th><th>Função</th><th>CRMV</th><th>Contato</th><th>Status</th><th aria-label="Ações"></th></tr></thead><tbody>{data?.items.map(item => <tr key={item.id}><td><strong>{item.name}</strong><span>{item.specialty || 'Especialidade não informada'}</span></td><td>{roleLabels[item.role] ?? item.role}</td><td>{item.crmv || '—'}</td><td><strong>{item.phone || '—'}</strong><span>{item.email || 'E-mail não informado'}</span></td><td><span className={`status ${item.active ? 'active-status' : 'inactive-status'}`}>{item.active ? 'Ativo' : 'Inativo'}</span></td><td><div className="row-actions"><button className="icon-button" aria-label={`Editar ${item.name}`} title="Editar" onClick={() => open(item)}><Edit3/></button><button className="icon-button" aria-label={`${item.active ? 'Inativar' : 'Reativar'} ${item.name}`} title={item.active ? 'Inativar' : 'Reativar'} onClick={() => void toggle(item)}>{item.active ? <UserRoundX/> : <ArchiveRestore/>}</button></div></td></tr>)}</tbody></table></div>}
      {data && <Pagination value={data.pagination} onChange={setPage}/>} 
    </section>
    {editing !== undefined && <Modal title={editing ? 'Editar profissional' : 'Novo profissional'} subtitle="Mantenha a equipe atualizada para vincular responsáveis aos atendimentos." onClose={() => setEditing(undefined)} wide><form className="entity-form" onSubmit={submit}><div className="form-grid three-cols"><label className="full">Nome completo *<input required autoFocus value={form.name} onChange={e => setForm({...form,name:e.target.value})}/></label><label>Função *<select required value={form.role} onChange={e => setForm({...form,role:e.target.value})}>{Object.entries(roleLabels).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>CRMV<input placeholder="Ex.: CRMV-SP 12345" value={form.crmv} onChange={e => setForm({...form,crmv:e.target.value})}/></label><label>Especialidade<input placeholder="Ex.: Clínica geral" value={form.specialty} onChange={e => setForm({...form,specialty:e.target.value})}/></label><label>Telefone<input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/></label><label>E-mail<input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label><label className="full">Observações<textarea rows={3} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}/></label></div>{error && <div className="form-error">{error}</div>}<footer className="form-footer"><button type="button" className="ghost-button" onClick={() => setEditing(undefined)}>Cancelar</button><button className="primary-button" disabled={loading}>{loading ? 'Salvando...' : 'Salvar profissional'}</button></footer></form></Modal>}
  </>;
}
