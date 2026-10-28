import {adminMatches,adminStates} from './admin.js'
import {appointmentDay,appointmentTime,sortAppointments} from './vetAgenda.js'
export const citaLabels={PENDIENTE:'Pendiente',CONFIRMADA:'Confirmada',ATENDIDA:'Atendida',CANCELADA:'Cancelada',NO_ASISTIO:'No asistió'}
export const citaChips=[['','Todas'],...adminStates.map(state=>[state,({PENDIENTE:'Pendientes',CONFIRMADA:'Confirmadas',ATENDIDA:'Atendidas',CANCELADA:'Canceladas'})[state]||citaLabels[state]])]
export const citaPet=(pets,cita)=>pets.find(p=>String(p.idMascota)===String(cita.idMascota))
export const citaVet=(vets,cita)=>vets.find(v=>String(v.idVeterinario)===String(cita.idVeterinario))
export function adminCitaRows(items,pets,{query='',date='',vet='',id=''}={},now=Date.now()){
 return sortAppointments(items.filter(c=>{const pet=citaPet(pets,c);return (!id||String(c.idCita)===id)&&(!date||appointmentDay(c.fechaCita)===date)&&(!vet||String(c.idVeterinario)===String(vet))&&adminMatches(query,pet?.nombre,pet?.nombrePropietario,c.motivoCita)}),now)
}
// ADMIN conserva sus facultades existentes; el servidor sigue validando las transiciones.
export function adminCitaActions(cita,now=Date.now()){
 const active=['PENDIENTE','CONFIRMADA'].includes(cita.estado)
 return {confirm:cita.estado==='PENDIENTE',reschedule:active&&cita.puedeReprogramar!==false,cancel:active&&cita.puedeCancelar!==false&&appointmentTime(cita.fechaCita)+30*60000>now,remove:active&&!cita.regularizacion}
}
