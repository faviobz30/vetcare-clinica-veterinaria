import {useRef,useState} from 'react'
import {CalendarDays,ChevronLeft,ChevronRight} from 'lucide-react'
import {monthDays,moveMonth} from '../lib/vaccines'
import {limaToday} from '../lib/clinicalHistory'
import {vaccinationDateLabel} from '../lib/clinicalVaccination'

// Calendario de fecha (sin hora), limitado a esta sección clínica.
export default function VaccinationDate({value='',onChange,label,required=false,min,max}) {
  const [open,setOpen]=useState(false),[month,setMonth]=useState((value||min||max||limaToday()).slice(0,7))
  const trigger=useRef(null)
  const valid=!!value&&(!min||value>=min)&&(!max||value<=max)
  const title=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`))
  function choose(date){onChange(date);setOpen(false);trigger.current?.focus()}
  return <div className="clinical-vaccine-date" onKeyDown={e=>{if(open&&e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.current?.focus()}}}>
    <button ref={trigger} type="button" className="input clinical-vaccine-date-trigger" aria-label={label} aria-expanded={open} onClick={()=>{if(!open)setMonth((value||min||max||limaToday()).slice(0,7));setOpen(v=>!v)}}><CalendarDays size={18}/>{value?vaccinationDateLabel(value):'Seleccionar fecha'}</button>
    {required&&<input className="vet-select-validation" type="text" tabIndex={-1} aria-hidden="true" required value={valid?value:''} onChange={()=>{}}/>}
    {open&&<section className="clinical-vaccine-calendar" aria-label={`Calendario: ${label}`}><div className="clinical-vaccine-calendar-heading"><strong>{title}</strong><div><button type="button" aria-label="Mes anterior" disabled={!!min&&month<=min.slice(0,7)} onClick={()=>setMonth(moveMonth(month,-1))}><ChevronLeft size={18}/></button><button type="button" aria-label="Mes siguiente" disabled={!!max&&month>=max.slice(0,7)} onClick={()=>setMonth(moveMonth(month,1))}><ChevronRight size={18}/></button></div></div><div className="clinical-vaccine-calendar-grid">{['L','M','M','J','V','S','D'].map((d,i)=><span key={i}>{d}</span>)}{monthDays(month).map((date,i)=>date?<button type="button" key={date} aria-label={vaccinationDateLabel(date)} aria-pressed={value===date} disabled={(!!min&&date<min)||(!!max&&date>max)} onClick={()=>choose(date)}>{Number(date.slice(8))}</button>:<span key={`empty-${i}`}/>)}</div><div className="clinical-vaccine-calendar-footer"><button type="button" onClick={()=>choose('')}>Borrar</button><button type="button" onClick={()=>{setOpen(false);trigger.current?.focus()}}>Cerrar calendario</button></div></section>}
  </div>
}
