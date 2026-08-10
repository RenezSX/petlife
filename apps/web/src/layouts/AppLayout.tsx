import {
  BarChart3,
  CalendarDays,
  BedDouble,
  ClipboardList,
  History,
  FileText,
  LayoutDashboard,
  Menu,
  Moon,
  PawPrint,
  QrCode,
  Pill,
  PackageOpen,
  WalletCards,
  ShieldCheck,
  Settings,
  Stethoscope,
  Sun,
  Users,
  X
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { GlobalSearch } from '../components/GlobalSearch';
import { NotificationCenter } from '../components/NotificationCenter';
import { PwaInstallButton } from '../components/PwaInstallButton';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useClinicSettings } from '../contexts/ClinicSettingsContext';

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { settings, setTheme, resolvedTheme } = useClinicSettings();
  const clinicName = settings?.name ?? 'PetLife';
  const tagline = settings?.tagline ?? 'Cuidando com amor, tratando com excelência.';
  const darkMode = resolvedTheme === 'dark';

  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    void setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/agenda', label: 'Agenda clínica', icon: CalendarDays },
    { to: '/documentos', label: 'Documentos', icon: FileText },
    { to: '/internacoes', label: 'Internações', icon: BedDouble },
    { to: '/leitos', label: 'Leitos', icon: BedDouble },
    { to: '/procedimentos', label: 'Procedimentos', icon: ClipboardList },
    { to: '/medicacoes', label: 'Medicações', icon: Pill },
    { to: '/estoque', label: 'Estoque', icon: PackageOpen },
    { to: '/preventivos', label: 'Vacinas e preventivos', icon: ShieldCheck },
    { to: '/financeiro', label: 'Financeiro', icon: WalletCards },
    { to: '/animais', label: 'Animais', icon: PawPrint },
    { to: '/identificar', label: 'Identificação', icon: QrCode },
    { to: '/tutores', label: 'Tutores', icon: Users },
    { to: '/profissionais', label: 'Profissionais', icon: Stethoscope },
    { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { to: '/auditoria', label: 'Auditoria', icon: History },
    { to: '/configuracoes', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="app-shell">
      {open && <button type="button" className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand-row">
          <BrandLogo light name={clinicName} logoDataUrl={settings?.logoDataUrl} />
          <button type="button" className="sidebar-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="clinic-card">
          <div className="clinic-card-icon"><Stethoscope size={20} /></div>
          <div><strong>{clinicName}</strong><span>{settings?.openingHours || 'Clínica Veterinária'}</span></div>
          <small>Fase 8.10 • v3.10.0</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button type="button" className="menu-button" onClick={() => setOpen((current) => !current)} aria-label="Abrir menu"><Menu /></button>
          <div className="topbar-title"><strong>{clinicName}</strong><span>Gestão veterinária</span></div>
          <GlobalSearch />
          <PwaInstallButton />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo noturno'}
            title={darkMode ? 'Modo claro' : 'Modo noturno'}
          >
            {darkMode ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <NotificationCenter />
          <div className="user-chip">
            <span className="user-avatar">{clinicName.slice(0, 1).toUpperCase()}</span>
            <div><strong>{clinicName}</strong><span>Sistema interno</span></div>
          </div>
        </header>
        <ConnectionStatus />
        <section className="content"><Outlet /></section>
        <footer className="app-footer">{clinicName} • {tagline}</footer>
      </main>
    </div>
  );
}
