import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Camera, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { api, errorText } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import EditorForm from '../components/EditorForm'
import PetAvatar from '../components/PetAvatar'
import PetPhotoEditor from '../components/PetPhotoEditor'
import PetPhotoCrop from '../components/PetPhotoCrop'
import { createPetWithPhoto, notifyPetPhoto } from '../lib/petPhoto'
import { dateDisplay, fullName, listOf } from '../lib/display'
import './UnifiedHeadings.css'

export default function Mascotas() {
  const { user, owner } = useAuth()
  const role = user?.role
  const canWrite = role === 'ADMIN' || role === 'PROPIETARIO'
  const [items,setItems] = useState([])
  const [owners,setOwners] = useState([])
  const [error,setError] = useState('')
  const [form,setForm] = useState(null)
  const [photoPet, setPhotoPet] = useState(null)
  const [rawPhoto, setRawPhoto] = useState(null)
  const [createPhoto, setCreatePhoto] = useState(null)
  const [notice, setNotice] = useState('')
  const cancelCrop = useCallback(() => setRawPhoto(null), [])
  const closePhoto = useCallback(() => setPhotoPet(null), [])
  const load = useCallback(() => api.get('/mascotas').then(async ({data}) => {
    setError(''); setItems(listOf(data))
    if (role === 'ADMIN') { const p = await api.get('/propietarios'); setOwners(listOf(p.data)) }
  }).catch(e => setError(errorText(e))), [role])
  useEffect(() => { void load() }, [load])
  const ownerOptions = owners.map(p => ({ value: p.idPropietario, label: `${fullName(p) || `Cliente ${p.idPropietario}`} (#${p.idPropietario})` }))
  const fields = [
    ...(role === 'ADMIN' ? [{ key:'idPropietario', label:'Propietario', options: ownerOptions }] : [{ key:'idPropietario', label:'Propietario', hidden:true }]),
    { key:'nombre', label:'Nombre', maxLength:100 },
    { key:'especie', label:'Especie', maxLength:50 },
    { key:'raza', label:'Raza', required:false, maxLength:100 },
    { key:'sexo', label:'Sexo', required:false, options:[{value:'Hembra',label:'Hembra'},{value:'Macho',label:'Macho'}] },
    { key:'fechaNacimiento', label:'Nacimiento', type:'date', required:false },
  ]
  async function remove(item) {
    if (!window.confirm(`¿Eliminar a ${item.nombre}? Solo es posible si no tiene citas ni historia clínica.`)) return
    setError('')
    try { await api.delete(`/mascotas/${item.idMascota}`); await load() }
    catch (e) { setError(errorText(e)) }
  }
  return <section>
    <div className="vetcare-section-header">
      <div><h1>{role==='PROPIETARIO'?'Mis mascotas':'Pacientes'}</h1><p>Gestiona la información de tus mascotas y sus fotografías.</p></div>
      <div className="flex gap-2"><button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Actualizar</button>{canWrite && <button className="btn btn-primary" onClick={()=>{setCreatePhoto(null);setForm({type:'create', item:{ idPropietario: owner?.idPropietario || '' }})}}><Plus size={17}/> Nueva mascota</button>}</div>
    </div>
    {notice && <p role="status" className="p-3 rounded-xl bg-emerald-50 text-emerald-800 mb-4">{notice}</p>}
    {error && <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 mb-4 flex gap-2"><AlertCircle size={18}/>{error}</div>}
    <div className="overflow-x-auto bg-white border border-vetcare-soft rounded-2xl shadow-sm">
      <table className="w-full text-sm"><thead className="bg-[#f2eefc]"><tr>{['Nombre','Especie','Raza','Sexo','Nacimiento','Propietario', canWrite?'Acciones':null].filter(Boolean).map(h=><th key={h} className="px-4 py-4 text-left">{h}</th>)}</tr></thead>
      <tbody>{items.map(m=><tr key={m.idMascota} className="border-t border-vetcare-soft-2">
        <td className="p-4 font-bold flex items-center gap-2"><PetAvatar pet={m}/>{m.nombre}</td>
        <td className="p-4">{m.especie}</td><td className="p-4">{m.raza || '—'}</td><td className="p-4">{m.sexo || '—'}</td>
        <td className="p-4">{dateDisplay(m.fechaNacimiento)}</td>
        <td className="p-4">{m.nombrePropietario || `#${m.idPropietario}`}</td>
        {canWrite && <td className="p-4"><div className="flex gap-2"><button className="btn btn-ghost text-xs" onClick={()=>setForm({type:'edit', item:m})}><Pencil size={14}/> Editar</button><button className="btn btn-ghost text-xs" onClick={()=>setPhotoPet({pet:m})}><Camera size={14}/> Fotografía</button><button className="btn btn-ghost text-xs" onClick={()=>remove(m)}><Trash2 size={14}/> Eliminar</button></div></td>}
      </tr>)}{!items.length && <tr><td colSpan={7} className="text-center p-10 text-vetcare-text-muted">No hay mascotas visibles para tu cuenta.</td></tr>}</tbody></table>
    </div>
    {form && <EditorForm title={form.type==='create'?'Registrar mascota':'Editar mascota'} endpoint={form.type==='create'?'/mascotas':`/mascotas/${form.item.idMascota}`} method={form.type==='create'?'post':'put'} fields={fields} initial={form.item} onClose={()=>setForm(null)}
      onSave={form.type==='create' ? payload => createPetWithPhoto(api, payload, createPhoto) : undefined}
      onDone={result=>{setForm(null);void load();if(form.type==='create'){if(result.photoError){setNotice('La mascota fue registrada. Solo falta guardar su fotografía; no vuelvas a registrar la mascota.');setPhotoPet({pet:result.pet,initialPhoto:createPhoto,initialError:errorText(result.photoError)})}else if(createPhoto){notifyPetPhoto(result.pet.idMascota,true);setNotice('Mascota y fotografía registradas.')}}}}>
      <section className="rounded-xl border border-violet-100 p-4"><h3 className="font-semibold mb-2">Fotografía de la mascota</h3>{form.type==='create' ? <><label className="btn btn-ghost cursor-pointer"><Camera size={17}/>Seleccionar fotografía opcional<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)setRawPhoto(file)}}/></label><p className="text-xs text-gray-500 mt-2">{createPhoto ? 'Recorte preparado. Se guardará después de registrar la mascota.' : 'Puedes registrar la mascota sin fotografía.'}</p>{createPhoto&&<button type="button" className="text-sm text-violet-700 underline mt-2" onClick={()=>setCreatePhoto(null)}>Quitar fotografía pendiente</button>}</> : <button type="button" className="btn btn-ghost" onClick={()=>setPhotoPet({pet:form.item})}><Camera size={17}/>Gestionar fotografía sin modificar otros datos</button>}</section>
    </EditorForm>}
    {rawPhoto && <PetPhotoCrop file={rawPhoto} onCancel={cancelCrop} onConfirm={file=>{setCreatePhoto(file);setRawPhoto(null)}}/>}
    {photoPet && <PetPhotoEditor {...photoPet} onClose={closePhoto} onSaved={()=>void load()}/>}
  </section>
}
