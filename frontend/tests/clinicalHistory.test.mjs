import test from 'node:test'
import assert from 'node:assert/strict'
import { clinicalSummary, clinicalTimeline, limaToday, loadClinicalHistory, sortClinicalEvents } from '../src/lib/clinicalHistory.js'

function backend(overrides = {}) {
  const responses = {
    '/historias-clinicas/mascota/2': { idHistoria: 8, idMascota: 2 },
    '/mascotas/2': { idMascota: 2, nombre: 'Paciente de prueba' },
    '/atenciones': [{ idAtencion: 1, idHistoria: 8 }, { idAtencion: 2, idHistoria: 99 }],
    '/citas': [{ idCita: 3, idMascota: '2' }, { idCita: 4, idMascota: 9 }],
    '/vacunas/mascota/2': [{ idVacuna: 5, idMascota: 2 }, { idVacuna: 6, idMascota: 9 }],
    '/veterinarios': [{ idVeterinario: 7, nombres: 'Profesional sintético' }],
    ...overrides,
  }
  const calls = []
  return {
    calls,
    async get(url, config) {
      calls.push({ url, config })
      const data = responses[url]
      if (data instanceof Error) throw data
      return { data }
    },
  }
}
const section = (data, error = null) => ({ data, error })
const empty = () => ({ atenciones: section([]), vacunas: section([]), citas: section([]), veterinarios: section([]) })

test('relaciona datos por historia y mascota, conserva nombres y solo realiza GET', async () => {
  const client = backend()
  const signal = new AbortController().signal
  const record = await loadClinicalHistory(client, '2', signal)
  assert.deepEqual(record.sections.atenciones.data.map(a => a.idAtencion), [1])
  assert.deepEqual(record.sections.citas.data.map(c => c.idCita), [3])
  assert.deepEqual(record.sections.vacunas.data.map(v => v.idVacuna), [5])
  assert.equal(record.sections.veterinarios.data[0].nombres, 'Profesional sintético')
  assert.equal(client.calls.length, 6)
  assert.ok(client.calls.every(call => call.config.signal === signal))
})

test('un fallo parcial conserva las otras secciones y no inventa un cero', async () => {
  const failure = new Error('Sin acceso o servicio no disponible')
  const record = await loadClinicalHistory(backend({ '/atenciones': failure }), 2)
  assert.equal(record.sections.atenciones.error, failure)
  assert.equal(record.sections.atenciones.data, null)
  assert.equal(record.sections.citas.data.length, 1)
  assert.equal(clinicalSummary(record.sections).visits, null)
  assert.equal(clinicalSummary(record.sections).appointments, 1)
})

test('rechaza historia ajena antes de consultar datos clínicos adicionales', async () => {
  const client = backend({ '/historias-clinicas/mascota/2': { idHistoria: 8, idMascota: 9 } })
  await assert.rejects(loadClinicalHistory(client, 2), /no corresponden/)
  assert.equal(client.calls.length, 2)
})

test('si falla el permiso de historia no se intenta completar el expediente', async () => {
  const client = backend({ '/historias-clinicas/mascota/2': new Error('403') })
  await assert.rejects(loadClinicalHistory(client, 2), /403/)
  assert.equal(client.calls.length, 2)
})

test('una respuesta de listado inválida es error, no estado vacío', async () => {
  const record = await loadClinicalHistory(backend({ '/vacunas/mascota/2': { unexpected: true } }), 2)
  assert.equal(record.sections.vacunas.data, null)
  assert.match(record.sections.vacunas.error.message, /formato inesperado/)
})

test('cronología ordena fechas y horas en ambos sentidos sin mutar la fuente', () => {
  const sections = empty()
  sections.atenciones = section([{ idAtencion: 1, fechaAtencion: '2026-10-20T10:00:00' }])
  sections.vacunas = section([{ idVacuna: 2, fechaAplicacion: '2026-10-20', proximaDosis: '2026-12-01' }, { idVacuna: 3, proximaDosis: '2026-11-01' }])
  sections.citas = section([{ idCita: 4, fechaCita: '2026-10-20T09:00:00' }])
  const events = clinicalTimeline(sections)
  const before = events.map(e => e.key)
  assert.deepEqual(sortClinicalEvents(events).map(e => e.key), ['vacuna-3', 'atencion-1', 'cita-4', 'vacuna-2'])
  assert.deepEqual(sortClinicalEvents(events, true).map(e => e.key), ['vacuna-2', 'cita-4', 'atencion-1', 'vacuna-3'])
  assert.deepEqual(events.map(e => e.key), before)
})

test('contadores incluyen próxima dosis de vacuna aplicada y peso más reciente', () => {
  const sections = empty()
  sections.atenciones = section([
    { idAtencion: 1, fechaAtencion: '2026-10-20T12:00:00', peso: 10 },
    { idAtencion: 2, fechaAtencion: '2026-10-23T09:00:00', peso: 11 },
  ])
  sections.vacunas = section([
    { idVacuna: 1, fechaAplicacion: '2026-10-20', proximaDosis: '2026-11-20' },
    { idVacuna: 2, proximaDosis: '2026-10-24' },
    { idVacuna: 3, proximaDosis: '2026-10-23' },
  ])
  const summary = clinicalSummary(sections, '2026-10-24')
  assert.equal(summary.visits, 2)
  assert.equal(summary.applied, 1)
  assert.equal(summary.nextDoses, 2)
  assert.equal(summary.overdueDoses, 1)
  assert.equal(summary.latestWeight.peso, 11)
})

test('distingue expediente vacío de secciones que no cargaron', () => {
  const sections = empty()
  assert.equal(clinicalSummary(sections).visits, 0)
  assert.equal(clinicalSummary(sections).applied, 0)
  assert.equal(clinicalSummary(sections).latestWeight, null)
  assert.deepEqual(clinicalTimeline(sections), [])
  sections.vacunas = section(null, new Error('Error de red'))
  assert.equal(clinicalSummary(sections).applied, null)
  assert.equal(clinicalSummary(sections).nextDoses, null)
})

test('el día de referencia usa Lima, no UTC', () => {
  assert.equal(limaToday(new Date('2026-10-25T02:00:00Z')), '2026-10-24')
})
