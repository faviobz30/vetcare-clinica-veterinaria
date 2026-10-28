import {pendingDoseRows} from './vaccineDoses.js'
import { limaToday } from './clinicalHistory.js'
import { appointmentDay } from './vetAgenda.js'
export function vaccineLists(rows, { from='', to='', oldest=false }={}) {
  const within = date => date && (!from || date>=from) && (!to || date<=to)
  return {
    upcoming: pendingDoseRows(rows).filter(v=>within(v.proximaDosis)).sort((a,b)=>a.proximaDosis.localeCompare(b.proximaDosis)),
    applied: rows.filter(v=>within(v.fechaAplicacion)).sort((a,b)=>(oldest?1:-1)*a.fechaAplicacion.localeCompare(b.fechaAplicacion)),
  }
}
export function vaccineEvents(rows) {
  const pending=new Set(pendingDoseRows(rows).map(v=>String(v.idVacuna)))
  return rows.flatMap(v=>[
    ...(v.proximaDosis&&pending.has(String(v.idVacuna))?[{key:`next-${v.idVacuna}`,date:v.proximaDosis,type:'programada',vaccine:v}]:[]),
    ...(v.fechaAplicacion?[{key:`applied-${v.idVacuna}`,date:v.fechaAplicacion,type:'aplicada',vaccine:v}]:[]),
  ]).sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key))
}
export function monthDays(month) {
  const [year,m]=month.split('-').map(Number),start=new Date(Date.UTC(year,m-1,1)),count=new Date(Date.UTC(year,m,0)).getUTCDate()
  const offset=(start.getUTCDay()+6)%7
  return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i>=offset&&i<offset+count?`${month}-${String(i-offset+1).padStart(2,'0')}`:null)
}
export function moveMonth(month,delta) {const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-1+delta,1)).toISOString().slice(0,7)}
export function patientAttentions(attentions,historyId,vetId) {
  if(historyId==null||vetId==null)return []
  return attentions.filter(a=>String(a.idHistoria)===String(historyId)&&String(a.idVeterinario)===String(vetId))
    .sort((a,b)=>b.fechaAtencion.localeCompare(a.fechaAtencion))
}
export function vaccineError(error) {
  const status=error?.response?.status
  const fallback={400:'Revisa los datos del formulario.',401:'Tu sesión expiró. Vuelve a iniciar sesión.',403:'No tienes permiso para modificar este registro.',404:'El registro ya no está disponible.',409:'El registro cambió o ya fue aplicado. Actualiza las vacunas.'}
  const data=error?.response?.data
  if(data?.campos)return Object.values(data.campos).join(' · ')
  const generic=['Conflict','Forbidden','Unauthorized','Bad Request','Not Found','Internal Server Error']
  const message=typeof data?.error==='string'&&!generic.includes(data.error)?data.error:null
  return message||fallback[status]||(error?.request?'No se pudo contactar al servidor. Intenta nuevamente.':error?.message)||'No se pudo completar la operación.'
}
export function validateVaccineForm(mode,values,attentions,today=limaToday()) {
  if(mode==='note')return ''
  if(mode==='schedule'||mode==='edit'||mode==='reschedule') {
    if(!values.nombre?.trim())return 'Indica el nombre de la vacuna.'
    if(!values.proximaDosis||values.proximaDosis<today)return 'Selecciona una fecha de dosis desde hoy (Lima).'
  }else{
    const attention=attentions.find(a=>String(a.idAtencion)===String(values.idAtencion))
    if(!attention)return 'Selecciona una atención autorizada del paciente.'
    if(!values.fechaAplicacion||values.fechaAplicacion>today)return 'Selecciona una fecha de aplicación válida.'
    if(mode==='apply'&&values.fechaAplicacion!==appointmentDay(attention.fechaAtencion))return 'La aplicación debe corresponder al día de la atención.'
    if(mode==='direct'&&(!values.nombre?.trim()||values.fechaAplicacion>appointmentDay(attention.fechaAtencion)))return 'Revisa el nombre y la fecha de la atención.'
    if(values.proximaDosis&&(values.proximaDosis<today||values.proximaDosis<=values.fechaAplicacion))return 'La próxima dosis debe ser posterior a la aplicación y no estar vencida.'
  }
  return ''
}
export const VACCINES_CHANGED='vetcare-vaccines-changed'
export function notifyVaccinesChanged(id) { window.dispatchEvent(new CustomEvent(VACCINES_CHANGED,{detail:{id:String(id)}})) }
