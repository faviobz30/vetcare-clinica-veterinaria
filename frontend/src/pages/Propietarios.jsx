import {Link} from 'react-router-dom'
import {adminMatches} from '../lib/admin'
import AdminDetail from '../components/AdminDetail'
import {useCitaToast} from '../lib/useCitaToast'
import './UnifiedHeadings.css'
import './Admin.css'
import './Perfil.css'
import { useEffect, useState } from 'react'
import { AlertCircle, Bell, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { api, errorText } from '../lib/api'
import EditorForm from '../components/EditorForm'
import { fullName, listOf } from '../lib/display'

export default function Propietarios() {
  const [items,setItems] = useState([])
  const [users,setUsers] = useState([])
  const [error,setError] = useState('')
  const [notice,setNotice] = useCitaToast()
  const [pets,setPets]=useState([]),[query,setQuery]=useState(''),[detail,setDetail]=useState(null)
  const [form,setForm] = useState(null)
  function load(){return Promise.all([api.get('/propietarios'),api.get('/usuarios'),api.get('/mascotas')]).then(([{data:p},{data:u},{data:m}])=>{setError('');setItems(listOf(p));setUsers(listOf(u));setPets(listOf(m))}).catch(e=>setError(errorText(e)))}
  useEffect(()=>{load()},[])
  const fields = [
    {key:'idUsuario',label:'Usuario',options:users.map(u=>({value:u.idUsuario,label:`${u.nombres} ${u.apellidos} · ${u.correo}`}))},
    {key:'direccion',label:'Dirección',required:false,wide:true,maxLength:200},
  ]
  async function remove(item) {
    if (!window.confirm(`¿Eliminar al propietario #${item.idPropietario}?`)) return
    try { await api.delete(`/propietarios/${item.idPropietario}`); await load() }
    catch (e) { setError(errorText(e)) }
  }
  async function generar() {
    setError(''); setNotice('')
    try { const {data} = await api.post('/recordatorios/generar'); setNotice(`Recordatorios creados: ${data?.creados ?? 0}`) }
    catch (e) { setError(errorText(e)) }
  }
  const visible=items.filter(p=>{const u=users.find(u=>u.idUsuario===p.idUsuario);return adminMatches(query,fullName(p),u?.correo,u?.nroDocumento,u?.nroCelular)})
  return <section>
    <div className="vetcare-section-header">
      <div><h1>Propietarios</h1><p className="text-vetcare-text-muted mt-1">Propietarios vinculados a un usuario.</p></div>
      <div className="flex gap-2 flex-wrap">
        <button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Actualizar</button>
        <button className="btn btn-ghost" onClick={generar}><Bell size={17}/> Generar recordatorios</button>
        <button className="btn btn-primary" onClick={()=>setForm({type:'create'})}><Plus size={17}/> Nuevo propietario</button>
      </div>
    </div>
    <div className="admin-filters"><input className="input" aria-label="Buscar propietarios" placeholder="Buscar nombre, documento, correo o celular" value={query} onChange={e=>setQuery(e.target.value)}/></div>
    {error && <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 mb-4 flex gap-2"><AlertCircle size={18}/>{error}</div>}
    {notice && <p role="status" className="p-3 rounded-xl bg-emerald-50 text-emerald-800 mb-4">{notice}</p>}
    <div className="overflow-x-auto bg-white border border-vetcare-soft rounded-2xl"><table className="w-full text-sm">
      <thead className="bg-[#f2eefc]"><tr>{['ID','Nombre','Usuario','Dirección','Estado','Registro','Acciones'].map(h=><th key={h} className="px-4 py-4 text-left">{h}</th>)}</tr></thead>
      <tbody>{visible.map(p=><tr key={p.idPropietario} className="border-t border-vetcare-soft-2">
        <td className="p-4">#{p.idPropietario}</td>
        <td className="p-4 font-semibold">{fullName(p) || '—'}</td>
        <td className="p-4">{users.find(u=>u.idUsuario===p.idUsuario)?.correo||'No disponible'}</td>
        <td className="p-4">{p.direccion || '—'}</td>
        <td className="p-4">{p.estadoCliente}</td>
        <td className="p-4">{p.fechaRegistroClinica}</td>
        <td className="p-4"><div className="flex gap-2"><button className="btn btn-ghost text-xs" onClick={()=>setDetail(p)}>Ver propietario</button><button className="btn btn-ghost text-xs" onClick={()=>setForm({type:'edit',item:p})}><Pencil size={14}/> Editar</button><button className="btn btn-ghost text-xs" onClick={()=>remove(p)}><Trash2 size={14}/> Eliminar</button></div></td>
      </tr>)}{!visible.length && <tr><td colSpan={7} className="text-center p-10 text-vetcare-text-muted">Sin propietarios</td></tr>}</tbody>
    </table></div>
    {detail&&<AdminDetail title={fullName(detail)} onClose={()=>setDetail(null)}><dl className="grid sm:grid-cols-2 gap-3">{Object.entries({Documento:[users.find(u=>u.idUsuario===detail.idUsuario)?.tipoDocumento,users.find(u=>u.idUsuario===detail.idUsuario)?.nroDocumento].filter(Boolean).join(' '),Correo:users.find(u=>u.idUsuario===detail.idUsuario)?.correo,Celular:users.find(u=>u.idUsuario===detail.idUsuario)?.nroCelular,Dirección:detail.direccion}).map(([k,v])=><div key={k}><dt>{k}</dt><dd className="font-semibold">{v||'No registrado'}</dd></div>)}</dl><h3 className="font-bold mt-4">Mascotas vinculadas</h3>{pets.filter(p=>p.idPropietario===detail.idPropietario).map(p=><Link key={p.idMascota} className="admin-activity" to={`/panel/historias?paciente=${p.idMascota}`}>{p.nombre} · {p.especie} → Historial clínico</Link>)}{!pets.some(p=>p.idPropietario===detail.idPropietario)&&<p>Sin mascotas registradas.</p>}</AdminDetail>}
    {form && <EditorForm title={form.type==='create'?'Vincular propietario':'Actualizar propietario'} endpoint={form.type==='create'?'/propietarios':`/propietarios/${form.item.idPropietario}`} method={form.type==='create'?'post':'put'} fields={form.type==='edit'?fields.filter(f=>f.key!=='idUsuario'):fields} onSave={form.type==='edit'?p=>api.put(`/propietarios/${form.item.idPropietario}`,{...p,idUsuario:form.item.idUsuario}):undefined} initial={form.item||{}} onClose={()=>setForm(null)} onDone={()=>{setForm(null);setNotice('Propietario guardado correctamente.');load()}}/>}
  </section>
}
