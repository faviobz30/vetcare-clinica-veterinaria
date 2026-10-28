import {appointmentTime} from './vetAgenda.js'
export const SLOT_CONFLICT='Este horario acaba de ser reservado. Selecciona otro horario disponible.'
export const NO_SLOTS='No hay horarios disponibles para esta fecha. Selecciona otro día.'
export function reservableDay(day,today){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&day>=today&&new Date(`${day}T12:00:00-05:00`).getUTCDay()!==0}
export function availableSelection(data,vet,value,now=Date.now()){
 return !!value&&String(data?.idVeterinario)===String(vet)&&data?.fecha===value.slice(0,10)&&data.horarios?.some(s=>s.disponible&&s.inicio.slice(0,16)===value.slice(0,16)&&appointmentTime(s.inicio)>now)
}
export function scheduledEnd(value){const start=appointmentTime(value);return Number.isFinite(start)?new Date(start+30*60000).toISOString():''}

export function clinicTime(value){
 const time=String(value||'').includes('T')?String(value).slice(11,16):String(value||'').slice(0,5)
 if(!/^\d{2}:\d{2}$/.test(time))return ''
 const [hour,minute]=time.split(':').map(Number)
 if(hour>23||minute>59)return ''
 return `${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'a. m.':'p. m.'}`
}
export function availabilityError(error){
 const status=error?.response?.status,detail=error?.response?.data
 if(status===401)return 'Tu sesión venció. Inicia sesión nuevamente para consultar los horarios.'
 if(status===403)return 'No tienes permiso para consultar esta disponibilidad.'
 if(status===404)return 'El servicio de horarios no está disponible. Inténtalo de nuevo en unos momentos.'
 if(status===400){
  if(detail?.campos)return Object.values(detail.campos).join(' · ')
  const text=detail?.error||detail?.mensaje||detail?.message
  return text&&!/^(bad request|400 bad request)$/i.test(text)?text:'No se pudo consultar la disponibilidad. Comprueba el veterinario y la fecha seleccionados; si persiste, contacta con la clínica.'
 }
 return 'No se pudieron consultar los horarios. Inténtalo nuevamente.'
}
