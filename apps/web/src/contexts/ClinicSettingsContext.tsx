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
  resolvedTheme: 'light' | 'dark';
  refresh: () => Promise<void>;
  save: (input: Omit<ClinicSettings, 'id'>) => Promise<ClinicSettings>;
  setTheme: (theme: ClinicSettings['theme']) => Promise<void>;
};

const ClinicSettingsContext = createContext<ClinicSettingsContextValue | null>(null);

function resolveTheme(theme: ClinicSettings['theme']): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ClinicSettings['theme']) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  localStorage.setItem('petlife_theme', theme);
  return resolved;
}

export function ClinicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('petlife_theme');
    const theme = saved === 'dark' || saved === 'system' ? saved : 'light';
    return applyTheme(theme);
  });

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<ClinicSettings>('/settings');
      setSettings(response.data);
      setResolvedTheme(applyTheme(response.data.theme));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('petlife_theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      setResolvedTheme(applyTheme(savedTheme));
    }
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const listener = () => {
      if (settings?.theme === 'system') setResolvedTheme(applyTheme('system'));
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [settings?.theme]);

  async function save(input: Omit<ClinicSettings, 'id'>) {
    const response = await api.put<ClinicSettings>('/settings', input);
    setSettings(response.data);
    setResolvedTheme(applyTheme(response.data.theme));
    return response.data;
  }

  async function setTheme(theme: ClinicSettings['theme']) {
    // Aplica e atualiza o React imediatamente. Assim o botão pode alternar
    // novamente mesmo se a API estiver lenta ou falhar ao persistir a preferência.
    const resolved = applyTheme(theme);
    setResolvedTheme(resolved);
    setSettings((current) => current ? { ...current, theme } : current);

    if (!settings) return;

    try {
      const { id: _id, ...input } = settings;
      const response = await api.put<ClinicSettings>('/settings', { ...input, theme });
      setSettings(response.data);
      setResolvedTheme(applyTheme(response.data.theme));
    } catch (error) {
      // Mantém a preferência local funcionando. A próxima alteração ou atualização
      // poderá tentar persistir novamente no backend.
      console.error('Não foi possível salvar o tema no servidor:', error);
    }
  }

  const value = useMemo(() => ({ settings, loading, resolvedTheme, refresh, save, setTheme }), [settings, loading, resolvedTheme, refresh]);
  return <ClinicSettingsContext.Provider value={value}>{children}</ClinicSettingsContext.Provider>;
}

export function useClinicSettings() {
  const context = useContext(ClinicSettingsContext);
  if (!context) throw new Error('useClinicSettings deve ser usado dentro de ClinicSettingsProvider.');
  return context;
}
