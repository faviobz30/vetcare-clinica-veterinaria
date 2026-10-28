import {adminMatches} from '../lib/admin'
import {useCitaToast} from '../lib/useCitaToast'
import CitaToast from '../components/CitaToast'
import PrettySelect from '../components/PrettySelect'
import './UnifiedHeadings.css'
import './Admin.css'
import { useEffect, useState } from 'react'
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { api, errorText } from '../lib/api'
import EditorForm from '../components/EditorForm'
import { listOf } from '../lib/display'

const roles = [
  {value:1,label:'ADMIN'},
  {value:2,label:'PROPIETARIO'},
  {value:3,label:'VETERINARIO'},
]

export default function Usuarios() {
  const [query,setQuery]=useState(''),[role,setRole]=useState(''),[message,setMessage]=useCitaToast()
  const [items,setItems] = useState([])
  const [error,setError] = useState('')
  const [form,setForm] = useState(null)
  function load(){return api.get('/usuarios').then(({data})=>{setError('');setItems(listOf(data))}).catch(e=>setError(errorText(e)))}
  useEffect(()=>{load()},[])
  const createFields = [
    {key:'nombres',label:'Nombres',maxLength:100},{key:'apellidos',label:'Apellidos',maxLength:100},
    {key:'tipoDocumento',label:'Tipo documento',options:[{value:'DNI',label:'DNI'},{value:'CE',label:'CE'},{value:'PASAPORTE',label:'Pasaporte'},...(form?.item?.tipoDocumento&&!['DNI','CE','PASAPORTE'].includes(form.item.tipoDocumento)?[{value:form.item.tipoDocumento,label:form.item.tipoDocumento}]:[])]},
    {key:'nroDocumento',label:'N° documento',maxLength:20},{key:'correo',label:'Correo',type:'email',wide:true},
    {key:'contrasena',label:'Contraseña',type:'password',wide:true},{key:'nroCelular',label:'Celular',required:false,maxLength:20},
    {key:'idRol',label:'Rol',options:roles},
  ]
  const editFields = createFields.filter(f=>f.key!=='contrasena' && f.key!=='idRol')
  async function remove(item) {
    if (!window.confirm(`¿Eliminar al usuario ${item.correo}?`)) return
    try { await api.delete(`/usuarios/${item.idUsuario}`); setMessage('Usuario eliminado.'); await load() }
    catch (e) { setError(errorText(e)) }
  }
  const visible=items.filter(u=>adminMatches(query,u.nombres,u.apellidos,u.correo,u.nroDocumento)&&(!role||String(u.idRol)===role))
  return <section>
    <div className="vetcare-section-header">
      <div><h1 className="text-3xl font-black">Usuarios</h1><p className="text-vetcare-text-muted mt-1">Consulta y administración de cuentas registradas.</p></div>
      <div className="flex gap-2"><button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Actualizar</button><button className="btn btn-primary" onClick={()=>setForm({type:'create'})}><Plus size={17}/> Nuevo usuario</button></div>
    </div>
    <CitaToast message={message} onClose={()=>setMessage('')}/><div className="admin-filters"><input className="input" aria-label="Buscar usuarios" placeholder="Buscar nombre, correo o documento" value={query} onChange={e=>setQuery(e.target.value)}/><PrettySelect label="Filtrar rol" value={role} onChange={setRole} placeholder="Todos los roles" options={roles}/></div>
    {error && <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 mb-4 flex gap-2"><AlertCircle size={18}/>{error}</div>}
    <div className="overflow-x-auto bg-white border border-vetcare-soft rounded-2xl"><table className="w-full text-sm">
      <thead className="bg-[#f2eefc]"><tr>{['ID','Nombre','Correo','Documento','Rol','Acciones'].map(h=><th key={h} className="px-4 py-4 text-left">{h}</th>)}</tr></thead>
      <tbody>{visible.map(u=><tr key={u.idUsuario} className="border-t border-vetcare-soft-2">
        <td className="p-4">#{u.idUsuario}</td>
        <td className="p-4 font-semibold">{u.nombres} {u.apellidos}</td>
        <td className="p-4">{u.correo}</td>
        <td className="p-4">{u.tipoDocumento} {u.nroDocumento}</td>
        <td className="p-4">{u.rol || u.idRol}</td>
        <td className="p-4"><div className="flex gap-2"><button className="btn btn-ghost text-xs" onClick={()=>setForm({type:'edit',item:u})}><Pencil size={14}/> Editar</button><button className="btn btn-ghost text-xs" onClick={()=>remove(u)}><Trash2 size={14}/> Eliminar</button></div></td>
      </tr>)}{!visible.length && <tr><td colSpan={6} className="text-center p-10 text-vetcare-text-muted">Sin usuarios</td></tr>}</tbody>
    </table></div>
    {form && <EditorForm title={form.type==='create'?'Crear usuario':'Editar usuario'} endpoint={form.type==='create'?'/usuarios':`/usuarios/${form.item.idUsuario}`} method={form.type==='create'?'post':'put'} fields={form.type==='create'?createFields:editFields} initial={form.item||{tipoDocumento:'DNI',idRol:2}} onClose={()=>setForm(null)} onDone={()=>{setForm(null);setMessage('Usuario guardado correctamente.');load()}}/>}
  </section>
}
