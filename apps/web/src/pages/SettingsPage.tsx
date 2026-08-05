import { Building2, CheckCircle2, ImagePlus, Moon, Plus, Save, Sun, Trash2 } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useClinicSettings, type ClinicSettings } from '../contexts/ClinicSettingsContext';

type EditableListProps = {
  title: string;
  description: string;
  values: string[];
  onChange: (values: string[]) => void;
};

function EditableList({ title, description, values, onChange }: EditableListProps) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value || values.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    onChange([...values, value]);
    setDraft('');
  }

  return (
    <article className="settings-list-card">
      <div><h3>{title}</h3><p>{description}</p></div>
      <div className="settings-tags">
        {values.map((value) => (
          <span key={value}>{value}<button type="button" aria-label={`Remover ${value}`} onClick={() => onChange(values.filter((item) => item !== value))}><Trash2 size={14}/></button></span>
        ))}
      </div>
      <div className="settings-add-row">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} placeholder="Adicionar item" />
        <button type="button" className="secondary-button button-with-icon" onClick={add}><Plus size={17}/>Adicionar</button>
      </div>
    </article>
  );
}

const blank: Omit<ClinicSettings, 'id'> = {
  name: 'PetLife São Caetano', legalName: '', cnpj: '', phone: '', whatsapp: '', email: '', address: '', city: '', state: '', zipCode: '', logoDataUrl: '',
  openingHours: 'Atendimento 24 horas', sectors: [], priorities: [], species: [], medicationRoutes: [], theme: 'light', tagline: 'Cuidando com amor, tratando com excelência.',
};

export function SettingsPage() {
  const { settings, loading, save } = useClinicSettings();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      const { id: _id, ...rest } = settings;
      setForm(rest);
    }
  }, [settings]);

  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function readLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Selecione um arquivo de imagem.'); return; }
    if (file.size > 1_500_000) { setError('A imagem deve ter no máximo 1,5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => field('logoDataUrl', String(reader.result ?? ''));
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true); setError(''); setMessage('');
      await save(form);
      setMessage('Configurações salvas com sucesso.');
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message ?? 'Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !settings) return <div className="panel settings-loading">Carregando configurações...</div>;

  return (
    <form onSubmit={submit}>
      <div className="page-heading">
        <div><p className="eyebrow">PERSONALIZAÇÃO DO SISTEMA</p><h1>Configurações da clínica</h1><p className="muted">Centralize a identidade, os dados e as opções utilizadas no PetLife.</p></div>
        <button className="primary-button button-with-icon" disabled={saving}><Save size={18}/>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
      </div>

      {message && <div className="settings-success"><CheckCircle2 size={18}/>{message}</div>}
      {error && <div className="form-error">{error}</div>}

      <section className="settings-grid">
        <article className="panel settings-section settings-identity">
          <div className="settings-section-title"><Building2/><div><h2>Identidade da clínica</h2><p>Informações exibidas no sistema e nos relatórios.</p></div></div>
          <div className="settings-logo-area">
            <div className="settings-logo-preview">{form.logoDataUrl ? <img src={form.logoDataUrl} alt="Logotipo da clínica"/> : <ImagePlus size={40}/>}</div>
            <div><label className="secondary-button button-with-icon settings-upload"><ImagePlus size={17}/>Escolher logotipo<input type="file" accept="image/*" onChange={readLogo}/></label>{form.logoDataUrl && <button type="button" className="ghost-button" onClick={() => field('logoDataUrl', '')}>Remover imagem</button>}<small>PNG, JPG ou WEBP, até 1,5 MB.</small></div>
          </div>
          <div className="form-grid">
            <label>Nome da clínica *<input required value={form.name} onChange={(e) => field('name', e.target.value)}/></label>
            <label>Razão social<input value={form.legalName ?? ''} onChange={(e) => field('legalName', e.target.value)}/></label>
            <label>CNPJ<input value={form.cnpj ?? ''} onChange={(e) => field('cnpj', e.target.value)} placeholder="00.000.000/0000-00"/></label>
            <label>Telefone<input value={form.phone ?? ''} onChange={(e) => field('phone', e.target.value)}/></label>
            <label>WhatsApp<input value={form.whatsapp ?? ''} onChange={(e) => field('whatsapp', e.target.value)}/></label>
            <label>E-mail<input type="email" value={form.email ?? ''} onChange={(e) => field('email', e.target.value)}/></label>
            <label className="full">Endereço<input value={form.address ?? ''} onChange={(e) => field('address', e.target.value)}/></label>
            <label>Cidade<input value={form.city ?? ''} onChange={(e) => field('city', e.target.value)}/></label>
            <label>Estado<input value={form.state ?? ''} onChange={(e) => field('state', e.target.value)}/></label>
            <label>CEP<input value={form.zipCode ?? ''} onChange={(e) => field('zipCode', e.target.value)}/></label>
            <label className="full">Horário de funcionamento<textarea rows={2} value={form.openingHours ?? ''} onChange={(e) => field('openingHours', e.target.value)}/></label>
            <label className="full">Frase institucional<input value={form.tagline} onChange={(e) => field('tagline', e.target.value)}/></label>
          </div>
        </article>

        <article className="panel settings-section">
          <div className="settings-section-title"><Sun/><div><h2>Aparência</h2><p>Defina o tema padrão utilizado neste navegador.</p></div></div>
          <div className="theme-options">
            <button type="button" className={form.theme === 'light' ? 'active' : ''} onClick={() => field('theme', 'light')}><Sun/><strong>Claro</strong><span>Interface clara e luminosa.</span></button>
            <button type="button" className={form.theme === 'dark' ? 'active' : ''} onClick={() => field('theme', 'dark')}><Moon/><strong>Escuro</strong><span>Mais confortável à noite.</span></button>
            <button type="button" className={form.theme === 'system' ? 'active' : ''} onClick={() => field('theme', 'system')}><Building2/><strong>Sistema</strong><span>Segue o Windows ou navegador.</span></button>
          </div>
        </article>
      </section>

      <section className="settings-lists-grid">
        <EditableList title="Setores" description="Usados na organização dos leitos." values={form.sectors} onChange={(values) => field('sectors', values)}/>
        <EditableList title="Prioridades" description="Níveis disponíveis nas internações." values={form.priorities} onChange={(values) => field('priorities', values)}/>
        <EditableList title="Espécies atendidas" description="Opções sugeridas no cadastro de animais." values={form.species} onChange={(values) => field('species', values)}/>
        <EditableList title="Vias de administração" description="Opções utilizadas nas prescrições." values={form.medicationRoutes} onChange={(values) => field('medicationRoutes', values)}/>
      </section>

      <div className="settings-sticky-save"><button className="primary-button button-with-icon" disabled={saving}><Save size={18}/>{saving ? 'Salvando...' : 'Salvar configurações'}</button></div>
    </form>
  );
}
