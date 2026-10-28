import {appointmentDay,appointmentTime} from './vetAgenda.js'
export const adminStates=['PENDIENTE','CONFIRMADA','ATENDIDA','CANCELADA','NO_ASISTIO']
export function adminMatches(query,...values){const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return normalize(values.join(' ')).includes(normalize(query.trim()))}
export function adminSummary(data,today){return {users:data.usuarios?.length??null,vets:data.veterinarios?.length??null,today:data.citas?.filter(c=>appointmentDay(c.fechaCita)===today).length??null,visits:data.atenciones?.length??null,states:Object.fromEntries(adminStates.map(s=>[s,data.citas?.filter(c=>c.estado===s).length??null]))}}
export function adminActivity(citas,now=Date.now()) {return [...(citas||[])].sort((a,b)=>{
 const x=appointmentTime(a.fechaCita),y=appointmentTime(b.fechaCita)
 const futureX=x>=now&&['PENDIENTE','CONFIRMADA'].includes(a.estado),futureY=y>=now&&['PENDIENTE','CONFIRMADA'].includes(b.estado)
 return futureX!==futureY?futureX?-1:1:futureX?x-y:y-x
}).slice(0,6)}
export function administrativeError(error){return ({401:'Tu sesión expiró. Vuelve a iniciar sesión.',403:'No tienes permiso para esta operación.',409:'El registro tiene relaciones o datos duplicados. Revisa la información antes de continuar.'})[error?.response?.status]||error?.response?.data?.error||'No se pudo completar la operación. Intenta actualizar los datos.'}
