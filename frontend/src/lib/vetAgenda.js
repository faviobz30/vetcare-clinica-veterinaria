import { limaToday } from './clinicalHistory.js'

export const agendaFilters = [
  ['hoy', 'Hoy'], ['proximas', 'Próximas'], ['pendientes', 'Por confirmar'],
  ['atendidas', 'Atendidas'], ['canceladas', 'Canceladas'], ['no-asistio', 'No asistió'], ['todas', 'Todas'],
]
export const agendaFilter = value => agendaFilters.some(([key]) => key === value) ? value : 'proximas'
export const agendaLink = filter => `/panel/citas?filtro=${agendaFilter(filter)}`
export const activeAppointment = cita => ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)
// Java LocalDateTime no lleva offset: la agenda de VetCare se interpreta en Lima.
export function appointmentTime(value) {
  if (!value) return NaN
  return Date.parse(/[zZ]$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}-05:00`)
}
export function appointmentDay(value) {
  const time = appointmentTime(value)
  return Number.isFinite(time) ? limaToday(new Date(time)) : ''
}
export function futureAppointment(cita, now = Date.now()) {
  return activeAppointment(cita) && appointmentTime(cita.fechaCita) > Number(now)
}
export function filterAppointments(items, filter, now = Date.now()) {
  return items.filter(c => {
    switch (agendaFilter(filter)) {
      case 'hoy': return c.estado !== 'CANCELADA' && appointmentDay(c.fechaCita) === limaToday(new Date(now))
      case 'proximas': return futureAppointment(c, now)
      case 'pendientes': return c.estado === 'PENDIENTE'
      case 'atendidas': return c.estado === 'ATENDIDA'
      case 'no-asistio': return c.estado === 'NO_ASISTIO'
      case 'canceladas': return c.estado === 'CANCELADA'
      default: return true
    }
  })
}
export function sortAppointments(items, now = Date.now()) {
  return [...items].sort((a, b) => {
    const upcomingA = futureAppointment(a, now), upcomingB = futureAppointment(b, now)
    if (upcomingA !== upcomingB) return upcomingA ? -1 : 1
    const aTime = appointmentTime(a.fechaCita), bTime = appointmentTime(b.fechaCita)
    if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return Number.isFinite(aTime) ? -1 : Number.isFinite(bTime) ? 1 : 0
    return (upcomingA ? aTime - bTime : bTime - aTime) || String(a.idCita).localeCompare(String(b.idCita))
  })
}
export function vetCounters(citas, atenciones, now = Date.now()) {
  return {
    patients: citas == null ? null : new Set(citas.filter(c => c.idMascota != null).map(c => String(c.idMascota))).size,
    today: citas == null ? null : filterAppointments(citas, 'hoy', now).length,
    pending: citas == null ? null : filterAppointments(citas, 'pendientes', now).length,
    visits: atenciones?.length ?? null,
  }
}
export function vetAppointmentAction(role, cita, visits, now = Date.now()) {
  if (role !== 'VETERINARIO') return 'detalle'
  const registered = visits?.some(a => String(a.idCita) === String(cita.idCita))
  if (cita.estado === 'PENDIENTE') return 'confirmar'
  const start = appointmentTime(cita.fechaCita)
  const regularized = cita.regularizacion?.estado === 'APROBADA' && appointmentTime(cita.regularizacion.venceEn) > now
  if (cita.estado === 'CONFIRMADA' && cita.puedeIniciarAtencion && now >= start && (now < start + 30 * 60000 || regularized) && visits != null && !registered) return 'registrar'
  return registered ? 'atencion' : 'detalle'
}
export function agendaDate(value, timeOnly = false) {
  const time = appointmentTime(value)
  if (!Number.isFinite(time)) return 'Fecha no registrada'
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', ...(timeOnly ? {} : { day: '2-digit', month: 'short', year: 'numeric' }), hour: '2-digit', minute: '2-digit' }).format(new Date(time))
}
export async function readVetAgenda(client, signal) {
  const names = ['citas', 'mascotas', 'atenciones']
  const results = await Promise.allSettled(names.map(async name => {
    const { data } = await client.get(`/${name}`, { signal })
    if (!Array.isArray(data)) throw new Error('Respuesta de listado inesperada')
    return data
  }))
  return Object.fromEntries(results.map((result, index) => [names[index], result.status === 'fulfilled'
    ? { data: result.value, error: null } : { data: null, error: result.reason }]))
}
