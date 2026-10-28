import {useSearchParams} from 'react-router-dom'
import {adminStates} from '../lib/admin'
import AdminCitaReschedule from '../components/AdminCitaReschedule'
import AdminCitaDialog from '../components/AdminCitaDialog'
import CitaActionsMenu from '../components/CitaActionsMenu'
import {adminCitaRows,adminCitaActions,citaPet,citaVet,citaLabels,citaChips} from '../lib/adminAppointments'
import {appointmentError} from '../lib/appointments'
import {loadAttentionDetail} from '../lib/attentions'
import AttentionDetail from '../components/AttentionDetail'
import './CitasAdmin.css'
import PrettySelect from '../components/PrettySelect'
import './Admin.css'
import './Perfil.css'
import './UnifiedHeadings.css'
import {useCitaToast} from '../lib/useCitaToast'
import RegularizacionesCita from '../components/RegularizacionesCita'
import CitaToast from '../components/CitaToast'
import AppointmentEditor from '../components/AppointmentEditor'
import AppointmentModal from '../components/AppointmentModal'
import {AtencionForm} from './Atenciones'
import {attentionWindow,professionalName} from '../lib/clinicalAppointments'
import {attentionDate} from '../lib/attentions'
import '../components/Appointments.css'
import PetAvatar from '../components/PetAvatar'
import VetCitas from './VetCitas'
import AppointmentWorkspace from '../components/AppointmentWorkspace'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CalendarPlus, RefreshCw, Trash2, Search, SlidersHorizontal, Eye, CheckCircle2, CalendarDays, XCircle, FileText, Clock } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { listOf } from '../lib/display'
function GeneralCitas(){
 const [params,setParams]=useSearchParams(),[search,setSearch]=useState(''),[filterDate,setFilterDate]=useState(''),[filterVet,setFilterVet]=useState(''),[filterState,setFilterState]=useState(''),[selected,setSelected]=useState(null)
 const {user}=useAuth(); const [items,setItems]=useState([]),[mascotas,setMascotas]=useState([]),[vets,setVets]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(''),[form,setForm]=useState(null)
 const [operation,setOperation]=useState(null),[opError,setOpError]=useState(''),[attention,setAttention]=useState(null),[message,setMessage]=useCitaToast(),[revision,setRevision]=useState(0)
 const writing=useRef(false),loading=useRef(false),detailRequest=useRef(0)
 const [more,setMore]=useState(false),[fetching,setFetching]=useState(true),[visits,setVisits]=useState([]),[visitDetail,setVisitDetail]=useState(null),[detailBusy,setDetailBusy]=useState(false),[photoRevision,setPhotoRevision]=useState(0)
 const role=user?.role; const canCreate=role==='PROPIETARIO'||role==='ADMIN'
 const load=useCallback(async()=>{if(loading.current)return;loading.current=true;setFetching(true);try{const [{data:c},{data:m},{data:v}]=await Promise.all([api.get('/citas'),api.get('/mascotas'),api.get('/veterinarios')]);setItems(listOf(c));setMascotas(listOf(m));setVets(listOf(v));setPhotoRevision(n=>n+1);setError('');try{const {data:a}=await api.get('/atenciones');setVisits(listOf(a))}catch(e){setVisits([]);setError(`Las citas se cargaron, pero no sus atenciones asociadas. ${appointmentError(e)}`)}}catch(e){setError(appointmentError(e))}finally{loading.current=false;setFetching(false)}},[])
 useEffect(()=>{const timer=setTimeout(()=>load(),0);return()=>clearTimeout(timer)},[load])
 async function openDetail(item){const request=++detailRequest.current;setDetailBusy(true);setError('');try{const {data}=await api.get(`/citas/${item.idCita}`);if(request===detailRequest.current)setSelected(data)}catch(e){if(request===detailRequest.current)setError(appointmentError(e))}finally{if(request===detailRequest.current)setDetailBusy(false)}}
 async function openVisit(cita){const visit=visits.find(a=>String(a.idCita)===String(cita.idCita));if(!visit)return;setSelected(null);setVisitDetail({state:{loading:true},cita});try{const attention=await loadAttentionDetail(api,visit.idAtencion);if(String(attention.idCita)!==String(cita.idCita))throw Error('La atención no corresponde a la cita seleccionada.');const vet=citaVet(vets,cita);setVisitDetail({state:{},cita,row:{attention,cita,pet:citaPet(mascotas,cita),vet,vetName:professionalName(vet)}})}catch(e){setVisitDetail({state:{error:appointmentError(e)},cita})}}
 async function commit(payload){if(writing.current)return;writing.current=true;setBusy('operation');setOpError('');try{if(operation.type==='eliminar')await api.delete(`/citas/${operation.item.idCita}`);else await api({url:`/citas/${operation.item.idCita}/${operation.type}`,method:operation.type==='regularizaciones'?'post':'put',data:payload});setMessage(operation.type==='eliminar'?'Cita eliminada correctamente.':operation.type==='cancelar'?'Cita cancelada correctamente.':operation.type==='no-asistio'?'Inasistencia registrada.':'Cita confirmada correctamente.');setOperation(null);await load()}catch(e){setOpError(appointmentError(e))}finally{writing.current=false;setBusy('')}}
 function change(item,type){setOpError('');setOperation({item,type})}
 const baseRows=adminCitaRows(items,mascotas,{query:search,date:filterDate,vet:filterVet,id:params.get('cita')||''})
 const visible=baseRows.filter(c=>!filterState||c.estado===filterState)
 const filtersActive=!!(search||filterDate||filterState||filterVet||params.get('cita'))
 function clearFilters(){setSearch('');setFilterDate('');setFilterVet('');setFilterState('');setParams({})}
 function actions(c){const allowed=adminCitaActions(c);return [
  ...(allowed.confirm?[{label:'Confirmar cita',icon:CheckCircle2,tone:'positive',onClick:()=>change(c,'confirmar')}]:[]),
  ...(allowed.reschedule?[{label:'Reprogramar cita',icon:CalendarDays,onClick:()=>setForm({type:'edit',item:c})}]:[]),
  ...(allowed.cancel?[{label:'Cancelar cita',icon:XCircle,onClick:()=>change(c,'cancelar')}]:[]),
  ...(attentionWindow(c).noShow?[{label:'No asistió',icon:Clock,onClick:()=>change(c,'no-asistio')}]:[]),
  ...(c.estado==='ATENDIDA'&&visits.some(a=>String(a.idCita)===String(c.idCita))?[{label:'Ver atención',icon:FileText,onClick:()=>openVisit(c)}]:[]),
  ...(allowed.remove?[{label:'Eliminar cita',icon:Trash2,tone:'destructive',onClick:()=>change(c,'eliminar')}]:[])
 ]}
 return <section className="admin-citas"><div className="vetcare-section-header"><div><h1 className="text-3xl font-black">Citas veterinarias</h1><p className="text-vetcare-text-muted mt-1">Organiza y supervisa las consultas de la clínica.</p></div><div className="flex gap-2"><button className="btn btn-ghost" disabled={fetching} onClick={load}><RefreshCw size={17}/> {fetching?'Actualizando…':'Actualizar'}</button>{canCreate&&<button className="btn btn-primary" onClick={()=>setForm({type:'create'})}><CalendarPlus size={17}/> Nueva cita</button>}</div></div>
 <div className="admin-citas-filters"><label className="admin-citas-search"><Search size={18}/><input className="input" aria-label="Buscar mascota, propietario o motivo" placeholder="Buscar mascota, propietario o motivo" value={search} onChange={e=>setSearch(e.target.value)}/></label><input className="input" aria-label="Fecha de cita · Lima (vacío: todas las fechas)" title="Todas las fechas · Lima" type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)}/><div className="admin-citas-state"><PrettySelect label="Estado de cita" value={filterState} onChange={setFilterState} placeholder="Todos los estados" keyboardNavigation options={adminStates.map(s=>({value:s,label:citaLabels[s]}))}/></div><button className="btn btn-ghost" aria-expanded={more} onClick={()=>setMore(v=>!v)}><SlidersHorizontal size={17}/>Más filtros</button></div>
 {more&&<div className="admin-citas-more"><PrettySelect label="Veterinario responsable" value={filterVet} onChange={setFilterVet} placeholder="Todos los veterinarios" keyboardNavigation options={vets.map(v=>({value:v.idVeterinario,label:professionalName(v)}))}/></div>}
 <div className="admin-citas-chips">{citaChips.map(([state,label])=><button key={state} aria-pressed={filterState===state} onClick={()=>setFilterState(state)}>{label}<b>{baseRows.filter(c=>!state||c.estado===state).length}</b></button>)}{filtersActive&&<button className="cita-clear" onClick={clearFilters}>Limpiar filtros</button>}</div>
 <p className="admin-citas-count">{visible.length} citas visibles · Contadores según búsqueda, fecha y veterinario, antes del filtro de estado. Horarios de Lima.</p>
 <CitaToast message={message} onClose={()=>setMessage('')}/>
 {error&&<div role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 mb-4 flex gap-2"><AlertCircle size={18}/>{error}</div>}
 <div className="admin-citas-table-wrap" aria-busy={fetching}><table className="admin-citas-table"><thead><tr>{['Mascota / Propietario','Veterinario','Fecha','Hora','Motivo','Estado','Acciones'].map(x=><th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{visible.map(c=>{const pet=citaPet(mascotas,c),vet=citaVet(vets,c);return <tr key={c.idCita}><td><div className="admin-citas-pet"><PetAvatar key={`${pet?.idMascota}-${pet?.fotoUrl||''}-${photoRevision}`} pet={pet} size={40}/><div><strong>{pet?.nombre||'Mascota no disponible'}</strong><small>{pet?.nombrePropietario||'Propietario no disponible'}</small></div></div></td><td><strong>{professionalName(vet)||'Veterinario no disponible'}</strong>{vet?.especialidad&&<small>{vet.especialidad}</small>}</td><td className="whitespace-nowrap">{attentionDate(c.fechaCita)}</td><td className="whitespace-nowrap">{attentionDate(c.fechaCita,'time')}</td><td><p className="admin-citas-motive" title={c.motivoCita}>{c.motivoCita||'No registrado'}</p></td><td><span className={`admin-cita-badge state-${c.estado}`}>{citaLabels[c.estado]||c.estado}</span></td><td><div className="admin-citas-actions"><button className="btn btn-ghost" disabled={detailBusy} onClick={()=>openDetail(c)}><Eye size={16}/>Ver</button><CitaActionsMenu label={pet?.nombre||'la cita'} actions={actions(c)} disabled={!!busy||fetching}/></div></td></tr>})}{!visible.length&&<tr><td colSpan={7} className="admin-citas-empty">{fetching?'Consultando citas…':error?'No fue posible mostrar las citas. Actualiza para reintentar.':filtersActive?'No hay citas que coincidan con estos filtros.':'Todavía no hay citas registradas.'}</td></tr>}</tbody></table></div>
 {detailBusy&&<p role="status">Consultando detalle de la cita…</p>}
 {selected&&<AdminCitaDialog item={selected} pet={citaPet(mascotas,selected)} vet={citaVet(vets,selected)} onClose={()=>setSelected(null)} onAttention={selected.estado==='ATENDIDA'&&visits.some(a=>String(a.idCita)===String(selected.idCita))?()=>openVisit(selected):undefined}/>}
 {visitDetail&&<AttentionDetail state={visitDetail.state} row={visitDetail.row} onClose={()=>setVisitDetail(null)} onRetry={()=>openVisit(visitDetail.cita)}/>}
 {form?.type==='edit'&&<AdminCitaReschedule item={form.item} pet={citaPet(mascotas,form.item)} vet={citaVet(vets,form.item)} onClose={()=>setForm(null)} onDone={()=>{setForm(null);setMessage('Cita reprogramada correctamente.');load()}}/>}
 {form?.type==='create'&&<AppointmentEditor item={form.item} pets={mascotas} vets={vets} onClose={()=>setForm(null)} onDone={()=>{setForm(null);setMessage(form.item?'Cita reprogramada correctamente.':'Cita solicitada correctamente.');load()}}/>}
 {operation&&<AdminCitaDialog key={operation.item.idCita+'-'+operation.type} item={operation.item} type={operation.type} pet={citaPet(mascotas,operation.item)} vet={citaVet(vets,operation.item)} busy={!!busy} error={opError} onClose={()=>{if(!busy)setOperation(null)}} onConfirm={commit}/>}
 {attention&&<AppointmentModal onClose={()=>setAttention(null)}><AtencionForm mode="create" item={{idCita:attention.idCita}} citas={[attention]} mascotas={mascotas} veterinarios={vets} onClose={()=>setAttention(null)} onDone={()=>{setAttention(null);setMessage('Atención registrada correctamente.');load()}}/></AppointmentModal>}
 {role==='ADMIN'&&<RegularizacionesCita revision={revision} onResolved={text=>{setMessage(text);setRevision(v=>v+1);load()}}/>}

 </section>
}

export default function Citas() {
 const { user } = useAuth()
 return user?.role === 'VETERINARIO' ? <VetCitas key={user?.idUsuario}/> : user?.role === 'PROPIETARIO' ? <AppointmentWorkspace key={`${user.idUsuario}-${user.role}`}/> : <GeneralCitas/>
}
