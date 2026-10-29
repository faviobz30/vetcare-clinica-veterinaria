import {useState} from 'react'
import {CheckCircle2,Trash2} from 'lucide-react'
import VetcareModal from './VetcareModal'
import PetAvatar from './PetAvatar'
import PrettySelect from './PrettySelect'
import {attentionDate} from '../lib/attentions'
import {professionalName,cancellationReasons,validateCancellation} from '../lib/clinicalAppointments'
import {citaLabels} from '../lib/adminAppointments'
export default function AdminCitaDialog({item,type='detalle',pet,vet,busy,error,onClose,onConfirm,onAttention}){
 const [motivo,setMotivo]=useState(''),[descripcion,setDescripcion]=useState(''),[problem,setProblem]=useState('')
 const detail=type==='detalle',cancel=type==='cancelar',remove=type==='eliminar'
 const title=detail?'Detalle de cita':remove?'¿Deseas eliminar esta cita?':cancel?'Cancelar cita':type==='no-asistio'?'Marcar no asistió':'Confirmar cita'
 function submit(e){e.preventDefault();const payload=cancel?{motivo,descripcion:descripcion.trim()||undefined}:undefined;const p=cancel?validateCancellation(payload):'';setProblem(p);if(!p)onConfirm(payload)}
 return <VetcareModal className="admin-cita-dialog" label={title} busy={busy} onClose={onClose}><h2>{title}</h2><p className="cita-dialog-subtitle">{detail?'Información de la consulta veterinaria':cancel?'La cita se conservará en el historial con estado Cancelada.':remove?'Revisa la información antes de continuar.':type==='no-asistio'?'Confirma que el paciente no asistió.':'¿Deseas confirmar esta cita?'}</p>
 <div className="admin-cita-patient"><PetAvatar pet={pet} size={52}/><div><strong>{pet?.nombre||'Mascota no disponible'}</strong><span>{pet?.nombrePropietario||'Propietario no disponible'}</span></div><span className={`admin-cita-badge state-${item.estado}`}>{citaLabels[item.estado]||item.estado}</span></div>
 <dl className="admin-cita-program"><div><dt>Fecha · Lima</dt><dd>{attentionDate(item.fechaCita)}</dd></div><div><dt>Hora · 30 minutos</dt><dd>{attentionDate(item.fechaCita,'time')}</dd></div><div><dt>Veterinario responsable</dt><dd>{professionalName(vet)||'No disponible'}</dd></div>{vet?.especialidad&&<div><dt>Especialidad</dt><dd>{vet.especialidad}</dd></div>}</dl>
 {detail?<><section className="admin-cita-note"><h3>Motivo de consulta</h3><p>{item.motivoCita||'No registrado'}</p></section>{item.motivoCancelacion&&<section className="admin-cita-note"><h3>Motivo de cancelación</h3><p>{item.motivoCancelacion} {item.detalleCancelacion}</p></section>}{error&&<p role="alert" className="admin-cita-error">{error}</p>}<footer>{onAttention&&<button className="btn btn-ghost" onClick={onAttention}>Ver atención clínica</button>}<button className="btn btn-ghost" onClick={onClose}>Cerrar</button></footer></>:<form onSubmit={submit}>
 {remove?<p className="admin-cita-notice destructive"><Trash2 size={20}/>Esta acción eliminará el registro de la cita si el sistema lo permite. Si deseas conservar su historial, utiliza Cancelar cita. No se puede deshacer.</p>:!cancel&&type!=='no-asistio'?<p className="admin-cita-notice positive"><CheckCircle2 size={19}/>La cita cambiará al estado Confirmada.</p>:null}
 {cancel&&<><fieldset disabled={busy} className="admin-cita-field"><legend>Motivo de cancelación</legend><PrettySelect keyboardNavigation label="Motivo de cancelación" value={motivo} onChange={setMotivo} placeholder="Selecciona un motivo" options={cancellationReasons.map(r=>({value:r,label:r}))}/></fieldset>{motivo==='Otro motivo.'&&<label className="admin-cita-field">Descripción adicional<textarea className="input" rows={3} maxLength={500} required disabled={busy} value={descripcion} onChange={e=>setDescripcion(e.target.value)}/></label>}</>}
 {(error||problem)&&<p role="alert" className="admin-cita-error">{error||problem}</p>}<footer><button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>{cancel?'Volver':'Cancelar'}</button><button disabled={busy} className={`btn ${remove?'cita-destructive':cancel?'btn-ghost':'cita-confirm'}`}>{busy?'Guardando…':remove?'Eliminar cita':cancel?'Cancelar cita':type==='no-asistio'?'Confirmar inasistencia':'Confirmar cita'}</button></footer></form>}
 </VetcareModal>
}
