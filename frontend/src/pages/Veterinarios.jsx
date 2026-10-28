import PrettySelect from '../components/PrettySelect'
import AdminPhoto from '../components/AdminPhoto'
import {adminMatches} from '../lib/admin'
import {useCitaToast} from '../lib/useCitaToast'
import CitaToast from '../components/CitaToast'
import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { api, errorText } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import EditorForm from '../components/EditorForm'
import { fullName, listOf } from '../lib/display'
import './UnifiedHeadings.css'

const docs = [{value:'DNI',label:'DNI'},{value:'CE',label:'CE'},{value:'PASAPORTE',label:'Pasaporte'}]

export default function Veterinarios() {
  const { user } = useAuth()
  const admin = user?.role === 'ADMIN'
  const [query,setQuery]=useState(''),[treatment,setTreatment]=useState(''),[message,setMessage]=useCitaToast()
  const [items,setItems] = useState([])
  const [users,setUsers] = useState([])
  const [error,setError] = useState('')
  const [form,setForm] = useState(null)
  const load=useCallback(()=>Promise.all([api.get('/veterinarios'),admin?api.get('/usuarios'):Promise.resolve({data:[]})]).then(([v,u])=>{setError('');setItems(listOf(v.data));setUsers(listOf(u.data))}).catch(e=>setError(errorText(e))),[admin])
  useEffect(()=>{load()},[load])
  const treatmentField={key:'tratamientoProfesional',label:'Tratamiento profesional',options:[{value:'ninguno',label:'Sin tratamiento'},{value:'Dr.',label:'Dr.'},{value:'Dra.',label:'Dra.'}],defaultValue:'ninguno'}
  const registroFields = [
    treatmentField,
    {key:'nombres',label:'Nombres'},{key:'apellidos',label:'Apellidos'},
    {key:'tipoDocumento',label:'Documento',options:[...docs,...(form?.item?.tipoDocumento&&!docs.some(d=>d.value===form.item.tipoDocumento)?[{value:form.item.tipoDocumento,label:form.item.tipoDocumento}]:[])]},{key:'nroDocumento',label:'N° documento'},
    {key:'correo',label:'Correo',type:'email',wide:true},{key:'contrasena',label:'Contraseña',type:'password',wide:true},
    {key:'nroCelular',label:'Celular',required:false},{key:'especialidad',label:'Especialidad'},{key:'nroColegiatura',label:'Colegiatura'},
  ]
  const linkFields = [
    treatmentField,
    {key:'idUsuario',label:'Usuario existente',options:users.filter(u=>u.rol==='VETERINARIO'&&!items.some(v=>v.idUsuario===u.idUsuario)).map(u=>({value:u.idUsuario,label:`${u.nombres} ${u.apellidos} · ${u.correo}`}))},
    {key:'especialidad',label:'Especialidad'},{key:'nroColegiatura',label:'Colegiatura'},
  ]
  const editFields = registroFields.filter(f=>f.key!=='contrasena')
  async function remove(item) {
    if (!window.confirm(`¿Eliminar al veterinario ${fullName(item)}?`)) return
    try { await api.delete(`/veterinarios/${item.idVeterinario}`); setMessage('Veterinario eliminado.'); await load() }
    catch (e) { setError(errorText(e)) }
  }
  const visible=items.filter(v=>adminMatches(query,fullName(v),v.especialidad,v.nroColegiatura)&&(!treatment||(v.tratamientoProfesional||'ninguno')===treatment))
  const done=()=>{setForm(null);setMessage('Cambios guardados correctamente.');load()}
  const prepare=value=>({...value,tratamientoProfesional:value.tratamientoProfesional==='ninguno'?'':value.tratamientoProfesional})
  async function saveVet(value){const p=prepare(value);if(form.type==='edit'){const {especialidad,nroColegiatura,tratamientoProfesional,...datosUsuario}=p;return api.put(`/veterinarios/${form.item.idVeterinario}`,{especialidad,nroColegiatura,tratamientoProfesional,datosUsuario})}return api.post(form.type==='registro'?'/veterinarios/registro':'/veterinarios',p)}
  return <section>
    <div className="vetcare-section-header">
      <div><h1>Veterinarios</h1><p>Profesionales disponibles para agendar citas.</p></div>
      <div className="flex gap-2 flex-wrap"><button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Actualizar</button>
        {admin && <button className="btn btn-ghost" onClick={()=>setForm({type:'link'})}>Vincular usuario</button>}
        {admin && <button className="btn btn-primary" onClick={()=>setForm({type:'registro'})}><Plus size={17}/> Registrar veterinario</button>}
      </div>
    </div>
    <CitaToast message={message} onClose={()=>setMessage('')}/><div className="admin-filters"><input className="input" aria-label="Buscar veterinarios" placeholder="Buscar por nombre, especialidad o colegiatura" value={query} onChange={e=>setQuery(e.target.value)}/>{admin&&<PrettySelect label="Filtrar tratamiento" value={treatment} onChange={setTreatment} placeholder="Todos los tratamientos" options={[{value:'ninguno',label:'Sin tratamiento'},{value:'Dr.',label:'Dr.'},{value:'Dra.',label:'Dra.'}]}/>}</div>
    {error && <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 mb-4 flex gap-2"><AlertCircle size={18}/>{error}</div>}
    <div className="overflow-x-auto bg-white border border-vetcare-soft rounded-2xl"><table className="w-full text-sm">
      <thead className="bg-[#f2eefc]"><tr>{['Profesional','Especialidad','Colegiatura', admin?'Acciones':null].filter(Boolean).map(h=><th key={h} className="px-4 py-4 text-left">{h}</th>)}</tr></thead>
      <tbody>{visible.map(v=><tr key={v.idVeterinario} className="border-t border-vetcare-soft-2">
        <td className="p-4 font-semibold">{fullName(v) || `Veterinario ${v.idVeterinario}`}{admin&&<small className="block font-normal text-vetcare-text-muted">{v.tratamientoProfesional||'Sin tratamiento'}</small>}</td>
        <td className="p-4">{v.especialidad}</td><td className="p-4">{v.nroColegiatura}</td>
        {admin && <td className="p-4"><div className="flex gap-2"><button className="btn btn-ghost text-xs" onClick={()=>setForm({type:'edit',item:{...users.find(u=>u.idUsuario===v.idUsuario),...v,tratamientoProfesional:v.tratamientoProfesional||'ninguno'}})}><Pencil size={14}/> Editar</button><button className="btn btn-ghost text-xs" onClick={()=>setForm({type:'photo',item:v})}>Fotografía</button><button className="btn btn-ghost text-xs" onClick={()=>remove(v)}><Trash2 size={14}/> Eliminar</button></div></td>}
      </tr>)}{!visible.length && <tr><td colSpan={4} className="text-center p-10 text-vetcare-text-muted">Sin veterinarios</td></tr>}</tbody>
    </table></div>
    {form?.type==='photo'&&<AdminPhoto userId={form.item.idUsuario} name={fullName(form.item)} onClose={()=>setForm(null)} onDone={done}/>}
    {form?.type==='registro' && <EditorForm title="Registrar veterinario" endpoint="/veterinarios/registro" fields={registroFields} initial={{tipoDocumento:'DNI',tratamientoProfesional:'ninguno'}} onSave={saveVet} onClose={()=>setForm(null)} onDone={done}/>}
    {form?.type==='link' && <EditorForm title="Vincular usuario existente" endpoint="/veterinarios" fields={linkFields} onSave={saveVet} initial={{tratamientoProfesional:'ninguno'}} onClose={()=>setForm(null)} onDone={done}/>}
    {form?.type==='edit' && <EditorForm title="Actualizar datos profesionales" endpoint={`/veterinarios/${form.item.idVeterinario}`} method="put" fields={editFields} onSave={saveVet} initial={form.item} onClose={()=>setForm(null)} onDone={done}/>}
  </section>
}
