import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react'

const weekdays = ['L','M','M','J','V','S','D']
const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const pad = (v) => String(v).padStart(2, '0')
function parseValue(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  return m ? { year:+m[1], month:+m[2]-1, day:+m[3], hour:+m[4], minute:+m[5] } : null
}
function stringify(v) { return `${v.year}-${pad(v.month+1)}-${pad(v.day)}T${pad(v.hour)}:${pad(v.minute)}` }
export default function VetDateTimePicker({ value='', onChange, required=false, label='Fecha y hora' }) {
  const parsed = parseValue(value)
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => new Date(parsed?.year ?? now.getFullYear(), parsed?.month ?? now.getMonth(), 1))
  const [draft, setDraft] = useState(() => parsed || {year:now.getFullYear(),month:now.getMonth(),day:now.getDate(),hour:9,minute:0})
  const root = useRef(null)
  useEffect(() => {
    const outside = e => { if (!root.current?.contains(e.target)) setOpen(false) }
    const escape = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [])
  const cells = useMemo(() => {
    const year=view.getFullYear(), month=view.getMonth()
    const offset=(new Date(year,month,1).getDay()+6)%7
    const count=new Date(year,month+1,0).getDate()
    return [...Array(offset).fill(null),...Array.from({length:count},(_,i)=>i+1)]
  },[view])
  const display = parsed ? new Date(parsed.year,parsed.month,parsed.day,parsed.hour,parsed.minute).toLocaleString('es-PE',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}) : ''
  const changeMonth = delta => setView(v => new Date(v.getFullYear(),v.getMonth()+delta,1))
  const show = () => {
    const selection=parseValue(value)
    if(selection) {setDraft(selection);setView(new Date(selection.year,selection.month,1))}
    setOpen(o=>!o)
  }
  const apply = () => {onChange(stringify(draft));setOpen(false)}
  return <div className="vet-datetime" ref={root}>
    <button type="button" className="vet-datetime-trigger" aria-label={label} aria-expanded={open} aria-haspopup="dialog" onClick={show}>
      <CalendarDays size={19}/><span className={display?'':'vet-datetime-placeholder'}>{display || 'Seleccionar fecha y hora'}</span><ChevronDown className="vet-datetime-chevron" size={18}/>
    </button>

    {open && <div className="vet-datetime-popover" role="dialog" aria-label="Elegir fecha y hora">
      <div className="vet-datetime-layout">
        <div className="vet-datetime-calendar">
          <div className="vet-datetime-heading"><strong>{months[view.getMonth()]} de {view.getFullYear()}</strong><div className="vet-datetime-nav"><button type="button" aria-label="Mes anterior" onClick={()=>changeMonth(-1)}><ChevronLeft size={19}/></button><button type="button" aria-label="Mes siguiente" onClick={()=>changeMonth(1)}><ChevronRight size={19}/></button></div></div>
          <div className="vet-datetime-grid">{weekdays.map((w,i)=><span key={i} className="vet-datetime-weekday">{w}</span>)}{cells.map((d,i)=>d ? <button type="button" key={i} className={'vet-datetime-day'+(d===draft.day && view.getMonth()===draft.month && view.getFullYear()===draft.year?' is-selected':'')} aria-label={`${d} de ${months[view.getMonth()]} de ${view.getFullYear()}`} aria-pressed={d===draft.day && view.getMonth()===draft.month && view.getFullYear()===draft.year} onClick={()=>setDraft(v=>({...v,year:view.getFullYear(),month:view.getMonth(),day:d}))}>{d}</button>:<span key={i}/>)}</div>
        </div>
        <div className="vet-datetime-time"><span className="vet-datetime-time-title">Hora de la cita</span><div className="vet-datetime-time-row"><label>Hora<select aria-label="Hora" value={pad(draft.hour)} onChange={e=>setDraft(v=>({...v,hour:+e.target.value}))}>{Array.from({length:24},(_,i)=><option key={i} value={pad(i)}>{pad(i)}</option>)}</select></label><span>:</span><label>Minutos<select aria-label="Minutos" value={pad(draft.minute)} onChange={e=>setDraft(v=>({...v,minute:+e.target.value}))}>{Array.from({length:60},(_,i)=><option key={i} value={pad(i)}>{pad(i)}</option>)}</select></label></div><p>Selecciona la fecha y hora de tu cita.</p></div>
      </div>
      <div className="vet-datetime-footer"><button type="button" className="vet-datetime-clear" onClick={()=>{onChange('');setOpen(false)}}>Borrar</button><div><button type="button" className="vet-datetime-cancel" onClick={()=>setOpen(false)}>Cancelar</button><button type="button" className="vet-datetime-apply" onClick={apply}><Check size={16}/> Aplicar</button></div></div>
    </div>}
  </div>
}
