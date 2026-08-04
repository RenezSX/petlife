import { HeartPulse, LockKeyhole, Mail, PawPrint } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('admin@petlife.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('Não foi possível entrar. Confira o e-mail e a senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="login-page">
    <section className="login-showcase" aria-hidden="true">
      <div className="showcase-badge"><PawPrint size={18}/> Cuidado que transforma</div>
      <h2>Gestão clínica simples, acolhedora e eficiente.</h2>
      <p>Centralize pacientes, internações e indicadores em uma experiência criada para a rotina veterinária.</p>
      <div className="showcase-orb"><HeartPulse size={56}/></div>
    </section>
    <section className="login-card">
      <div className="login-logo"><span className="logo-mark"><PawPrint/></span><span>PetLife</span></div>
      <p className="eyebrow">GESTÃO VETERINÁRIA</p>
      <h1>Bem-vindo de volta</h1>
      <p className="muted">Acesse o painel de internação da clínica.</p>
      <form onSubmit={submit}>
        <label>E-mail<div className="input-wrap"><Mail size={18}/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></div></label>
        <label>Senha<div className="input-wrap"><LockKeyhole size={18}/><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} minLength={8} required/></div></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" disabled={submitting}>{submitting ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <small>Ambiente de desenvolvimento: admin@petlife.local / Admin@123</small>
    </section>
  </main>;
}
