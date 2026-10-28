import {appointmentTime} from './vetAgenda.js'
import {fullName} from './display.js'
export const FUTURE_ATTENTION_HELP='Podrás registrar la atención durante el horario autorizado de la cita.'
export const cancellationReasons=['Inconveniente con el horario.','Motivos personales.','Ya no necesito la consulta.','Otro motivo.']
export function attentionWindow(cita,now=Date.now()) {
 const start=appointmentTime(cita?.fechaCita),end=start+30*60000
 const active=cita?.estado==='CONFIRMADA',future=Number.isFinite(start)&&now<start,expired=Number.isFinite(start)&&now>=end
 const approved=active&&expired&&cita.regularizacion?.estado==='APROBADA'&&appointmentTime(cita.regularizacion.venceEn)>now
 return {future,expired,canStart:active&&!!cita.puedeIniciarAtencion&&(!expired||approved)&&!future,canSave:active&&!future&&!!cita.puedeGuardarAtencion&&(!expired||approved||now<=appointmentTime(cita.finRegistroAtencion)),request:active&&expired&&!['PENDIENTE','APROBADA'].includes(cita.regularizacion?.estado),noShow:['PENDIENTE','CONFIRMADA'].includes(cita?.estado)&&expired}
}
export function validateCancellation(body){if(!cancellationReasons.includes(body?.motivo))return 'Selecciona un motivo de cancelación.';if(body.motivo==='Otro motivo.'&&!body.descripcion?.trim())return 'Describe el otro motivo.';if((body.descripcion||'').length>500)return 'La descripción admite hasta 500 caracteres.';return ''}
export function clinicalPayload(values,cita,history,role){
 const payload={peso:Number(values.peso),sintoma:values.sintoma,diagnostico:values.diagnostico,tratamiento:values.tratamiento,observacion:values.observacion||undefined}
 if(cita){payload.idCita=Number(cita.idCita);payload.idVeterinario=Number(cita.idVeterinario);payload.idHistoria=Number(history)}
 if(role==='ADMIN' && values.precioAtencion!=='' && values.precioAtencion!=null)payload.precioAtencion=Number(values.precioAtencion)
 return payload
}

export function professionalName(vet) {
 const name=fullName(vet)
 if(!name)return ''
 return [['Dr.','Dra.'].includes(vet?.tratamientoProfesional)?vet.tratamientoProfesional:'',name].filter(Boolean).join(' ')
}
export function validateClinicalValues(values) {
 const errors={}
 if(!Number.isFinite(Number(values.peso))||Number(values.peso)<=0)errors.peso='Indica un peso mayor a 0.'
 for(const [key,label] of [['sintoma','Los síntomas'],['diagnostico','El diagnóstico'],['tratamiento','El tratamiento'],['observacion','Las observaciones']]) {
  const value=values[key]||''
  if(key!=='observacion'&&!value.trim())errors[key]=key==='sintoma'?'Los síntomas son obligatorios.':key==='diagnostico'?'El diagnóstico es obligatorio.':'El tratamiento es obligatorio.'
  else if(value.length>500)errors[key]=`${label} admiten hasta 500 caracteres.`
 }
 return errors
}
