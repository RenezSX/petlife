import { ArchiveRestore, Edit3, Plus, Search, ShieldCheck, UserRound, UserX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

type ManagedUser=User&{active:boolean;createdAt:string;updatedAt:string};
const empty={name:'',email:'',password:'',role:'RECEPTIONIST' as User['role']};
const roleLabels:Record<User['role'],string>={ADMIN:'Administrador',VETERINARIAN:'Veterinário',ASSISTANT:'Auxiliar',RECEPTIONIST:'Recepção'};

function message(error:unknown){
  const item=error as {response?:{data?:{message?:string}}};
  return item.response?.data?.message??'Não foi possível concluir a operação.';
}

export function UsersPage(){
  const{user:currentUser}=useAuth();
  const[items,setItems]=useState<ManagedUser[]>([]);
  const[search,setSearch]=useState('');
  const[editing,setEditing]=useState<ManagedUser|null|undefined>(undefined);
  const[form,setForm]=useState(empty);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  const load=useCallback(async()=>{
    try{setLoading(true);setError('');const response=await api.get<ManagedUser[]>('/users');setItems(response.data)}
    catch(e){setError(message(e))}
    finally{setLoading(false)}
  },[]);

  useEffect(()=>{void load()},[load]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q)return items;
    return items.filter(item=>[item.name,item.email,roleLabels[item.role]].some(value=>value.toLowerCase().includes(q)));
  },[items,search]);

  function open(item?:ManagedUser){
    setEditing(item??null);
    setError('');
    setForm(item?{name:item.name,email:item.email,password:'',role:item.role}:{...empty});
  }

  async function submit(event:FormEvent){
    event.preventDefault();
    try{
      setLoading(true);setError('');
      if(editing){
        await api.put(`/users/${editing.id}`,{...form,password:form.password||''});
      }else{
        await api.post('/users',form);
      }
      setEditing(undefined);
      await load();
    }catch(e){setError(message(e))}
    finally{setLoading(false)}
  }

  async function toggle(item:ManagedUser){
    if(item.id===currentUser?.id&&item.active){setError('Você não pode inativar sua própria conta.');return}
    if(!window.confirm(`${item.active?'Inativar':'Reativar'} o acesso de ${item.name}?`))return;
    try{
      await api.patch(`/users/${item.id}/${item.active?'deactivate':'reactivate'}`);
      await load();
    }catch(e){setError(message(e))}
  }

  const active=items.filter(item=>item.active).length;
  const admins=items.filter(item=>item.active&&item.role==='ADMIN').length;

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">SEGURANÇA E ACESSO</p><h1>Usuários</h1><p className="muted">Gerencie as contas e os perfis que podem acessar o PetLife.</p></div>
      <button className="primary-button button-with-icon" onClick={()=>open()}><Plus/>Novo usuário</button>
    </div>

    <div className="mini-metrics">
      <article><UserRound/><div><strong>{items.length}</strong><span>Usuários cadastrados</span></div></article>
      <article><ShieldCheck/><div><strong>{active}</strong><span>Acessos ativos</span></div></article>
      <article><ShieldCheck/><div><strong>{admins}</strong><span>Administradores</span></div></article>
      <article><UserX/><div><strong>{items.length-active}</strong><span>Inativos</span></div></article>
    </div>

    <section className="panel">
      <div className="toolbar"><div className="search-box"><Search/><input placeholder="Buscar nome, e-mail ou perfil" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
      {error&&editing===undefined&&<div className="form-error">{error}</div>}
      {loading&&!items.length?<div className="empty-state">Carregando usuários...</div>:(
        <div className="user-access-list">
          {filtered.map(item=><article className="user-access-card" key={item.id}>
            <div className="user-access-avatar">{item.name.slice(0,1).toUpperCase()}</div>
            <div className="user-access-main">
              <div><strong>{item.name}</strong>{item.id===currentUser?.id&&<span className="status active-status">Você</span>}</div>
              <p>{item.email}</p>
              <small>{roleLabels[item.role]}</small>
            </div>
            <span className={`status ${item.active?'active-status':'inactive-status'}`}>{item.active?'Ativo':'Inativo'}</span>
            <div className="row-actions">
              <button className="icon-button" title="Editar" onClick={()=>open(item)}><Edit3/></button>
              <button className="secondary-button button-with-icon" onClick={()=>void toggle(item)}>{item.active?<UserX/>:<ArchiveRestore/>}{item.active?'Inativar':'Reativar'}</button>
            </div>
          </article>)}
          {!filtered.length&&<div className="empty-state"><UserRound size={40}/><h3>Nenhum usuário encontrado</h3></div>}
        </div>
      )}
    </section>

    {editing!==undefined&&<Modal title={editing?'Editar usuário':'Novo usuário'} subtitle="Defina os dados de acesso e o perfil de permissão." onClose={()=>setEditing(undefined)} wide>
      <form className="entity-form" onSubmit={submit}>
        <div className="form-grid">
          <label>Nome *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>E-mail *<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          <label>Perfil *<select value={form.role} onChange={e=>setForm({...form,role:e.target.value as User['role']})}>
            <option value="ADMIN">Administrador</option><option value="VETERINARIAN">Veterinário</option><option value="ASSISTANT">Auxiliar</option><option value="RECEPTIONIST">Recepção</option>
          </select></label>
          <label>{editing?'Nova senha':'Senha *'}<input required={!editing} type="password" minLength={editing?0:8} placeholder={editing?'Deixe em branco para manter a atual':'Mínimo de 8 caracteres'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
        </div>
        {error&&<div className="form-error">{error}</div>}
        <div className="permission-summary">
          <strong>Permissões do perfil</strong>
          <p>{form.role==='ADMIN'?'Acesso completo, configurações, auditoria, backup e usuários.':form.role==='VETERINARIAN'?'Acesso aos módulos clínicos, prontuários, medicações, procedimentos e documentos.':form.role==='ASSISTANT'?'Acesso à rotina clínica e registros operacionais, sem administração do sistema.':'Acesso à recepção, pacientes, tutores, internações, agenda e identificação.'}</p>
        </div>
        <div className="form-footer"><button type="button" className="secondary-button" onClick={()=>setEditing(undefined)}>Cancelar</button><button className="primary-button" disabled={loading}>{loading?'Salvando...':'Salvar usuário'}</button></div>
      </form>
    </Modal>}
  </>;
}
