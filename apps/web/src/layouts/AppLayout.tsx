import {
  BarChart3,
  BedDouble,
  ClipboardList,
  LayoutDashboard,
  Menu,
  PawPrint,
  Pill,
  Settings,
  Stethoscope,
  Users,
  X
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';

export function AppLayout() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/internacoes', label: 'Internações', icon: BedDouble },
    { to: '/leitos', label: 'Leitos', icon: BedDouble },
    { to: '/procedimentos', label: 'Procedimentos', icon: ClipboardList },
    { to: '/medicacoes', label: 'Medicações', icon: Pill },
    { to: '/animais', label: 'Animais', icon: PawPrint },
    { to: '/tutores', label: 'Tutores', icon: Users },
    { to: '/profissionais', label: 'Profissionais', icon: Stethoscope },
    { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { to: '/configuracoes', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="app-shell">
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand-row">
          <BrandLogo light />

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>

        <nav>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="clinic-card">
          <div className="clinic-card-icon">
            <Stethoscope size={20} />
          </div>

          <div>
            <strong>PetLife São Caetano</strong>
            <span>Clínica Veterinária 24h</span>
          </div>

          <small>Fase 4 • v1.3.0</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setOpen((current) => !current)}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>

          <div className="topbar-title">
            <strong>PetLife</strong>
            <span>Gestão veterinária</span>
          </div>

          <div className="user-chip">
            <span className="user-avatar">P</span>

            <div>
              <strong>PetLife São Caetano</strong>
              <span>Sistema interno</span>
            </div>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>

        <footer className="app-footer">
          PetLife São Caetano • Cuidando com amor, tratando com excelência.
        </footer>
      </main>
    </div>
  );
}