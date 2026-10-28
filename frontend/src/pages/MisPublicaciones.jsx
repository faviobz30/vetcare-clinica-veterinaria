import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Trash2 } from 'lucide-react'
import { api, errorText } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import './UnifiedHeadings.css'

const tipos=['Adopción','Recuperación','Celebración','Aventuras','Otros']
export default function MisPublicaciones(){
 const {user,owner}=useAuth(),[mascotas,setMascotas]=useState([]),[historias,setHistorias]=useState([])
 const [form,setForm]=useState({idMascota:'',titulo:'',categoria:'Celebración',contenido:''}),[foto,setFoto]=useState(null),[mensaje,setMensaje]=useState(''),[busy,setBusy]=useState(false)
 const refrescar=async()=>{const r=await api.get('/publicaciones/mis');setHistorias(r.data)}
 useEffect(()=>{if(user?.role!=='PROPIETARIO')return;api.get('/mascotas').then(r=>setMascotas((Array.isArray(r.data)?r.data:[]).filter(m=>String(m.idPropietario??m.propietario?.idPropietario)===String(owner?.idPropietario)))).catch(()=>{});refrescar().catch(()=>{})},[user?.role,owner?.idPropietario])
 async function publicar(e){e.preventDefault();setMensaje('');setBusy(true)
 try{const r=await api.post('/publicaciones',{...form,idMascota:Number(form.idMascota)});if(foto){const body=new FormData();body.append('foto',foto);await api.post(`/publicaciones/${r.data.id}/foto`,body,{timeout:30000})}
 setForm({idMascota:'',titulo:'',categoria:'Celebración',contenido:''});setFoto(null);await refrescar();setMensaje('Historia publicada.')}
 catch(err){setMensaje(errorText(err))}finally{setBusy(false)}}
 async function eliminar(id){if(!window.confirm('¿Eliminar esta historia?'))return;try{await api.delete(`/publicaciones/${id}`);await refrescar()}catch(e){setMensaje(errorText(e))}}
 if(user?.role!=='PROPIETARIO')return <p>Solo los propietarios pueden publicar historias.</p>
 return <main className="space-y-6 text-[#321858]"><header className="vetcare-section-header"><div><h1>Mis historias</h1><p>Comparte momentos de tus mascotas con la comunidad.</p></div><Link to="/" className="rounded-xl border border-violet-200 px-4 py-2 text-violet-700">Ver comunidad pública</Link></header>
 <form onSubmit={publicar} className="max-w-3xl space-y-4 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Nueva historia</h2>
 <label className="block">Mascota<select required value={form.idMascota} onChange={e=>setForm(v=>({...v,idMascota:e.target.value}))} className="mt-1 w-full rounded-xl border border-violet-200 p-3"><option value="">Selecciona tu mascota</option>{mascotas.map(m=><option key={m.idMascota} value={m.idMascota}>{m.nombre}</option>)}</select></label>
 <label className="block">Título<input required maxLength={120} value={form.titulo} onChange={e=>setForm(v=>({...v,titulo:e.target.value}))} className="mt-1 w-full rounded-xl border border-violet-200 p-3"/></label>
 <label className="block">Categoría<select value={form.categoria} onChange={e=>setForm(v=>({...v,categoria:e.target.value}))} className="mt-1 w-full rounded-xl border border-violet-200 p-3">{tipos.map(x=><option key={x}>{x}</option>)}</select></label>
 <label className="block">Tu historia<textarea required maxLength={3000} rows={5} value={form.contenido} onChange={e=>setForm(v=>({...v,contenido:e.target.value}))} className="mt-1 w-full rounded-xl border border-violet-200 p-3"/></label>
 <label className="block"><span className="flex items-center gap-2"><ImagePlus size={18}/> Fotografía opcional (JPG, PNG o WebP, máximo 5 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFoto(e.target.files?.[0]||null)} className="mt-2 block w-full text-sm"/></label>
 <button disabled={busy} className="rounded-xl bg-[#5c23af] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy?'Publicando...':'Publicar historia'}</button>{mensaje&&<p role="status" className="text-sm text-[#624a81]">{mensaje}</p>}</form>
 <section className="grid gap-4 md:grid-cols-2">{historias.map(h=><article key={h.id} className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">{h.foto&&<img className="h-52 w-full object-cover" src={`${api.defaults.baseURL}/publicaciones/${h.id}/foto`} alt={`Mascota ${h.mascota}`}/>}<div className="space-y-2 p-5"><span className="text-xs font-bold text-emerald-700">{h.categoria}</span><h3 className="text-xl font-bold">{h.titulo}</h3><p className="text-sm text-violet-700">{h.mascota}</p><p className="whitespace-pre-wrap text-sm">{h.contenido}</p><button onClick={()=>eliminar(h.id)} className="flex items-center gap-1 text-sm text-red-700"><Trash2 size={16}/> Eliminar</button></div></article>)}</section>
 </main>
}
