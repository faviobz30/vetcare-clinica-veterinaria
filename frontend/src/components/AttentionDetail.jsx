import {api} from '../lib/api'
import {vaccineError} from '../lib/vaccines'
import {vaccineDateLabel} from '../lib/ownerHistory'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, FileText, HeartPulse, Info, MessageCircle, Pill, UserRound, Weight, X } from 'lucide-react'
import PetAvatar from './PetAvatar'
import { attentionDate, historicalAge } from '../lib/attentions'

function AttentionVaccines({attention,petId}) {
  const [loaded,setLoaded]=useState(null),[revision,setRevision]=useState(0)
  useEffect(()=>{
    const controller=new AbortController()
    api.get(`/vacunas/mascota/${petId}`,{signal:controller.signal}).then(({data})=>{
      if(!Array.isArray(data))throw Error('Respuesta de vacunas inesperada.')
      if(!controller.signal.aborted)setLoaded({rows:data.filter(v=>String(v.idMascota)===String(petId)&&String(v.idAtencion)===String(attention)&&v.fechaAplicacion)})
    }).catch(error=>{if(!controller.signal.aborted)setLoaded({error:vaccineError(error)})})
    return()=>controller.abort()
  },[attention,petId,revision])
  return <section className="attention-clinical-block"><div><h3>Vacunas aplicadas en esta atención</h3>{!loaded?<p role="status">Consultando vacunas…</p>:loaded.error?<div role="alert"><p>{loaded.error}</p><button className="attention-outline" onClick={()=>{setLoaded(null);setRevision(v=>v+1)}}>Reintentar vacunas</button></div>:!loaded.rows.length?<p>No hay aplicaciones vinculadas a esta atención.</p>:loaded.rows.map(v=><div key={v.idVacuna} className="py-2"><strong>{v.nombre}</strong><p>Aplicación: {vaccineDateLabel(v.fechaAplicacion)}</p>{v.fechaProgramada&&<p>Programada originalmente: {vaccineDateLabel(v.fechaProgramada)}</p>}<p>Próxima dosis: {v.proximaDosis?vaccineDateLabel(v.proximaDosis):'No programada'}</p>{v.observaciones&&<p>{v.observaciones}</p>}</div>)}</div></section>
}

function ClinicalBlock({ title, icon: Icon, text }) {
  return <section className="attention-clinical-block"><span className="attention-block-icon"><Icon size={23}/></span><div><h3>{title}</h3><p>{text || 'No registrado'}</p></div></section>
}

export default function AttentionDetail({ state, row, onClose, onRetry }) {
  const panel = useRef(null)
  const close = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus({ preventScroll: true })
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const elements = [...panel.current.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')]
        const first = elements[0], last = elements.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [onClose])
  const a = row?.attention
  const age = historicalAge(row?.pet?.fechaNacimiento, a?.fechaAtencion)
  return createPortal(<div className="attention-overlay"><section ref={panel} className="attention-modal" role="dialog" aria-modal="true" aria-labelledby="attention-detail-title" aria-describedby="attention-detail-description">
    <header className="attention-modal-header"><div><h2 id="attention-detail-title">Detalle de atención</h2><p id="attention-detail-description">Información completa de la consulta realizada.</p></div><button ref={close} type="button" className="attention-close" aria-label="Cerrar detalle" onClick={onClose}><X size={24}/></button></header>
    {state.loading ? <p className="attention-feedback" role="status">Cargando el detalle de la atención…</p> : state.error ? <div className="attention-feedback attention-error" role="alert"><p>{state.error}</p><button className="attention-outline" onClick={onRetry}>Reintentar detalle</button></div> : a && <>
      <div className="attention-patient-strip"><div className="attention-patient"><PetAvatar pet={row.pet} size={58} className="attention-pet-avatar"/><div><h3>{row.pet?.nombre || 'Mascota no disponible'}</h3><p>{[row.pet?.especie, row.pet?.raza].filter(Boolean).join(' · ') || 'Especie y raza no disponibles'}</p></div></div><div className="attention-strip-meta"><p><CalendarDays size={18}/><span>{attentionDate(a.fechaAtencion, 'long')} · {attentionDate(a.fechaAtencion, 'time')}</span></p><p><UserRound size={18}/><span><strong>{row.vetName}</strong>{row.vet?.especialidad ? ` · ${row.vet.especialidad}` : ''}</span></p>{row.vet?.nroColegiatura && <p className="attention-credential">Colegiatura: {row.vet.nroColegiatura}</p>}</div><div className="attention-strip-measures"><p><Weight size={19}/>{a.peso == null ? 'No disponible' : `${a.peso} kg`}</p><p><CalendarDays size={19}/>{age}</p></div></div>
      <div className="attention-clinical-content"><ClinicalBlock title="Diagnóstico" icon={FileText} text={a.diagnostico}/><ClinicalBlock title="Síntomas" icon={HeartPulse} text={a.sintoma}/><ClinicalBlock title="Tratamiento" icon={Pill} text={a.tratamiento}/><ClinicalBlock title="Observaciones y recomendaciones" icon={MessageCircle} text={a.observacion}/>{row.cita?.motivoCita && <ClinicalBlock title="Motivo de consulta registrado en la cita" icon={Info} text={row.cita.motivoCita}/>}</div>
      {row.pet?.idMascota&&<AttentionVaccines key={a.idAtencion} attention={a.idAtencion} petId={row.pet.idMascota}/>}
      <section className="attention-additional"><Info size={22}/><div><h3>Información adicional</h3><div className="attention-additional-content"><span>Estado <span className="attention-status"><CheckCircle2 size={16}/>Registrada</span></span>{a.idHistoria != null && <Link to="/panel/historias" onClick={onClose}>Consultar el historial clínico{row.pet?.nombre ? ` de ${row.pet.nombre}` : ''}</Link>}</div></div></section>
    </>}
  </section></div>, document.body)
}
