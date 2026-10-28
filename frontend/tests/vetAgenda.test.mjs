import test from 'node:test'
import assert from 'node:assert/strict'
import { agendaFilter, agendaLink, appointmentDay, appointmentTime, filterAppointments, readVetAgenda, sortAppointments, vetAppointmentAction, vetCounters } from '../src/lib/vetAgenda.js'

const now = Date.parse('2026-10-24T15:00:00Z') // 10:00 Lima
const cita = (id, estado, fechaCita, idMascota = id) => ({ idCita: id, estado, fechaCita, idMascota })
const records = [
  cita(1, 'PENDIENTE', '2026-10-24T09:00:00', 1),
  cita(2, 'CONFIRMADA', '2026-10-24T11:00:00', '1'),
  cita(3, 'PENDIENTE', '2026-10-25T10:00:00', 2),
  cita(4, 'ATENDIDA', '2026-10-24T08:00:00', 2),
  cita(5, 'CANCELADA', '2026-10-24T12:00:00', 3),
  cita(6, 'ATENDIDA', '2026-10-23T10:00:00', 3),
  cita(7, 'CANCELADA', '2026-10-25T15:00:00', 3),
]
const ids = data => data.map(c => c.idCita)

test('contadores reales: pacientes únicos, hoy sin canceladas, pendientes y atenciones', () => {
  assert.deepEqual(vetCounters(records, [{ idAtencion: 1 }, { idAtencion: 2 }], now), { patients: 3, today: 3, pending: 2, visits: 2 })
  assert.deepEqual(vetCounters(null, null, now), { patients: null, today: null, pending: null, visits: null })
  assert.deepEqual(vetCounters([], [], now), { patients: 0, today: 0, pending: 0, visits: 0 })
})
test('próximas excluye horas pasadas de hoy y estados cerrados futuros', () => {
  assert.deepEqual(ids(filterAppointments(records, 'proximas', now)), [2, 3])
  assert.deepEqual(ids(filterAppointments([cita(8, 'CONFIRMADA', '2026-10-24T10:00:00')], 'proximas', now)), [])
})
test('seis filtros seleccionan sus registros sin modificar los datos', () => {
  assert.deepEqual(ids(filterAppointments(records, 'hoy', now)), [1, 2, 4])
  assert.deepEqual(ids(filterAppointments(records, 'pendientes', now)), [1, 3])
  assert.deepEqual(ids(filterAppointments(records, 'atendidas', now)), [4, 6])
  assert.deepEqual(ids(filterAppointments(records, 'canceladas', now)), [5, 7])
  assert.equal(filterAppointments(records, 'todas', now).length, 7)
})
test('orden: activas futuras ascendentes; resto descendente, sin mutar lista', () => {
  const before = ids(records)
  assert.deepEqual(ids(sortAppointments(records, now)), [2, 3, 7, 5, 1, 4, 6])
  assert.deepEqual(ids(records), before)
})
test('fechas LocalDateTime se interpretan en Lima y offsets explícitos se respetan', () => {
  assert.equal(appointmentTime('2026-10-24T10:00:00'), now)
  assert.equal(appointmentTime('2026-10-24T15:00:00Z'), now)
  assert.equal(appointmentDay('2026-10-25T02:00:00Z'), '2026-10-24')
  assert.equal(appointmentDay('2026-10-24T23:59:00'), '2026-10-24')
  assert.equal(appointmentDay(null), '')
})
test('tareas navegan a filtros distintos compatibles con React Router', () => {
  for (const filter of ['pendientes', 'proximas']) {
    const url = new URL(agendaLink(filter), 'http://vetcare.test')
    assert.equal(url.pathname, '/panel/citas')
    assert.equal(agendaFilter(url.searchParams.get('filtro')), filter)
    assert.ok(filterAppointments(records, filter, now).length > 0)
  }
  assert.notEqual(agendaLink('pendientes'), agendaLink('proximas'))
  assert.equal(agendaFilter('invalido'), 'proximas')
})
test('acciones por rol y estado; no registrar citas cerradas, duplicadas o sin verificación', () => {
  assert.equal(vetAppointmentAction('VETERINARIO', records[0], []), 'confirmar')
  assert.equal(vetAppointmentAction('VETERINARIO', {...records[1],puedeIniciarAtencion:true}, [], now+3600000), 'registrar')
  assert.equal(vetAppointmentAction('VETERINARIO', {...records[1],puedeIniciarAtencion:true}, [], now), 'detalle')
  assert.equal(vetAppointmentAction('VETERINARIO', records[1], null), 'detalle')
  assert.equal(vetAppointmentAction('VETERINARIO', records[1], [{ idCita: '2' }]), 'atencion')
  for (const closed of records.filter(c => ['ATENDIDA', 'CANCELADA'].includes(c.estado))) {
    assert.notEqual(vetAppointmentAction('VETERINARIO', closed, []), 'registrar')
    assert.notEqual(vetAppointmentAction('VETERINARIO', closed, []), 'confirmar')
  }
  assert.equal(vetAppointmentAction('VETERINARIO', records[3], [{ idCita: 4 }]), 'atencion')
  for (const role of ['ADMIN', 'PROPIETARIO', undefined]) assert.equal(vetAppointmentAction(role, records[1], []), 'detalle')
})
test('carga solo endpoints existentes y fallos parciales no generan ceros falsos', async () => {
  const calls = []
  const result = await readVetAgenda({ get: async url => {
    calls.push(url)
    if (url === '/atenciones') throw new Error('403')
    return { data: url === '/citas' ? records : [] }
  } })
  assert.deepEqual(calls, ['/citas', '/mascotas', '/atenciones'])
  assert.equal(result.atenciones.data, null)
  assert.equal(vetCounters(result.citas.data, result.atenciones.data, now).visits, null)
  assert.equal(result.citas.data.length, 7)
})
test('una respuesta con formato inesperado produce un error visible', async () => {
  const result = await readVetAgenda({ get: async () => ({ data: {} }) })
  assert.equal(result.citas.data, null)
  assert.match(result.citas.error.message, /inesperada/)
})
