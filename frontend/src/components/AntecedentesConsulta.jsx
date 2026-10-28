import {useState} from 'react'
import {antecedentGroups,consultationAntecedentSections} from '../lib/antecedents'


export default function AntecedentesConsulta({history,editable,onEdit,onRefresh,busy,loading,error}){
 const [expanded,setExpanded]=useState(false)
 const a=history?.antecedentes
 const pending=!a||((!a.estadoAlergias||a.estadoAlergias==='NO_EVALUADAS')&&!['enfermedadesRelevantes','cirugiasPrevias','notasMedicas','alertasMedicas','alergiasSustancias','alergiasReacciones','alergiasObservaciones'].some(key=>a[key]?.trim()))
 return <section className="consultation-antecedents" aria-labelledby="consultation-antecedents-title"><header><div><h3 id="consultation-antecedents-title">Antecedentes del paciente</h3><p>Información importante para esta consulta.</p></div></header>
 {error?<div role="alert"><p>{error}</p><button type="button" className="btn btn-ghost" disabled={busy||loading} onClick={onRefresh}>Reintentar antecedentes</button></div>:loading?<p role="status">Cargando antecedentes…</p>:<>
 <p className={pending?'consultation-antecedents-pending':''}>{pending?'Los antecedentes de esta mascota están pendientes de evaluación.':'Consulta los antecedentes registrados antes de completar la atención.'}</p>
 {!expanded&&a&&!pending&&<div className="consultation-antecedents-summary">{consultationAntecedentSections(history).map(row=><p key={row.key}><strong>{row.title}</strong><span>{row.text}</span></p>)}</div>}
 <button type="button" className="btn btn-ghost consultation-antecedents-toggle" aria-expanded={expanded} disabled={busy} onClick={()=>setExpanded(v=>!v)}>{expanded?'Ocultar antecedentes':editable?'Revisar / completar antecedentes':'Revisar antecedentes'}</button>
 {expanded&&<div className="consultation-antecedents-grid">{consultationAntecedentSections(history).map(row=><article key={row.key}><h4>{row.title}</h4><p>{row.text}</p>{editable&&<button type="button" className="btn btn-ghost" disabled={busy} onClick={()=>onEdit(row.key)}>{antecedentGroups[row.key].title}</button>}</article>)}</div>}
 {a?.actualizadoEn&&<small>Última actualización: {a.actualizadoEn.replace('T',' ').slice(0,19)} · {a.veterinarioNombre||'Veterinario registrado'}</small>}
 </>}
 </section>
}
