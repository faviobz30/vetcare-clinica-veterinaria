import {useEffect,useState} from 'react'
import {api} from '../lib/api'
import {limaToday} from '../lib/clinicalHistory'
import {vaccineError} from '../lib/vaccines'
import PrettySelect from './PrettySelect'
import VaccinationDate from './VaccinationDate'
import {selectScheduledDose,vaccinationDateLabel} from '../lib/clinicalVaccination'
import './ClinicalVaccination.css'

export default function ClinicalVaccination({petId,vetId,rows,onChange,onPending,busy}) {
  const [loaded,setLoaded]=useState(null),[revision,setRevision]=useState(0)
  useEffect(()=>{
    const controller=new AbortController()
    api.get(`/vacunas/mascota/${petId}`,{signal:controller.signal}).then(({data})=>{
      if(!Array.isArray(data))throw Error('No se pudieron interpretar las vacunas pendientes.')
      const pending=data.filter(v=>String(v.idMascota)===String(petId)&&String(v.idVeterinario)===String(vetId)&&!v.fechaAplicacion)
      if(!controller.signal.aborted){setLoaded({pending});onPending(pending)}
    }).catch(error=>{if(!controller.signal.aborted)setLoaded({error:vaccineError(error)})})
    return()=>controller.abort()
  },[petId,vetId,revision,onPending])
  const pending=loaded?.pending||[]
  const change=(index,key,value)=>onChange(rows.map((r,i)=>i===index?{...r,[key]:value}:r))
  return <section className="clinical-vaccination sm:col-span-2" aria-label="Vacunación opcional"><h3>Vacunación <small>— Opcional</small></h3><p>Registra las vacunas administradas durante esta atención o programa próximas dosis.</p>
    {!loaded?<p role="status">Consultando dosis pendientes…</p>:loaded.error?<p role="alert">{loaded.error} <button type="button" disabled={busy} onClick={()=>{setLoaded(null);setRevision(v=>v+1)}}>Reintentar</button></p>:pending.length?<div className="clinical-vaccine-pending"><strong>{pending.length===1?'Vacuna pendiente':'Vacunas pendientes'} del paciente: {pending.length}</strong><ul>{pending.map(v=><li key={v.idVacuna}>{v.nombre}<span>Programada para el {vaccinationDateLabel(v.proximaDosis)}</span></li>)}</ul><small>Se muestran las dosis que puedes administrar con tus permisos actuales.</small></div>:<p>No hay vacunas pendientes a tu cargo.</p>}
    {!rows.length&&<p>Sin vacunación en esta atención.</p>}
    {rows.map((r,i)=><fieldset key={r.key} disabled={busy} className="clinical-vaccine-row"><legend>Vacuna {i+1}</legend><div className="clinical-vaccine-grid">
      <div className="clinical-vaccine-field"><span>¿Qué deseas hacer?</span><PrettySelect label={`¿Qué deseas hacer? Vacuna ${i+1}`} keyboardNavigation required value={r.tipo} onChange={tipo=>onChange(rows.map((v,n)=>n===i?{...v,tipo,idVacunaProgramada:'',nombre:'',observaciones:'',proximaDosis:''}:v))} options={[{value:'aplicada',label:'Registrar una vacuna aplicada'},{value:'programada',label:'Programar una vacuna futura'}]}/></div>
      {r.tipo==='aplicada'&&<div className="clinical-vaccine-field"><span>¿Qué vacuna se administró?</span><PrettySelect label={`¿Qué vacuna se administró? Vacuna ${i+1}`} keyboardNavigation required value={r.idVacunaProgramada||'nueva'} onChange={id=>onChange(rows.map((v,n)=>n===i?selectScheduledDose(v,id==='nueva'?'':id,pending):v))} options={[{value:'nueva',label:'Otra vacuna no programada'},...pending.filter(v=>String(v.idVacuna)===String(r.idVacunaProgramada)||!rows.some((other,n)=>n!==i&&String(other.idVacunaProgramada)===String(v.idVacuna))).map(v=>({value:v.idVacuna,label:`${v.nombre} — ${vaccinationDateLabel(v.proximaDosis)}`}))]}/></div>}
      {!r.idVacunaProgramada&&<label>Nombre de la vacuna<input className="input" required maxLength={120} value={r.nombre} onChange={e=>change(i,'nombre',e.target.value)}/></label>}
      {r.tipo==='aplicada'&&<div className="clinical-vaccine-field"><span>Fecha efectiva de aplicación</span><VaccinationDate label={`Fecha efectiva de aplicación. Vacuna ${i+1}`} required max={limaToday()} value={r.fechaAplicacion} onChange={value=>change(i,'fechaAplicacion',value)}/></div>}
      <div className="clinical-vaccine-field"><span>{r.tipo==='programada'?'Fecha programada de la vacuna':'Fecha de próxima dosis o refuerzo (opcional)'}</span><VaccinationDate label={`Fecha ${r.tipo==='programada'?'programada':'de próxima dosis'}. Vacuna ${i+1}`} required={r.tipo==='programada'} min={limaToday()} value={r.proximaDosis} onChange={value=>change(i,'proximaDosis',value)}/></div>
      <label className="clinical-vaccine-notes">Observaciones e indicaciones<textarea className="input" maxLength={500} rows={2} value={r.observaciones} placeholder={r.idVacunaProgramada?'Vacío conserva las indicaciones de la dosis seleccionada.':''} onChange={e=>change(i,'observaciones',e.target.value)}/></label>
    </div><button type="button" className="btn btn-ghost" onClick={()=>onChange(rows.filter((_,n)=>n!==i))}>Quitar vacuna</button></fieldset>)}
    <button type="button" className="btn btn-ghost" disabled={busy||rows.length>=20||!loaded||!!loaded.error} onClick={()=>onChange([...rows,{key:crypto.randomUUID(),tipo:'aplicada',idVacunaProgramada:'',nombre:'',fechaAplicacion:limaToday(),proximaDosis:'',observaciones:''}])}>{rows.length?'Agregar otra vacuna':'Agregar vacuna'}</button>
  </section>
}
