import { ClipboardPlus, HeartPulse, LockKeyhole, Mail, PawPrint, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { useClinicSettings } from '../contexts/ClinicSettingsContext';

function message(error:unknown){
  const item=error as {response?:{data?:{message?:string}}};
  return item.response?.data?.message??'Não foi possível entrar no sistema.';
}

export function LoginPage(){
  const{user,login}=useAuth();
  const{settings}=useClinicSettings();
  const navigate=useNavigate();
  const location=useLocation();
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  if(user)return <Navigate to="/dashboard" replace/>;

  async function submit(event:FormEvent){
    event.preventDefault();
    try{
      setLoading(true);setError('');
      await login(email,password);
      const from=(location.state as {from?:string}|null)?.from??'/dashboard';
      navigate(from,{replace:true});
    }catch(e){setError(message(e))}
    finally{setLoading(false)}
  }

  return <div className="login-page">
    <section className="login-showcase">
      <div className="login-showcase-content">
        <BrandLogo light name={settings?.name} logoDataUrl={settings?.logoDataUrl}/>
        <div className="showcase-badge"><ShieldCheck size={16}/>Acesso interno protegido</div>
        <h2>Gestão clínica organizada em um só lugar.</h2>
        <p>Internações, prontuários, medicações, agenda e documentos com acesso individual para cada membro da equipe.</p>
        <div className="showcase-features">
          <div><span><HeartPulse/></span><strong>Rotina clínica</strong><small>Pacientes, internações e prontuários integrados.</small></div>
          <div><span><ClipboardPlus/></span><strong>Equipe conectada</strong><small>Perfis e permissões para cada função.</small></div>
        </div>
        <PawPrint className="login-decoration" size={240}/>
      </div>
    </section>
    <section className="login-panel">
      <div className="login-card">
        <div className="login-mobile-logo"><BrandLogo name={settings?.name} logoDataUrl={settings?.logoDataUrl}/></div>
        <p className="eyebrow">BEM-VINDO</p>
        <h1>Entrar no PetLife</h1>
        <p className="muted">Use sua conta cadastrada pelo administrador.</p>
        <form onSubmit={submit}>
          <label>E-mail<div className="input-wrap"><Mail size={18}/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/></div></label>
          <label>Senha<div className="input-wrap"><LockKeyhole size={18}/><input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></div></label>
          {error&&<div className="form-error">{error}</div>}
          <button className="primary-button login-submit" disabled={loading}>{loading?'Entrando...':'Entrar no sistema'}</button>
        </form>
        {import.meta.env.DEV&&<div className="development-access"><strong>Primeiro acesso local</strong><span>Após executar o seed: admin@petlife.local • PetLife@123</span></div>}
      </div>
    </section>
  </div>
}
