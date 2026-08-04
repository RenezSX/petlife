import { BedDouble, LayoutDashboard, LogOut, Menu, PawPrint, Stethoscope, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
export function AppLayout() {
  const [open, setOpen] = useState(false); const { user, logout } = useAuth();
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/internacoes', label: 'Internações', icon: BedDouble },
    { to: '/animais', label: 'Animais', icon: PawPrint },
    { to: '/tutores', label: 'Tutores', icon: Users },
    { to: '/profissionais', label: 'Profissionais', icon: Stethoscope }
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand"><span><PawPrint size={22}/></span><strong>Pet<span>Life</span></strong></div>
      <nav>{links.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><Icon size={19}/>{label}</NavLink>)}</nav>
      <button className="logout" onClick={logout}><LogOut size={18}/>Sair</button>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu"><Menu/></button><div><strong>{user?.name}</strong><span>{user?.role}</span></div></header>
      <section className="content"><Outlet/></section>
    </main>
  </div>;
}
