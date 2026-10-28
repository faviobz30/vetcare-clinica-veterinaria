import {useSearchParams} from 'react-router-dom'
import {adminMatches,adminStates} from '../lib/admin'
import AdminDetail from '../components/AdminDetail'
import PrettySelect from '../components/PrettySelect'
import './Admin.css'
import './Perfil.css'
import './UnifiedHeadings.css'
import {useCitaToast} from '../lib/useCitaToast'
import RegularizacionesCita from '../components/RegularizacionesCita'
import Operation from '../components/CitaOperationDialog'
import CitaToast from '../components/CitaToast'
import AppointmentEditor from '../components/AppointmentEditor'
import AppointmentModal from '../components/AppointmentModal'
import {AtencionForm} from './Atenciones'
import {attentionWindow,FUTURE_ATTENTION_HELP,professionalName} from '../lib/clinicalAppointments'
import {Link} from 'react-router-dom'
import {attentionDate} from '../lib/attentions'
import '../components/Appointments.css'
import PetAvatar from '../components/PetAvatar'
import VetCitas from './VetCitas'
import AppointmentWorkspace from '../components/AppointmentWorkspace'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CalendarPlus, RefreshCw, Trash2 } from 'lucide-react'
import { api, errorText } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { listOf } from '../lib/display'
const format=d=>d?`${attentionDate(d)} · ${attentionDate(d,'time')}`:'—'
function GeneralCitas(){
 const [params,setParams]=useSearchParams(),[search,setSearch]=useState(''),[filterDate,setFilterDate]=useState(''),[filterVet,setFilterVet]=useState(''),[filterState,setFilterState]=useState(''),[selected,setSelected]=useState(null)
 const {user}=useAuth(); const [items,setItems]=useState([]),[mascotas,setMascotas]=useState([]),[vets,setVets]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(''),[form,setForm]=useState(null)
 const [operation,setOperation]=useState(null),[opError,setOpError]=useState(''),[attention,setAttention]=useState(null),[message,setMessage]=useCitaToast(),[revision,setRevision]=useState(0)
 const writing=useRef(false)
 const role=user?.role; const canCreate=role==='PROPIETARIO'||role==='ADMIN'
 function load(){return Promise.all([api.get('/citas'),api.get('/mascotas'),api.get('/veterinarios')]).then(([{data:c},{data:m},{data:v}])=>{setError('');setItems(listOf(c));setMascotas(listOf(m));setVets(listOf(v))}).catch(e=>setError(errorText(e)))}
 useEffect(()=>{load()},[])
 async function commit(payload){if(writing.current)return;writing.current=true;setBusy('operation');setOpError('');try{await api({url:`/citas/${operation.item.idCita}/${operation.type}`,method:operation.type==='regularizaciones'?'post':'put',data:payload});setMessage(operation.type==='cancelar'?'Cita cancelada correctamente.':operation.type==='no-asistio'?'Inasistencia registrada.':'Cita confirmada correctamente.');setOperation(null);await load()}catch(e){setOpError(errorText(e))}finally{writing.current=false;setBusy('')}}
 function change(item,type){setOpError('');setOperation({item,type})}
 async function remove(item){if(!window.confirm(`¿Eliminar la cita #${item.idCita}?`))return;setBusy(`${item.idCita}-delete`);setError('');try{await api.delete(`/citas/${item.idCita}`);await load()}catch(e){setError(errorText(e))}finally{setBusy('')}}
 const canReschedule=c=>['PENDIENTE','CONFIRMADA'].includes(c.estado)&&(role==='ADMIN'||(role==='PROPIETARIO'&&c.estado==='PENDIENTE'))
 const visible=items.filter(c=>{const pet=mascotas.find(p=>p.idMascota===c.idMascota);return (!params.get('cita')||String(c.idCita)===params.get('cita'))&&(!filterDate||c.fechaCita?.slice(0,10)===filterDate)&&(!filterVet||String(c.idVeterinario)===filterVet)&&(!filterState||c.estado===filterState)&&adminMatches(search,pet?.nombre,pet?.nombrePropietario,c.motivoCita)})
 return <section><div className="vetcare-section-header"><div><h1 className="text-3xl font-black">Citas veterinarias</h1><p className="text-vetcare-text-muted mt-1">Agenda y seguimiento según tu rol</p></div><div className="flex gap-2"><button className="btn btn-ghost" onClick={load}><RefreshCw size={17}/> Actualizar</button>{canCreate&&<button className="btn btn-primary" onClick={()=>setForm({type:'create'})}><CalendarPlus size={17}/> Nueva cita</button>}</div></div>
 <div className="admin-filters"><input className="input" aria-label="Buscar cita por mascota o propietario" placeholder="Mascota, propietario o motivo" value={search} onChange={e=>setSearch(e.target.value)}/><input className="input" aria-label="Fecha de cita" type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/><PrettySelect label="Filtrar veterinario" value={filterVet} onChange={setFilterVet} placeholder="Todos los veterinarios" options={vets.map(v=>({value:v.idVeterinario,label:professionalName(v)}))}/><PrettySelect label="Filtrar estado de cita" value={filterState} onChange={setFilterState} placeholder="Todos los estados" options={adminStates.map(s=>({value:s,label:s.replace('_',' ')}))}/><button className="btn btn-ghost" onClick={()=>{setSearch('');setFilterDate('');setFilterVet('');setFilterState('');setParams({})}}>Limpiar filtros</button></div>
 <CitaToast message={message} onClose={()=>setMessage('')}/>
 {error&&<div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 mb-4 flex gap-2"><AlertCircle size={18}/>{error}</div>}
 <div className="overflow-x-auto bg-white border border-vetcare-soft rounded-2xl shadow-sm"><table className="w-full text-sm"><thead className="bg-[#f2eefc]"><tr>{['Cita','Mascota','Veterinario','Fecha','Motivo','Estado','Acciones'].map(x=><th key={x} className="px-4 py-4 text-left">{x}</th>)}</tr></thead><tbody>{visible.map(c=><tr key={c.idCita} className="border-t border-vetcare-soft-2"><td className="p-4 font-bold">#{c.idCita}</td><td className="p-4"><span className="inline-flex items-center gap-2"><PetAvatar pet={mascotas.find(m=>String(m.idMascota)===String(c.idMascota))} size={32}/>{mascotas.find(m=>m.idMascota===c.idMascota)?.nombre||`#${c.idMascota}`}</span></td><td className="p-4">{mascotas.find(m=>m.idMascota===c.idMascota)?.nombrePropietario||'No disponible'}</td><td className="p-4">{[professionalName(vets.find(v=>v.idVeterinario===c.idVeterinario))||'Veterinario no disponible',vets.find(v=>v.idVeterinario===c.idVeterinario)?.especialidad].filter(Boolean).join(' — ')}</td><td className="p-4 whitespace-nowrap">{format(c.fechaCita)}</td><td className="p-4 max-w-64">{c.motivoCita}{c.motivoCancelacion&&<p className="text-xs text-vetcare-text-muted mt-2">Cancelación: {c.motivoCancelacion} {c.detalleCancelacion}</p>}</td><td className="p-4"><span className={`px-3 py-1 text-xs rounded-full font-semibold ${c.estado==='ATENDIDA'?'bg-emerald-100 text-emerald-800':c.estado==='CANCELADA'?'bg-red-50 text-red-800':c.estado==='NO_ASISTIO'?'bg-gray-100 text-gray-700':c.estado==='CONFIRMADA'?'bg-indigo-100 text-indigo-800':'bg-amber-100 text-amber-900'}`}>{c.estado}</span></td><td className="p-4"><div className="flex flex-wrap gap-2"><button className="btn btn-ghost text-xs" onClick={()=>setSelected(c)}>Ver cita</button>{c.estado==='PENDIENTE'&&['ADMIN','VETERINARIO'].includes(role)&&<button className="btn btn-ghost text-xs" disabled={!!busy} onClick={()=>change(c,'confirmar')}>Confirmar</button>}{role!=='ADMIN'&&c.estado==='CONFIRMADA'&&(!attentionWindow(c).expired||attentionWindow(c).canStart)&&<span title={!attentionWindow(c).canStart?FUTURE_ATTENTION_HELP:undefined} tabIndex={!attentionWindow(c).canStart?0:undefined}><button className="btn btn-primary text-xs" disabled={!!busy||!attentionWindow(c).canStart} onClick={()=>setAttention(c)}>Registrar atención</button></span>}{attentionWindow(c).noShow&&<button className="btn btn-ghost text-xs" disabled={!!busy} onClick={()=>change(c,'no-asistio')}>No asistió</button>}{c.estado==='ATENDIDA'&&<Link className="btn btn-ghost text-xs" to="/panel/atenciones">Ver atención</Link>}{canReschedule(c)&&<button className="btn btn-ghost text-xs" onClick={()=>setForm({type:'edit',item:c})}>Reprogramar</button>}{['PENDIENTE','CONFIRMADA'].includes(c.estado)&&['PROPIETARIO','ADMIN'].includes(role)&&<button disabled={!!busy} className="btn btn-ghost text-xs" onClick={()=>change(c,'cancelar')}>Cancelar</button>}{role==='ADMIN'&&!['ATENDIDA','CANCELADA','NO_ASISTIO'].includes(c.estado)&&<button disabled={!!busy} className="btn btn-ghost text-xs" onClick={()=>remove(c)}><Trash2 size={14}/> Eliminar</button>}</div></td></tr>)}{!visible.length&&<tr><td colSpan={8} className="text-center p-10 text-vetcare-text-muted">Sin citas visibles</td></tr>}</tbody></table></div>
 {selected&&<AdminDetail title="Detalle de cita" onClose={()=>setSelected(null)}><dl className="space-y-3">{Object.entries({Mascota:mascotas.find(p=>p.idMascota===selected.idMascota)?.nombre,Propietario:mascotas.find(p=>p.idMascota===selected.idMascota)?.nombrePropietario,Veterinario:professionalName(vets.find(v=>v.idVeterinario===selected.idVeterinario)),Fecha:format(selected.fechaCita),Estado:selected.estado,Motivo:selected.motivoCita}).map(([label,value])=><div key={label}><dt>{label}</dt><dd className="font-semibold">{value||'No disponible'}</dd></div>)}</dl></AdminDetail>}
 {form&&<AppointmentEditor item={form.item} pets={mascotas} vets={vets} onClose={()=>setForm(null)} onDone={()=>{setForm(null);setMessage(form.item?'Cita reprogramada correctamente.':'Cita solicitada correctamente.');load()}}/>}
 {operation&&<Operation key={operation.item.idCita+'-'+operation.type} operation={operation} pet={mascotas.find(p=>p.idMascota===operation.item.idMascota)} busy={!!busy} error={opError} onClose={()=>{if(!busy)setOperation(null)}} onConfirm={commit}/>}
 {attention&&<AppointmentModal onClose={()=>setAttention(null)}><AtencionForm mode="create" item={{idCita:attention.idCita}} citas={[attention]} mascotas={mascotas} veterinarios={vets} onClose={()=>setAttention(null)} onDone={()=>{setAttention(null);setMessage('Atención registrada correctamente.');load()}}/></AppointmentModal>}
 {role==='ADMIN'&&<RegularizacionesCita revision={revision} onResolved={text=>{setMessage(text);setRevision(v=>v+1);load()}}/>}

 </section>
}

export default function Citas() {
 const { user } = useAuth()
 return user?.role === 'VETERINARIO' ? <VetCitas key={user?.idUsuario}/> : user?.role === 'PROPIETARIO' ? <AppointmentWorkspace key={`${user.idUsuario}-${user.role}`}/> : <GeneralCitas/>
}
