import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';

export type ClinicSettings = {
  id: string;
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  logoDataUrl?: string | null;
  openingHours?: string | null;
  sectors: string[];
  priorities: string[];
  species: string[];
  medicationRoutes: string[];
  theme: 'light' | 'dark' | 'system';
  tagline: string;
};

type ClinicSettingsContextValue = {
  settings: ClinicSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (input: Omit<ClinicSettings, 'id'>) => Promise<ClinicSettings>;
};

const ClinicSettingsContext = createContext<ClinicSettingsContextValue | null>(null);

function applyTheme(theme: ClinicSettings['theme']) {
  const resolved = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : theme;
  document.documentElement.dataset.theme = resolved;
  localStorage.setItem('petlife_theme', theme);
}

export function ClinicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<ClinicSettings>('/settings');
      setSettings(response.data);
      applyTheme(response.data.theme);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const listener = () => {
      if (settings?.theme === 'system') applyTheme('system');
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [settings?.theme]);

  async function save(input: Omit<ClinicSettings, 'id'>) {
    const response = await api.put<ClinicSettings>('/settings', input);
    setSettings(response.data);
    applyTheme(response.data.theme);
    return response.data;
  }

  const value = useMemo(() => ({ settings, loading, refresh, save }), [settings, loading, refresh]);
  return <ClinicSettingsContext.Provider value={value}>{children}</ClinicSettingsContext.Provider>;
}

export function useClinicSettings() {
  const context = useContext(ClinicSettingsContext);
  if (!context) throw new Error('useClinicSettings deve ser usado dentro de ClinicSettingsProvider.');
  return context;
}
