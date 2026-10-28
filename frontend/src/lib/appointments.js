import { activeAppointment, appointmentDay, appointmentTime } from './vetAgenda.js'
import {attentionWindow} from './clinicalAppointments.js'
import { limaToday } from './clinicalHistory.js'
export const appointmentStates = ['PENDIENTE', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO']
export const sameAppointmentId = (a,b) => a != null && b != null && String(a) === String(b)
export function chronologicalAppointments(rows, descending=false) {
  return [...rows].sort((a,b)=>{
    const x=appointmentTime(a.fechaCita),y=appointmentTime(b.fechaCita)
    if(!Number.isFinite(x)||!Number.isFinite(y))return Number.isFinite(x)?-1:Number.isFinite(y)?1:0
    return (descending?y-x:x-y)||String(a.idCita).localeCompare(String(b.idCita))
  })
}
export function ownerAppointments(rows,{pet='',state='',now=Date.now()}={}) {
  const visible=rows.filter(c=>(!pet||sameAppointmentId(c.idMascota,pet))&&(!state||c.estado===state))
  const active=visible.filter(activeAppointment)
  const upcoming=chronologicalAppointments(active.filter(c=>appointmentTime(c.fechaCita)>now))
  const deadline=c=>appointmentTime(c.finRegistroAtencion)||(appointmentTime(c.fechaCita)+45*60000)
  return {
    counts:Object.fromEntries(appointmentStates.map(s=>[s,visible.filter(c=>c.estado===s).length])),
    next:upcoming[0],upcoming,
    inProgress:chronologicalAppointments(active.filter(c=>appointmentTime(c.fechaCita)<=now&&now<=deadline(c))),
    overdue:chronologicalAppointments(active.filter(c=>now>deadline(c)),true),
    attended:chronologicalAppointments(visible.filter(c=>c.estado==='ATENDIDA'),true),
    cancelled:chronologicalAppointments(visible.filter(c=>c.estado==='CANCELADA'),true),
    noShow:chronologicalAppointments(visible.filter(c=>c.estado==='NO_ASISTIO'),true),
    closed:chronologicalAppointments(visible.filter(c=>['CANCELADA','NO_ASISTIO'].includes(c.estado)),true),
  }
}
export function vetAppointments(rows,pets,{tab='hoy',date='',query='',period='',descending=false,now=Date.now()}={}) {
  const today=limaToday(new Date(now)),needle=query.trim().toLocaleLowerCase('es')
  return chronologicalAppointments(rows.filter(c=>{
    const day=appointmentDay(c.fechaCita),pet=pets.find(p=>sameAppointmentId(p.idMascota,c.idMascota)),stamp=appointmentTime(c.fechaCita),hour=Number.isFinite(stamp)?Number(new Intl.DateTimeFormat('en',{timeZone:'America/Lima',hour:'2-digit',hourCycle:'h23'}).format(new Date(stamp))):-1
    if(tab==='hoy'&&day!==(date||today))return false
    if(tab==='proximas'&&(!activeAppointment(c)||appointmentTime(c.fechaCita)<=now))return false
    if(['pendientes','atendidas','canceladas','no-asistio'].includes(tab)&&c.estado!==({pendientes:'PENDIENTE',atendidas:'ATENDIDA',canceladas:'CANCELADA','no-asistio':'NO_ASISTIO'})[tab])return false
    return (!date||day===date)&&(!needle||`${pet?.nombre||''} ${pet?.nombrePropietario||''}`.toLocaleLowerCase('es').includes(needle))&&(!period||(period==='manana'?hour>=8&&hour<12:hour>=12&&hour<20))
  }),descending)
}
export function appointmentPermissions(role,cita,visits,now=Date.now()) {
  const active=activeAppointment(cita),future=appointmentTime(cita.fechaCita)>now,registered=visits?.find(a=>sameAppointmentId(a.idCita,cita.idCita))
  return {reschedule:role==='PROPIETARIO'&&future&&cita.estado==='PENDIENTE'&&cita.puedeReprogramar!==false,cancel:['PROPIETARIO','VETERINARIO','ADMIN'].includes(role)&&active&&now<appointmentTime(cita.fechaCita)+30*60000&&(role!=='PROPIETARIO'||future)&&cita.puedeCancelar!==false,confirm:role==='VETERINARIO'&&cita.estado==='PENDIENTE',register:['VETERINARIO','ADMIN'].includes(role)&&cita.estado==='CONFIRMADA'&&visits!=null&&!registered,window:attentionWindow(cita,now),attention:registered||null}
}
export function appointmentCountdown(value,now=Date.now()) {
  const minutes=Math.ceil((appointmentTime(value)-now)/60000)
  if(!Number.isFinite(minutes)||minutes<=0)return ''
  if(minutes<60)return `En ${minutes} ${minutes===1?'minuto':'minutos'}`
  if(minutes<1440){const hours=Math.floor(minutes/60);return `En ${hours} ${hours===1?'hora':'horas'}${minutes%60?` y ${minutes%60} min`:''}`}
  const days=Math.ceil(minutes/1440);return `En ${days} días`
}
export function validateAppointment(values,now=Date.now()) {
  if(!values.fechaCita||!Number.isFinite(appointmentTime(values.fechaCita))||appointmentTime(values.fechaCita)<=now)return 'Selecciona una fecha y hora futura válida (Lima).'
  if(!values.motivoCita?.trim()||values.motivoCita.length>250)return 'El motivo es obligatorio y admite hasta 250 caracteres.'
  return ''
}
export function appointmentError(error) {
  const status=error?.response?.status,data=error?.response?.data
  if(status===401)return 'Tu sesión venció o no está autorizada. Inicia sesión nuevamente.'
  if(status===403)return 'No tienes permiso para realizar esta operación sobre la cita.'
  if(status===404)return 'La cita o el registro asociado ya no está disponible.'
  if(data?.campos)return Object.values(data.campos).join(' · ')
  if(data?.error||data?.mensaje)return data.error||data.mensaje
  if(status===409)return 'La cita cambió de estado o el horario está ocupado. Actualiza la agenda y revisa los datos.'
  return error?.message&&!error?.request?error.message:'No se pudo contactar al servidor. Intenta nuevamente.'
}
export async function readAppointments(client,signal) {
  const keys=['citas','mascotas','veterinarios','atenciones']
  const results=await Promise.allSettled(keys.map(async key=>{const {data}=await client.get(`/${key}`,{signal});if(Array.isArray(data))return data;if(Array.isArray(data?.content))return data.content;throw Error('Listado con formato inesperado.')}))
  return Object.fromEntries(results.map((r,i)=>[keys[i],r.status==='fulfilled'?{data:r.value,error:null}:{data:null,error:r.reason}]))
}
