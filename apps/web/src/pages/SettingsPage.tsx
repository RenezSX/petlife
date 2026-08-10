import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  History,
  ImagePlus,
  Moon,
  Plus,
  RotateCcw,
  Save,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { useClinicSettings, type ClinicSettings } from '../contexts/ClinicSettingsContext';
import { api } from '../services/api';

type EditableListProps = {
  title: string;
  description: string;
  values: string[];
  onChange: (values: string[]) => void;
};

type BackupLog = {
  id: string;
  action: 'EXPORT' | 'IMPORT';
  fileName: string;
  createdAt: string;
  counts: Record<string, number>;
};

type BackupInfo = {
  version: string;
  lastBackup: Omit<BackupLog, 'counts'> | null;
  lastRestore: Omit<BackupLog, 'counts'> | null;
  history: BackupLog[];
};

type BackupPreview = {
  fileName: string;
  payload: {
    metadata: {
      app: string;
      version: string;
      schemaVersion: number;
      createdAt: string;
      counts: Record<string, number>;
    };
    data: Record<string, unknown[]>;
  };
};

const countLabels: Record<string, string> = {
  users: 'Usuários',
  tutors: 'Tutores',
  animals: 'Animais',
  beds: 'Leitos',
  hospitalizations: 'Internações',
  procedures: 'Procedimentos',
  medicationPrescriptions: 'Prescrições',
  medicationDoses: 'Doses',
  clinicalEvents: 'Registros clínicos',
  clinicSettings: 'Configurações',
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
  name: 'PetLife', legalName: '', cnpj: '', phone: '', whatsapp: '', email: '', address: '', city: '', state: '', zipCode: '', logoDataUrl: '',
  openingHours: 'Atendimento 24 horas', sectors: [], priorities: [], species: [], medicationRoutes: [], theme: 'light', tagline: 'Cuidando com amor, tratando com excelência.',
};

function formatDate(value?: string | null) {
  if (!value) return 'Ainda não realizado';
  return new Date(value).toLocaleString('pt-BR');
}

function getFileName(contentDisposition?: string) {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? `petlife-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

export function SettingsPage() {
  const { settings, loading, save, setTheme } = useClinicSettings();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [backupLoading, setBackupLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);

  useEffect(() => {
    if (settings) {
      const { id: _id, ...rest } = settings;
      setForm(rest);
    }
  }, [settings]);

  useEffect(() => {
    void loadBackupInfo();
  }, []);

  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadBackupInfo() {
    try {
      setBackupLoading(true);
      const response = await api.get<BackupInfo>('/backup/info');
      setBackupInfo(response.data);
    } catch (loadError) {
      console.error('Erro ao carregar informações de backup:', loadError);
    } finally {
      setBackupLoading(false);
    }
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

  async function exportBackup() {
    try {
      setExporting(true);
      setError('');
      setMessage('');
      const response = await api.get('/backup/export', { responseType: 'blob' });
      const fileName = getFileName(response.headers['content-disposition']);
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Backup criado e baixado com sucesso.');
      await loadBackupInfo();
    } catch (exportError: any) {
      setError(exportError?.response?.data?.message ?? 'Não foi possível criar o backup.');
    } finally {
      setExporting(false);
    }
  }

  async function selectBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Selecione um arquivo de backup no formato JSON.');
      return;
    }
    if (file.size > 20_000_000) {
      setError('O arquivo de backup deve ter no máximo 20 MB.');
      return;
    }

    try {
      const payload = JSON.parse(await file.text()) as BackupPreview['payload'];
      if (payload?.metadata?.app !== 'PetLife' || !payload.data || typeof payload.data !== 'object') {
        throw new Error('invalid');
      }
      setError('');
      setRestoreConfirmed(false);
      setBackupPreview({ fileName: file.name, payload });
    } catch {
      setError('O arquivo selecionado não é um backup válido do PetLife.');
    }
  }

  async function restoreBackup() {
    if (!backupPreview || !restoreConfirmed) return;
    try {
      setRestoring(true);
      setError('');
      const response = await api.post('/backup/import', {
        fileName: backupPreview.fileName,
        backup: backupPreview.payload,
      });
      setBackupPreview(null);
      setRestoreConfirmed(false);
      setMessage(response.data.message ?? 'Backup restaurado com sucesso.');
      await loadBackupInfo();
      window.setTimeout(() => window.location.reload(), 900);
    } catch (restoreError: any) {
      setError(restoreError?.response?.data?.message ?? 'Não foi possível restaurar o backup.');
    } finally {
      setRestoring(false);
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
            <button type="button" className={form.theme === 'light' ? 'active' : ''} onClick={() => { field('theme', 'light'); void setTheme('light'); }}><Sun/><strong>Claro</strong><span>Interface clara e luminosa.</span></button>
            <button type="button" className={form.theme === 'dark' ? 'active' : ''} onClick={() => { field('theme', 'dark'); void setTheme('dark'); }}><Moon/><strong>Escuro</strong><span>Mais confortável à noite.</span></button>
            <button type="button" className={form.theme === 'system' ? 'active' : ''} onClick={() => { field('theme', 'system'); void setTheme('system'); }}><Building2/><strong>Sistema</strong><span>Segue o Windows ou navegador.</span></button>
          </div>
        </article>
      </section>

      <section className="settings-lists-grid">
        <EditableList title="Setores" description="Usados na organização dos leitos." values={form.sectors} onChange={(values) => field('sectors', values)}/>
        <EditableList title="Prioridades" description="Níveis disponíveis nas internações." values={form.priorities} onChange={(values) => field('priorities', values)}/>
        <EditableList title="Espécies atendidas" description="Opções sugeridas no cadastro de animais." values={form.species} onChange={(values) => field('species', values)}/>
        <EditableList title="Vias de administração" description="Opções utilizadas nas prescrições." values={form.medicationRoutes} onChange={(values) => field('medicationRoutes', values)}/>
      </section>

      <section className="panel backup-section">
        <div className="settings-section-title"><Database/><div><h2>Backup e restauração</h2><p>Proteja os dados da clínica e restaure uma cópia quando necessário.</p></div></div>
        <div className="backup-overview-grid">
          <article><Download/><div><span>Último backup</span><strong>{backupLoading ? 'Carregando...' : formatDate(backupInfo?.lastBackup?.createdAt)}</strong><small>{backupInfo?.lastBackup?.fileName ?? 'Nenhum arquivo exportado'}</small></div></article>
          <article><RotateCcw/><div><span>Última restauração</span><strong>{backupLoading ? 'Carregando...' : formatDate(backupInfo?.lastRestore?.createdAt)}</strong><small>{backupInfo?.lastRestore?.fileName ?? 'Nenhuma restauração realizada'}</small></div></article>
          <article><FileJson/><div><span>Formato atual</span><strong>PetLife v{backupInfo?.version ?? '2.2.0'}</strong><small>Arquivo JSON com relacionamentos preservados</small></div></article>
        </div>
        <div className="backup-actions">
          <button type="button" className="primary-button button-with-icon" onClick={() => void exportBackup()} disabled={exporting || restoring}><Download size={18}/>{exporting ? 'Criando backup...' : 'Criar e baixar backup'}</button>
          <label className="secondary-button button-with-icon backup-upload"><Upload size={18}/>Selecionar backup<input type="file" accept="application/json,.json" onChange={(event) => void selectBackupFile(event)} disabled={exporting || restoring}/></label>
        </div>
        <div className="backup-warning"><AlertTriangle size={20}/><div><strong>Antes de restaurar</strong><p>A restauração substituirá os dados atuais. Crie um backup recente antes de continuar.</p></div></div>

        {backupInfo?.history?.length ? (
          <div className="backup-history">
            <div className="backup-history-title"><History size={18}/><h3>Atividades recentes</h3></div>
            {backupInfo.history.slice(0, 5).map((item) => (
              <article key={item.id}><span className={item.action === 'EXPORT' ? 'backup-action-export' : 'backup-action-import'}>{item.action === 'EXPORT' ? 'Backup' : 'Restauração'}</span><div><strong>{item.fileName}</strong><small>{formatDate(item.createdAt)}</small></div><b>{Object.values(item.counts).reduce((total, value) => total + value, 0)} registros</b></article>
            ))}
          </div>
        ) : null}
      </section>

      <div className="settings-sticky-save"><button className="primary-button button-with-icon" disabled={saving}><Save size={18}/>{saving ? 'Salvando...' : 'Salvar configurações'}</button></div>

      {backupPreview && (
        <Modal title="Restaurar backup?" subtitle={backupPreview.fileName} onClose={() => { if (!restoring) setBackupPreview(null); }} wide>
          <div className="restore-alert"><AlertTriangle size={27}/><div><strong>Esta ação substituirá todos os dados atuais.</strong><p>Os registros abaixo serão restaurados. Dados criados depois deste backup serão removidos.</p></div></div>
          <div className="backup-preview-meta"><span>Versão <strong>{backupPreview.payload.metadata.version}</strong></span><span>Criado em <strong>{formatDate(backupPreview.payload.metadata.createdAt)}</strong></span></div>
          <div className="backup-count-grid">
            {Object.entries(backupPreview.payload.metadata.counts).map(([key, value]) => <article key={key}><span>{countLabels[key] ?? key}</span><strong>{value}</strong></article>)}
          </div>
          <label className="restore-confirm-check"><input type="checkbox" checked={restoreConfirmed} onChange={(event) => setRestoreConfirmed(event.target.checked)}/><span>Entendo que os dados atuais serão substituídos por este backup.</span></label>
          <div className="form-footer">
            <button type="button" className="secondary-button" onClick={() => setBackupPreview(null)} disabled={restoring}>Cancelar</button>
            <button type="button" className="danger-button button-with-icon" onClick={() => void restoreBackup()} disabled={!restoreConfirmed || restoring}><RotateCcw size={18}/>{restoring ? 'Restaurando...' : 'Confirmar restauração'}</button>
          </div>
        </Modal>
      )}
    </form>
  );
}
