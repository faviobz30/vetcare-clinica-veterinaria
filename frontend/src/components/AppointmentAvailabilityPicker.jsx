import {useEffect,useRef,useState} from 'react'
import {CalendarDays,ChevronDown,ChevronLeft,ChevronRight} from 'lucide-react'
import {api} from '../lib/api'
import {limaToday} from '../lib/clinicalHistory'
import {NO_SLOTS,reservableDay,clinicTime,availabilityError} from '../lib/appointmentAvailability'
const pad=n=>String(n).padStart(2,'0')
const monthName=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric',timeZone:'UTC'})
export default function AppointmentAvailabilityPicker({value,onChange,vet,exclude,revision,busy,onLoaded}){
 const today=limaToday(),[day,setDay]=useState(value?.slice(0,10)||today),[open,setOpen]=useState(false),[view,setView]=useState((value||today).slice(0,7)),[result,setResult]=useState(null),[retry,setRetry]=useState(0),root=useRef(null)
 const key=`${vet}|${day}|${revision}|${retry}`,current=result?.key===key?result:null
 useEffect(()=>{const close=e=>{if(!root.current?.contains(e.target))setOpen(false)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[])
 useEffect(()=>{
  if(!vet)return
  const controller=new AbortController()
  api.get('/citas/disponibilidad',{params:{idVeterinario:vet,fecha:day,...(exclude?{excluirCita:exclude}:{})},signal:controller.signal}).then(({data})=>{
   if(String(data.idVeterinario)!==String(vet)||data.fecha!==day||data.zonaHoraria!=='America/Lima'||!Array.isArray(data.horarios))throw Error('Respuesta de disponibilidad inesperada.')
   if(!controller.signal.aborted){setResult({key,data});onLoaded(data)}
  }).catch(error=>{if(!controller.signal.aborted){setResult({key,error:availabilityError(error)});onLoaded(null)}})
  return()=>controller.abort()
 },[vet,day,exclude,revision,retry,key,onLoaded])
 const [year,month]=view.split('-').map(Number),offset=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7,count=new Date(Date.UTC(year,month,0)).getUTCDate()
 const move=delta=>{const d=new Date(Date.UTC(year,month-1+delta,1));setView(`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}`)}
 const chooseDay=chosen=>{setDay(chosen);onChange('')}
 const data=current?.data,serverToday=data?.horaServidor?.slice(0,10)||today
 return <div className="appointment-availability" ref={root} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false)}}}>
  <button type="button" className="vet-datetime-trigger" aria-label="Fecha y hora (Lima) *" aria-expanded={open} disabled={busy} onClick={()=>setOpen(v=>!v)}><CalendarDays size={19}/><span>{value?`${value.slice(0,10).split('-').reverse().join('/')} · ${clinicTime(value)}`:'Seleccionar fecha y horario disponible'}</span><ChevronDown size={18}/></button>
  {open&&<div className="appointment-availability-content">
   <div className="vet-datetime-heading"><strong>{monthName.format(new Date(Date.UTC(year,month-1,1)))}</strong><div className="vet-datetime-nav"><button type="button" aria-label="Mes anterior" onClick={()=>move(-1)}><ChevronLeft size={19}/></button><button type="button" aria-label="Mes siguiente" onClick={()=>move(1)}><ChevronRight size={19}/></button></div></div>
   <div className="vet-datetime-grid">{['L','M','M','J','V','S','D'].map((w,i)=><span key={i} className="vet-datetime-weekday">{w}</span>)}{Array.from({length:offset+count},(_,i)=>{if(i<offset)return <span key={i}/>;const d=i-offset+1,chosen=`${view}-${pad(d)}`;return <button key={i} type="button" className={`vet-datetime-day${day===chosen?' is-selected':''}`} aria-label={chosen} aria-pressed={day===chosen} disabled={busy||!reservableDay(chosen,serverToday)} onClick={()=>chooseDay(chosen)}>{d}</button>})}</div>
   <dl className="appointment-hours"><div><dt>Horario de atención</dt><dd>Lunes a sábado · {clinicTime(data?.apertura||'08:00')} – {clinicTime(data?.cierre||'20:00')}</dd></div><div><dt>Duración de la consulta</dt><dd>30 min</dd></div></dl>
   <section className="appointment-slot-section" aria-label="Disponibilidad horaria"><h3>Horarios para {day.split('-').reverse().join('/')}</h3>
   {!vet?<p role="status">Selecciona un veterinario para consultar sus horarios.</p>:!current?<p role="status">Consultando disponibilidad…</p>:current.error?<div className="appointment-slot-error" role="alert"><strong>No se pudieron cargar los horarios</strong><p>{current.error}</p><button type="button" className="btn btn-ghost" onClick={()=>setRetry(v=>v+1)}>Reintentar</button></div>:<>
    <div className="appointment-slot-legend"><span>Disponible</span><span>No disponible</span></div><div className="appointment-slots">{data.horarios.map(slot=><button type="button" key={slot.inicio} disabled={busy||!slot.disponible} aria-pressed={value?.slice(0,16)===slot.inicio.slice(0,16)} title={slot.disponible?'Disponible':'No disponible'} onClick={()=>{onChange(slot.inicio.slice(0,16));setOpen(false)}}>{clinicTime(slot.inicio)}{!slot.disponible&&<span className="sr-only"> No disponible</span>}</button>)}</div>
    {!data.horarios.some(s=>s.disponible)&&<p role="status">{NO_SLOTS}</p>}
   </>}
   </section>
  </div>}
 </div>
}
