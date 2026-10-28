import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { limaToday } from '../lib/clinicalHistory'
import { monthDays, moveMonth, vaccineEvents } from '../lib/vaccines'
import { vaccineDateLabel } from '../lib/ownerHistory'
export default function VaccineCalendar({ rows }) {
  const today=limaToday(),[month,setMonth]=useState(today.slice(0,7)),[day,setDay]=useState('')
  const events=vaccineEvents(rows),selected=events.filter(e=>e.date===day)
  const label=new Intl.DateTimeFormat('es-PE',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`)).replace(' de ',' ')
  return <section className="vax-panel"><h2><CalendarDays size={21}/>Calendario de vacunas</h2><div className="vax-month"><button type="button" aria-label="Mes anterior" onClick={()=>{setMonth(m=>moveMonth(m,-1));setDay('')}}><ChevronLeft size={17}/></button><strong>{label}</strong><button type="button" aria-label="Mes siguiente" onClick={()=>{setMonth(m=>moveMonth(m,1));setDay('')}}><ChevronRight size={17}/></button></div>
    <div className="vax-calendar">{['L','M','M','J','V','S','D'].map((d,i)=><span key={`week-${i}`} className="vax-weekday">{d}</span>)}{monthDays(month).map((date,i)=>{
      const matches=events.filter(e=>e.date===date),planned=matches.some(e=>e.type==='programada'),applied=matches.some(e=>e.type==='aplicada')
      return date?<button key={date} type="button" aria-label={`${vaccineDateLabel(date)}${planned?', dosis programada':''}${applied?', aplicación registrada':''}`} aria-current={date===today?'date':undefined} aria-pressed={day===date} className={`${planned?'planned ':''}${applied?'applied ':''}${day===date?'selected':''}`} onClick={()=>setDay(date)}>{Number(date.slice(8))}{matches.length>0&&<i aria-hidden="true"/>}</button>:<span key={`blank-${i}`}/>
    })}</div><div className="vax-legend"><span><i className="planned"/>Dosis programada</span><span><i className="applied"/>Aplicación registrada</span></div>
    {day&&<div className="vax-day-events" aria-live="polite"><strong>{vaccineDateLabel(day)}</strong>{selected.length?<ul>{selected.map(e=><li key={e.key}>{e.vaccine.nombre} · {e.type==='aplicada'?'Aplicada':'Dosis prevista'}</li>)}</ul>:<p>Sin vacunas registradas para este día.</p>}</div>}
  </section>
}
