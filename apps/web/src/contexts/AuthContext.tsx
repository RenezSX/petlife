import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { User } from '../types';

type AuthContextValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<{ user: User }>('/auth/me').then(({ data }) => setUser(data.user)).catch(() => localStorage.removeItem('petlife_token')).finally(() => setLoading(false));
  }, []);
  async function login(email: string, password: string) {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('petlife_token', data.token); setUser(data.user);
  }
  function logout() { localStorage.removeItem('petlife_token'); setUser(null); }
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return ctx; }
