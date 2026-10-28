import {useState} from 'react'
import {X} from 'lucide-react'
import AppointmentModal from './AppointmentModal'
import {attentionDate} from '../lib/attentions'
import {cancellationReasons,validateCancellation} from '../lib/clinicalAppointments'
export default function CitaOperationDialog({operation,onClose,onConfirm,busy,error,pet}){
 const [motivo,setMotivo]=useState(''),[descripcion,setDescripcion]=useState(''),[localError,setLocalError]=useState('')
 const cancel=operation.type==='cancelar',request=operation.type==='regularizaciones',noShow=operation.type==='no-asistio'
 const title=cancel?'Cancelar cita':request?'Solicitar regularización':noShow?'Marcar no asistió':'Confirmar cita'
 function submit(event){event.preventDefault();let payload
  if(cancel){payload={motivo,descripcion:descripcion.trim()||undefined};const problem=validateCancellation(payload);if(problem){setLocalError(problem);return}}
  if(request){if(!descripcion.trim()){setLocalError('Indica el motivo del registro tardío.');return}payload={motivo:descripcion.trim()}}
  setLocalError('');onConfirm(payload)
 }
 return <AppointmentModal onClose={onClose} blocked={busy}><div className="appointments-overlay"><section className="appointments-dialog" role="dialog" aria-modal="true" aria-labelledby="cita-operation-title"><header><h2 id="cita-operation-title">{title}</h2><button disabled={busy} onClick={onClose} aria-label="Cerrar"><X size={20}/></button></header><form onSubmit={submit}>
 {cancel&&<div className="cita-operation-context"><strong>{pet?.nombre||'Paciente no disponible'}</strong><span>{attentionDate(operation.item.fechaCita)} · {attentionDate(operation.item.fechaCita,'time')}</span><p>{operation.item.motivoCita||'Motivo de consulta no registrado'}</p></div>}
 <p>{cancel?'Indica el motivo de la cancelación para ayudarnos a mejorar nuestro servicio.':noShow?'¿Confirmas que el paciente no asistió a esta cita?':request?'Explica por qué necesitas registrar esta atención fuera de plazo. ADMIN debe autorizarla.':`¿Deseas confirmar la cita de ${pet?.nombre||'este paciente'}?`}</p>
 {cancel&&<label className="cita-operation-field">Motivo<select required value={motivo} onChange={e=>setMotivo(e.target.value)} disabled={busy}><option value="">Selecciona un motivo</option>{cancellationReasons.map(reason=><option key={reason}>{reason}</option>)}</select></label>}
 {(request||(cancel&&motivo==='Otro motivo.'))&&<label className="cita-operation-field">{request?'Motivo del registro tardío':'Descripción adicional'}<textarea required maxLength={500} rows={4} value={descripcion} onChange={e=>setDescripcion(e.target.value)} disabled={busy}/></label>}
 {(error||localError)&&<p className="appointments-error" role="alert">{error||localError}</p>}<footer><button type="button" disabled={busy} onClick={onClose}>Volver</button><button disabled={busy} className={cancel?'appointments-danger':'appointments-primary'}>{busy?'Guardando…':cancel?'Confirmar cancelación':request?'Enviar solicitud':noShow?'Confirmar inasistencia':'Confirmar cita'}</button></footer></form></section></div></AppointmentModal>
}
