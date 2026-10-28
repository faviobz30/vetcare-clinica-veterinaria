import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, CheckCircle2, ChevronDown, ChevronUp, FileText, Heart, ShieldCheck, Syringe, UserRound, AlertCircle, Plus, RefreshCw } from 'lucide-react'
import PrettySelect from '../components/PrettySelect'
import PetAvatar from '../components/PetAvatar'
import VaccineCalendar from '../components/VaccineCalendar'
import VaccineEditor from '../components/VaccineEditor'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { fullName } from '../lib/display'
import { historicalAge } from '../lib/attentions'
import { limaToday } from '../lib/clinicalHistory'
import { allergyEvaluation, hasClinicalText, vaccineDateLabel, weightEvolution } from '../lib/ownerHistory'
import { notifyVaccinesChanged, patientAttentions, vaccineError, vaccineLists, VACCINES_CHANGED } from '../lib/vaccines'
import './Vacunas.css'
const collection=data=>{if(!Array.isArray(data)&&!Array.isArray(data?.content))throw Error('Listado con formato inesperado');return Array.isArray(data)?data:data.content}
function Panel({title,icon:Icon,children,subtitle,action}){return <section className="vax-panel"><header><div><h2><Icon size={21}/>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</header>{children}</section>}
function VaccineRow({v,applied,pet,vetName,canWrite,clinical,canApply,own,onAction}){
  const [open,setOpen]=useState(false)
  const extra=hasClinicalText(v.observaciones),hasDetails=extra||clinical
  const overdue=!applied&&v.estadoProximaDosis==='VENCIDA'
  return <article className={`vax-record ${clinical?'clinical':''}`}>
    <div className="vax-record-main"><span className="vax-record-icon"><Syringe size={24}/></span><div className="vax-record-name"><h3>{v.nombre}</h3><p>Paciente: {pet.nombre}</p></div><div className="vax-record-meta"><p><CalendarDays size={16}/><span><small>{applied?'Fecha de aplicación':'Fecha programada'}</small><strong>{vaccineDateLabel(applied?v.fechaAplicacion:v.proximaDosis)}</strong></span></p><p><UserRound size={16}/><span><small>Veterinario</small><strong>{vetName}</strong></span></p></div>{applied&&<div className="vax-next-date"><small>Próxima dosis</small><span>{v.proximaDosis?vaccineDateLabel(v.proximaDosis):'No programada'}</span></div>}<span className={`vax-status ${applied?'applied':overdue?'overdue':''}`}>{applied?'Aplicada':overdue?'Pendiente · vencida':'Programada'}</span>
      {hasDetails&&<button className="vax-link" aria-label={`${open?'Ocultar':'Ver'} ${applied?'detalle':'indicaciones'} de ${v.nombre}`} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?'Ocultar':applied?'Ver detalle':'Ver indicaciones'}{open?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>}
    </div>
    {open&&<div className="vax-record-details">{applied&&v.fechaProgramada&&<p>Fecha originalmente programada: {vaccineDateLabel(v.fechaProgramada)}</p>}{extra?<><h4><FileText size={18}/>{applied?'Observaciones del veterinario':'Indicaciones del veterinario'}</h4><p>{v.observaciones}</p></>:clinical?<p>No se registraron indicaciones adicionales.</p>:null}{clinical&&!applied&&<p className="vax-reminder">Recordatorios automáticos: 7 días antes, 1 día antes, hoy y al vencer. No confirma entrega de correo.</p>}</div>}
    {clinical&&!applied&&v.fechaAplicacion&&<p className="vax-footnote">Próxima dosis asociada a una aplicación anterior; no es un nuevo registro de aplicación.</p>}
    {canWrite&&own&&<div className="vax-record-actions">{applied?<button onClick={()=>onAction('note',v)}>Editar nota</button>:<><button onClick={()=>onAction('edit',v)}>Editar</button><button onClick={()=>onAction('reschedule',v)}>Reprogramar</button><button className="vax-positive" disabled={!canApply} onClick={()=>onAction('apply',v)}><CheckCircle2 size={16}/>Registrar en atención</button></>}</div>}
  </article>
}
function PatientVaccines({pet,vets,me,role,from,to}){
  const navigate=useNavigate()
  const clinical=role==='VETERINARIO',[revision,setRevision]=useState(0),[loaded,setLoaded]=useState(null),[form,setForm]=useState(null),[success,setSuccess]=useState(''),[oldest,setOldest]=useState(false)
  useEffect(()=>{if(!success)return;const timer=setTimeout(()=>setSuccess(''),4000);return()=>clearTimeout(timer)},[success])
  useEffect(()=>{
    const controller=new AbortController()
    async function load(){
      const {data}=await api.get(`/vacunas/mascota/${pet.idMascota}`,{signal:controller.signal})
      const rows=collection(data).filter(v=>String(v.idMascota)===String(pet.idMascota))
      let history=null,attentions=[],clinicalError=false
      if(clinical){const results=await Promise.allSettled([api.get(`/historias-clinicas/mascota/${pet.idMascota}`,{signal:controller.signal}),api.get('/atenciones',{signal:controller.signal})]);
        history=results[0].status==='fulfilled'&&String(results[0].value.data.idMascota)===String(pet.idMascota)?results[0].value.data:null
        if(results[1].status==='fulfilled')attentions=collection(results[1].value.data)
        clinicalError=!history||results[1].status==='rejected'
      }
      if(!controller.signal.aborted)setLoaded({revision,rows,history,attentions,clinicalError})
    }
    load().catch(error=>{if(!controller.signal.aborted)setLoaded({revision,error})})
    return()=>controller.abort()
  },[pet.idMascota,clinical,revision])
  useEffect(()=>{
    const refresh=()=>{if(!form)setRevision(v=>v+1)},changed=event=>{if(String(event.detail?.id)===String(pet.idMascota))setRevision(v=>v+1)}
    window.addEventListener('focus',refresh);window.addEventListener(VACCINES_CHANGED,changed)
    return()=>{window.removeEventListener('focus',refresh);window.removeEventListener(VACCINES_CHANGED,changed)}
  },[pet.idMascota,form])
  const loading=loaded?.revision!==revision
  const current=loaded
  const reload=()=>setRevision(value=>value+1)
  if(!current)return <p className="vax-feedback" role="status">Consultando vacunas del paciente…</p>
  if(current.error)return <div role="alert" className="vax-feedback"><p>{vaccineError(current.error)}</p><button onClick={reload}>Volver a intentar</button></div>
  const {upcoming,applied}=vaccineLists(current.rows,{from,to,oldest}),allUpcoming=vaccineLists(current.rows).upcoming
  const next=allUpcoming.find(v=>v.proximaDosis>=limaToday())||allUpcoming[0]
  const ownScheduled=current.rows.filter(v=>!v.fechaAplicacion&&String(v.idVeterinario)===String(me?.idVeterinario))
  const attentions=patientAttentions(current.attentions,current.history?.idHistoria,me?.idVeterinario)
  const weight=weightEvolution(attentions),a=current.history?.antecedentes,allergy=allergyEvaluation(a)
  const onAction=(mode,item)=>{if(mode==='apply'||mode==='application'){navigate('/panel/citas');return}setForm({mode,item})}
  const vetName=id=>fullName(vets.find(v=>String(v.idVeterinario)===String(id)))||'Profesional no disponible'
  const canWrite=clinical&&!!me?.idVeterinario&&!loading
  const alerts=[...(a?.estadoAlergias==='ALERGIAS_REGISTRADAS'&&a?.alergiasSustancias?[a.alergiasSustancias]:[]),...(hasClinicalText(a?.alertasMedicas)?[a.alertasMedicas]:[])]
  const expired=allUpcoming.filter(v=>v.proximaDosis<limaToday())
  return <>
    {loading&&<p className="vax-loading" role="status">Actualizando vacunas…</p>}
    <div className="vax-context-bar">{!clinical&&<div className="vax-next-indicator"><CalendarDays size={26}/><div><small>{next&&next.proximaDosis<limaToday()?'Dosis pendiente':'Próxima vacuna'}</small><strong>{next?`${next.nombre} · ${vaccineDateLabel(next.proximaDosis)}`:'No hay próximas dosis registradas.'}</strong></div></div>}{clinical&&<div className="vax-write-actions"><button className="vax-primary" disabled={!canWrite} onClick={()=>onAction('schedule',{})}><Plus size={17}/>Programar vacuna</button><button disabled={!canWrite||current.clinicalError} onClick={()=>onAction('application',{})}><Syringe size={17}/>Registrar desde cita</button></div>}<button className="vax-reload" disabled={loading} onClick={reload}><RefreshCw size={15}/>Actualizar</button></div>
    {success&&<p className="vax-success" role="status">{success}</p>}{current.clinicalError&&<p className="vax-feedback" role="alert">No se pudo cargar todo el resumen clínico. Actualiza antes de registrar una aplicación.</p>}
    <div className="vax-layout"><div className="vax-main-list">
      <Panel title={clinical?`Vacunas programadas (${upcoming.length})`:'Próximas vacunas'} icon={CalendarDays} subtitle={clinical?null:'Dosis registradas pendientes o por venir.'}>{upcoming.length?upcoming.map(v=><VaccineRow key={`next-${v.idVacuna}`} v={v} clinical={clinical} pet={pet} vetName={vetName(v.idVeterinario)} canApply={!current.clinicalError} canWrite={canWrite&&!v.fechaAplicacion} own={String(v.idVeterinario)===String(me?.idVeterinario)} onAction={(mode,item)=>{if(item.fechaAplicacion)return;onAction(mode,item)}}/>):<p className="vax-empty">No hay próximas dosis registradas en este rango.</p>}</Panel>
      <Panel title={clinical?`Historial de aplicaciones (${applied.length})`:'Vacunas aplicadas'} icon={CheckCircle2} subtitle={clinical?null:'Historial de vacunas ya aplicadas.'} action={<button className="vax-link" onClick={()=>setOldest(value=>!value)}>{oldest?'Más antiguas primero':'Más recientes primero'}</button>}>{applied.length?applied.map(v=><VaccineRow key={`applied-${v.idVacuna}`} applied v={v} clinical={clinical} pet={pet} vetName={vetName(v.idVeterinario)} canWrite={canWrite} own={String(v.idVeterinario)===String(me?.idVeterinario)} onAction={onAction}/>):<p className="vax-empty">No hay aplicaciones registradas en este rango.</p>}</Panel>
    </div><aside className="vax-aside"><VaccineCalendar key={pet.idMascota} rows={current.rows.map(v=>({...v,proximaDosis:(!from||v.proximaDosis>=from)&&(!to||v.proximaDosis<=to)?v.proximaDosis:null,fechaAplicacion:(!from||v.fechaAplicacion>=from)&&(!to||v.fechaAplicacion<=to)?v.fechaAplicacion:null}))}/>
      {clinical?<><Panel title="Resumen del paciente" icon={FileText}><div className="vax-patient"><PetAvatar pet={pet} size={65}/><div><h3>{pet.nombre}</h3><p>{[pet.especie,pet.raza,pet.sexo].filter(Boolean).join(' · ')}</p><p>{historicalAge(pet.fechaNacimiento,limaToday())}</p></div></div><dl className="vax-patient-facts"><div><dt>Propietario</dt><dd>{pet.nombrePropietario||'No disponible'}</dd></div><div><dt>Último peso autorizado</dt><dd>{current.clinicalError?'No se pudieron consultar las mediciones.':weight.latest?`${weight.latest.weight} kg · ${vaccineDateLabel(weight.latest.date.slice(0,10))}`:'Sin medición disponible'}</dd></div><div><dt>Alergias</dt><dd>{!current.history?'No se pudo consultar la evaluación de alergias.':allergy.status==='known'?a.alergiasSustancias:allergy.status==='none'?allergy.label:'Sin información de alergias registrada.'}</dd></div></dl></Panel><Panel title={current.history?`Alertas clínicas (${alerts.length+expired.length})`:'Alertas clínicas'} icon={AlertCircle}>{!current.history&&<p className="vax-empty" role="alert">No se pudieron consultar las alertas de antecedentes.</p>}{alerts.length||expired.length?<ul className="vax-alerts">{alerts.map((text,i)=><li key={`clinical-${i}`}>{text}</li>)}{expired.map(v=><li key={`dose-${v.idVacuna}`}>Dosis pendiente vencida: {v.nombre} · {vaccineDateLabel(v.proximaDosis)}</li>)}</ul>:current.history?<p className="vax-empty">No hay alertas clínicas registradas para este paciente.</p>:null}</Panel></>:<Panel title={next?'Preparación para la próxima visita':'Preparación para una futura visita'} icon={FileText} subtitle="Te recomendamos tener en cuenta lo siguiente:"><div className="vax-preparation">{[[FileText,'Lleva la cartilla de vacunación.'],[Heart,'Si tu mascota estuvo enferma, comunícalo antes de la cita.'],[ShieldCheck,'Observa cualquier reacción posterior e informa al veterinario si ocurre.']].map(([Icon,text])=><p key={text}><Icon size={20}/>{text}</p>)}</div><p className="vax-footnote">Orientación general. Una dosis prevista no constituye una cita confirmada.</p></Panel>}
    </aside></div>
    {form&&<VaccineEditor key={`${form.mode}-${form.item?.idVacuna||'new'}`} mode={form.mode} item={form.item} pet={pet} vet={me} attentions={attentions} scheduled={ownScheduled} onClose={()=>setForm(null)} onDone={()=>{setForm(null);setSuccess('Registro guardado correctamente.');notifyVaccinesChanged(pet.idMascota)}}/>}
  </>
}
function VaccineWorkspace({user}){
  const location=useLocation()
  const [list,setList]=useState(null),[id,setId]=useState(()=>new URLSearchParams(location.search).get('paciente')||''),[revision,setRevision]=useState(0),[from,setFrom]=useState(''),[to,setTo]=useState('')
  const clinical=user?.role==='VETERINARIO'
  useEffect(()=>{
    const controller=new AbortController()
    Promise.all([api.get('/mascotas',{signal:controller.signal}),api.get('/veterinarios',{signal:controller.signal}),clinical?api.get('/veterinarios/me',{signal:controller.signal}):Promise.resolve({data:null})]).then(([pets,vets,me])=>{if(!controller.signal.aborted)setList({revision,pets:collection(pets.data),vets:collection(vets.data),me:me.data})}).catch(error=>{if(!controller.signal.aborted)setList({revision,error})})
    return()=>controller.abort()
  },[clinical,revision])
  const current=list?.revision===revision?list:null,pets=current?.pets||[],selected=pets.find(p=>String(p.idMascota)===id)||pets[0],selectedId=String(selected?.idMascota||'')
  const owners=[...new Map(pets.map(p=>[String(p.idPropietario),{value:p.idPropietario,label:p.nombrePropietario||'Propietario no disponible'}])).values()]
  function choose(value){setId(String(value))}
  return <section className={`vax-page ${clinical?'vet':'owner'}`}><header className="vax-page-header"><h1>Vacunas</h1><p>{clinical?'Programa, registra y da seguimiento a las vacunas de tus pacientes.':user?.role==='ADMIN'?'Consulta las dosis aplicadas y programadas de los pacientes autorizados.':'Consulta las dosis aplicadas y programadas de tus mascotas.'}</p></header>
    {!current?<p role="status" className="vax-feedback">Cargando pacientes autorizados…</p>:current.error?<div role="alert" className="vax-feedback"><p>{vaccineError(current.error)}</p><button onClick={()=>setRevision(v=>v+1)}>Reintentar</button></div>:!pets.length?<p className="vax-empty">No hay mascotas autorizadas disponibles.</p>:<><div className="vax-filters"><label>{clinical?'Paciente':'Mascota'}<div className="vax-pet-select"><PetAvatar pet={selected} size={32}/><PrettySelect label={clinical?'Paciente':'Mascota'} value={selectedId} onChange={choose} required keyboardNavigation options={pets.map(p=>({value:p.idMascota,label:p.nombre}))}/></div></label>{clinical&&<><label>Propietario<PrettySelect label="Propietario del paciente" value={String(selected.idPropietario)} onChange={owner=>choose(pets.find(p=>String(p.idPropietario)===owner).idMascota)} required keyboardNavigation options={owners}/></label><label>Desde<input className="input" type="date" aria-label="Desde" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)}/></label><label>Hasta<input className="input" type="date" aria-label="Hasta" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)}/></label></>}</div>{from&&to&&from>to?<p className="vax-feedback" role="alert">La fecha Desde no puede ser posterior a Hasta.</p>:<PatientVaccines key={selectedId} pet={selected} vets={current.vets} me={current.me} role={user.role} from={from} to={to}/>}</>}
  </section>
}
export default function Vacunas(){const {user}=useAuth();return <VaccineWorkspace key={`${user?.idUsuario}-${user?.role}`} user={user}/>}
