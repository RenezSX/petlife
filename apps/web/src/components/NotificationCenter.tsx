import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BedDouble,
  CheckCircle2,
  Clock3,
  Pill,
  Stethoscope,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type NotificationLevel = 'danger' | 'warning' | 'info' | 'success';
type NotificationCategory = 'medication' | 'procedure' | 'hospitalization' | 'bed';

type NotificationItem = {
  id: string;
  level: NotificationLevel;
  category: NotificationCategory;
  title: string;
  description: string;
  occurredAt: string;
  href: string;
};

type NotificationResponse = {
  items: NotificationItem[];
  summary: {
    total: number;
    urgent: number;
    warning: number;
    info: number;
  };
  generatedAt: string;
};

const levelIcons = {
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Clock3,
  success: CheckCircle2,
};

const categoryIcons = {
  medication: Pill,
  procedure: Stethoscope,
  hospitalization: AlertCircle,
  bed: BedDouble,
};

function formatRelativeTime(value: string) {
  const difference = new Date(value).getTime() - Date.now();
  const absoluteMinutes = Math.round(Math.abs(difference) / 60_000);

  if (absoluteMinutes < 1) return 'agora';
  if (absoluteMinutes < 60) {
    return difference < 0 ? `há ${absoluteMinutes} min` : `em ${absoluteMinutes} min`;
  }

  const hours = Math.round(absoluteMinutes / 60);
  if (hours < 24) return difference < 0 ? `há ${hours}h` : `em ${hours}h`;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('petlife_dismissed_notifications') ?? '[]');
    } catch {
      return [];
    }
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<NotificationResponse>('/notifications');
      setData(response.data);
    } catch (loadError) {
      console.error('Erro ao carregar notificações:', loadError);
      setError('Não foi possível carregar os alertas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const visibleItems = useMemo(
    () => (data?.items ?? []).filter((item) => !dismissed.includes(item.id)),
    [data, dismissed],
  );

  const urgentCount = visibleItems.filter((item) => item.level === 'danger').length;
  const unreadCount = visibleItems.length;

  function dismiss(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('petlife_dismissed_notifications', JSON.stringify(next));
  }

  function clearDismissed() {
    setDismissed([]);
    localStorage.removeItem('petlife_dismissed_notifications');
  }

  function openNotification(item: NotificationItem) {
    setOpen(false);
    navigate(item.href);
  }

  return (
    <div className="notification-center" ref={rootRef}>
      <button
        type="button"
        className={`notification-trigger ${urgentCount > 0 ? 'has-urgent' : ''}`}
        aria-label="Abrir central de notificações"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          if (!open) void load();
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <section className="notification-popover" aria-label="Central de notificações">
          <header className="notification-header">
            <div>
              <span className="notification-eyebrow">CENTRAL DE ALERTAS</span>
              <h2>Notificações</h2>
            </div>
            <button type="button" className="notification-close" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="notification-summary">
            <span><strong>{visibleItems.length}</strong> alertas</span>
            <span className="summary-danger"><strong>{urgentCount}</strong> urgentes</span>
            {dismissed.length > 0 && (
              <button type="button" onClick={clearDismissed}>Restaurar ocultos</button>
            )}
          </div>

          <div className="notification-list">
            {loading && !data ? (
              <div className="notification-empty"><Bell /><p>Carregando alertas...</p></div>
            ) : error ? (
              <div className="notification-empty error"><AlertTriangle /><p>{error}</p><button type="button" onClick={() => void load()}>Tentar novamente</button></div>
            ) : visibleItems.length === 0 ? (
              <div className="notification-empty"><CheckCircle2 /><h3>Tudo sob controle</h3><p>Nenhum alerta ativo neste momento.</p></div>
            ) : (
              visibleItems.map((item) => {
                const LevelIcon = levelIcons[item.level];
                const CategoryIcon = categoryIcons[item.category];
                return (
                  <article className={`notification-item notification-${item.level}`} key={item.id}>
                    <button type="button" className="notification-main" onClick={() => openNotification(item)}>
                      <span className="notification-level-icon"><LevelIcon size={17} /></span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <small><CategoryIcon size={13} /> {formatRelativeTime(item.occurredAt)}</small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="notification-dismiss"
                      aria-label={`Ocultar ${item.title}`}
                      title="Ocultar este alerta"
                      onClick={() => dismiss(item.id)}
                    >
                      <X size={15} />
                    </button>
                  </article>
                );
              })
            )}
          </div>

          <footer className="notification-footer">
            <button type="button" onClick={() => void load()} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar alertas'}
            </button>
            <span>Atualização automática a cada minuto</span>
          </footer>
        </section>
      )}
    </div>
  );
}
