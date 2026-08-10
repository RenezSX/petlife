import { AlertTriangle, ArchiveRestore, ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarClock, Edit3, History, PackagePlus, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useCallback,useEffect,useMemo,useState,type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { api } from '../services/api';
import type { InventoryItem,InventoryMovement,InventoryStats } from '../types';

const categoryLabels:Record<string,string>={MEDICATION:'Medicamento',SUPPLY:'Insumo',FOOD:'Alimentação',HYGIENE:'Higiene',OTHER:'Outro'};
const movementLabels:Record<string,string>={IN:'Entrada',OUT:'Saída',ADJUSTMENT:'Ajuste'};
const empty={name:'',category:'MEDICATION',unit:'un',currentQuantity:0,minimumQuantity:0,batch:'',expiryDate:'',supplier:'',location:'',notes:''};
const moveEmpty={type:'IN',quantity:1,reason:'',responsible:'',notes:''};

function msg(error:unknown){const item=error as {response?:{data?:{message?:string}}};return item.response?.data?.message??'Não foi possível concluir a operação.'}
function localDate(value:string|null){return value?new Date(value).toLocaleDateString('pt-BR'):'—'}
function isExpired(value:string|null){return Boolean(value&&new Date(value)<new Date())}
function isExpiring(value:string|null){if(!value)return false;const date=new Date(value);const now=new Date();return date>=now&&date<=new Date(now.getTime()+30*86400000)}

export function InventoryPage(){
  const[items,setItems]=useState<InventoryItem[]>([]);
  const[stats,setStats]=useState<InventoryStats|null>(null);
  const[search,setSearch]=useState('');
  const[category,setCategory]=useState('all');
  const[status,setStatus]=useState('active');
  const[stock,setStock]=useState('all');
  const[editing,setEditing]=useState<InventoryItem|null|undefined>(undefined);
  const[moving,setMoving]=useState<InventoryItem|null>(null);
  const[historyItem,setHistoryItem]=useState<InventoryItem|null>(null);
  const[history,setHistory]=useState<InventoryMovement[]>([]);
  const[form,setForm]=useState(empty);
  const[moveForm,setMoveForm]=useState(moveEmpty);
  const[error,setError]=useState('');
  const[loading,setLoading]=useState(false);

  const load=useCallback(async()=>{
    try{
      setLoading(true);setError('');
      const[a,b]=await Promise.all([
        api.get<InventoryItem[]>('/inventory',{params:{search,category,status,stock}}),
        api.get<InventoryStats>('/inventory/stats'),
      ]);
      setItems(a.data);setStats(b.data);
    }catch(e){setError(msg(e))}
    finally{setLoading(false)}
  },[search,category,status,stock]);

  useEffect(()=>{const timer=setTimeout(()=>void load(),180);return()=>clearTimeout(timer)},[load]);

  function open(item?:InventoryItem){
    setEditing(item??null);setError('');
    setForm(item?{
      name:item.name,category:item.category,unit:item.unit,currentQuantity:item.currentQuantity,
      minimumQuantity:item.minimumQuantity,batch:item.batch??'',expiryDate:item.expiryDate?.slice(0,10)??'',
      supplier:item.supplier??'',location:item.location??'',notes:item.notes??''
    }:{...empty});
  }

  async function submit(event:FormEvent){
    event.preventDefault();
    try{
      setLoading(true);setError('');
      editing?await api.put(`/inventory/${editing.id}`,form):await api.post('/inventory',form);
      setEditing(undefined);await load();
    }catch(e){setError(msg(e))}
    finally{setLoading(false)}
  }

  function openMovement(item:InventoryItem,type:'IN'|'OUT'|'ADJUSTMENT'='IN'){
    setMoving(item);setMoveForm({...moveEmpty,type});setError('');
  }

  async function submitMovement(event:FormEvent){
    event.preventDefault();if(!moving)return;
    try{
      setLoading(true);setError('');
      await api.post(`/inventory/${moving.id}/movements`,{...moveForm,quantity:Number(moveForm.quantity)});
      setMoving(null);await load();
    }catch(e){setError(msg(e))}
    finally{setLoading(false)}
  }

  async function toggle(item:InventoryItem){
    if(!confirm(`${item.active?'Inativar':'Reativar'} ${item.name}?`))return;
    try{await api.patch(`/inventory/${item.id}/${item.active?'deactivate':'reactivate'}`);await load()}
    catch(e){setError(msg(e))}
  }

  async function openHistory(item:InventoryItem){
    try{setHistoryItem(item);setError('');const response=await api.get<InventoryMovement[]>(`/inventory/${item.id}/movements`);setHistory(response.data)}
    catch(e){setError(msg(e))}
  }

  const alerts=useMemo(()=>items.filter(item=>item.currentQuantity<=item.minimumQuantity||isExpired(item.expiryDate)||isExpiring(item.expiryDate)),[items]);

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">FARMÁCIA E SUPRIMENTOS</p><h1>Estoque</h1><p className="muted">Controle medicamentos, insumos, validade e movimentações da clínica.</p></div>
      <button className="primary-button button-with-icon" onClick={()=>open()}><Plus/>Novo item</button>
    </div>

    {stats&&<div className="mini-metrics">
      <article><Boxes/><div><strong>{stats.total}</strong><span>Itens ativos</span></div></article>
      <article><AlertTriangle/><div><strong>{stats.low}</strong><span>Estoque baixo</span></div></article>
      <article><Trash2/><div><strong>{stats.zero}</strong><span>Sem estoque</span></div></article>
      <article><CalendarClock/><div><strong>{stats.expiring+stats.expired}</strong><span>Validade em atenção</span></div></article>
    </div>}

    {alerts.length>0&&<div className="inventory-alert-strip"><AlertTriangle/><div><strong>Atenção ao estoque</strong><span>{alerts.length} item(ns) precisam de reposição ou conferência de validade.</span></div><button className="secondary-button" onClick={()=>setStock('low')}>Ver alertas</button></div>}

    <section className="panel">
      <div className="toolbar toolbar-wrap">
        <div className="search-box"><Search/><input placeholder="Buscar item, lote, fornecedor ou local" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Todas as categorias</option>{Object.entries(categoryLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
        <select value={stock} onChange={e=>setStock(e.target.value)}><option value="all">Todo estoque</option><option value="low">Estoque baixo</option><option value="zero">Sem estoque</option><option value="expiring">Vence em até 30 dias</option><option value="expired">Vencidos</option></select>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Ativos</option><option value="inactive">Inativos</option><option value="all">Todos</option></select>
      </div>
      {error&&editing===undefined&&!moving&&!historyItem&&<div className="form-error">{error}</div>}
      {loading&&!items.length?<div className="empty-state">Carregando estoque...</div>:items.length===0?<div className="empty-state"><Boxes size={42}/><h3>Nenhum item encontrado</h3><p>Cadastre um item ou altere os filtros.</p></div>:
      <div className="inventory-grid">{items.map(item=>{
        const low=item.currentQuantity<=item.minimumQuantity;
        const expired=isExpired(item.expiryDate);
        const expiring=isExpiring(item.expiryDate);
        return <article className={`inventory-card ${low?'inventory-low':''} ${expired?'inventory-expired':''}`} key={item.id}>
          <header><div className="inventory-icon"><Boxes/></div><div><h3>{item.name}</h3><p>{categoryLabels[item.category]}{item.batch?` • Lote ${item.batch}`:''}</p></div><span className={`status ${item.active?'active-status':'inactive-status'}`}>{item.active?'Ativo':'Inativo'}</span></header>
          <div className="inventory-quantity"><strong>{item.currentQuantity}</strong><span>{item.unit}</span><small>Mínimo: {item.minimumQuantity} {item.unit}</small></div>
          <dl><div><dt>Validade</dt><dd className={expired?'text-danger':expiring?'text-warning':''}>{localDate(item.expiryDate)}{expired?' • vencido':expiring?' • próximo':''}</dd></div><div><dt>Fornecedor</dt><dd>{item.supplier||'—'}</dd></div><div><dt>Local</dt><dd>{item.location||'—'}</dd></div></dl>
          {low&&<div className="stock-warning"><AlertTriangle/>Estoque no mínimo ou abaixo</div>}
          <footer>
            <button className="icon-button" title="Editar" onClick={()=>open(item)}><Edit3/></button>
            <button className="secondary-button button-with-icon" onClick={()=>openMovement(item,'IN')}><ArrowDownToLine/>Entrada</button>
            <button className="secondary-button button-with-icon" disabled={item.currentQuantity<=0} onClick={()=>openMovement(item,'OUT')}><ArrowUpFromLine/>Saída</button>
            <button className="icon-button" title="Histórico" onClick={()=>void openHistory(item)}><History/></button>
            <button className="ghost-button" onClick={()=>void toggle(item)}>{item.active?'Inativar':'Reativar'}</button>
          </footer>
        </article>
      })}</div>}
    </section>

    {editing!==undefined&&<Modal title={editing?'Editar item':'Novo item de estoque'} subtitle="Cadastre medicamentos, materiais e suprimentos." onClose={()=>setEditing(undefined)} wide>
      <form className="entity-form" onSubmit={submit}><div className="form-grid three-cols">
        <label>Nome *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Categoria *<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{Object.entries(categoryLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        <label>Unidade *<input required placeholder="un, ml, mg, caixa..." value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></label>
        <label>Quantidade atual<input type="number" min="0" step="0.01" value={form.currentQuantity} onChange={e=>setForm({...form,currentQuantity:Number(e.target.value)})}/></label>
        <label>Estoque mínimo<input type="number" min="0" step="0.01" value={form.minimumQuantity} onChange={e=>setForm({...form,minimumQuantity:Number(e.target.value)})}/></label>
        <label>Lote<input value={form.batch} onChange={e=>setForm({...form,batch:e.target.value})}/></label>
        <label>Validade<input type="date" value={form.expiryDate} onChange={e=>setForm({...form,expiryDate:e.target.value})}/></label>
        <label>Fornecedor<input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></label>
        <label>Localização<input placeholder="Ex.: Armário A2" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
        <label className="full">Observações<textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      </div>{error&&<div className="form-error">{error}</div>}<div className="form-footer"><button type="button" className="secondary-button" onClick={()=>setEditing(undefined)}>Cancelar</button><button className="primary-button" disabled={loading}>{loading?'Salvando...':'Salvar item'}</button></div></form>
    </Modal>}

    {moving&&<Modal title="Movimentar estoque" subtitle={`${moving.name} • saldo atual ${moving.currentQuantity} ${moving.unit}`} onClose={()=>setMoving(null)}>
      <form className="entity-form" onSubmit={submitMovement}><div className="form-grid">
        <label>Tipo *<select value={moveForm.type} onChange={e=>setMoveForm({...moveForm,type:e.target.value})}><option value="IN">Entrada</option><option value="OUT">Saída</option><option value="ADJUSTMENT">Ajustar saldo para</option></select></label>
        <label>{moveForm.type==='ADJUSTMENT'?'Novo saldo':'Quantidade'} *<input required type="number" min="0.01" step="0.01" value={moveForm.quantity} onChange={e=>setMoveForm({...moveForm,quantity:Number(e.target.value)})}/></label>
        <label className="full">Motivo *<input required placeholder="Ex.: Compra, uso clínico, perda..." value={moveForm.reason} onChange={e=>setMoveForm({...moveForm,reason:e.target.value})}/></label>
        <label className="full">Responsável<input value={moveForm.responsible} onChange={e=>setMoveForm({...moveForm,responsible:e.target.value})}/></label>
        <label className="full">Observações<textarea rows={3} value={moveForm.notes} onChange={e=>setMoveForm({...moveForm,notes:e.target.value})}/></label>
      </div>{error&&<div className="form-error">{error}</div>}<div className="form-footer"><button type="button" className="secondary-button" onClick={()=>setMoving(null)}>Cancelar</button><button className="primary-button" disabled={loading}>Confirmar movimentação</button></div></form>
    </Modal>}

    {historyItem&&<Modal title="Histórico de movimentações" subtitle={historyItem.name} onClose={()=>{setHistoryItem(null);setHistory([])}} wide>
      <div className="inventory-history">{history.length===0?<div className="empty-state"><History size={38}/><h3>Sem movimentações</h3></div>:history.map(move=><article key={move.id}>
        <div className={`movement-icon movement-${move.type.toLowerCase()}`}>{move.type==='IN'?<ArrowDownToLine/>:move.type==='OUT'?<ArrowUpFromLine/>:<SlidersHorizontal/>}</div>
        <div><strong>{movementLabels[move.type]} • {move.quantity} {historyItem.unit}</strong><p>{move.reason}</p><small>{new Date(move.createdAt).toLocaleString('pt-BR')} • {move.responsible||'Responsável não informado'}</small>{move.notes&&<span>{move.notes}</span>}</div>
        <div className="movement-balance">{move.beforeQty} → <strong>{move.afterQty}</strong></div>
      </article>)}</div>
    </Modal>}
  </>;
}
