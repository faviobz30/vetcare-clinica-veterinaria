import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { attentionDate, attentionError, attentionPermissions, attentionRows, filterAttentionRows, historicalAge, loadAttentionDetail, loadAttentions, showAttentionPetMetadata } from '../src/lib/attentions.js'
const section = data => ({ data, error: null })
const longText = 'Diagnóstico áéíóúñ\n'.repeat(26)
const fixture = () => ({
  atenciones: section([
    { idAtencion: 1, idCita: 20, idHistoria: 30, idVeterinario: 40, fechaAtencion: '2026-10-20T18:14:00', diagnostico: longText, sintoma: 'Síntomas\ncompletos', tratamiento: 'Primera indicación\nSegunda indicación', observacion: 'Observación original', peso: 12.5 },
    { idAtencion: 2, idCita: 21, idHistoria: 31, idVeterinario: 41, fechaAtencion: '2026-10-12T22:30:00', diagnostico: 'Control' },
    { idAtencion: 3, idCita: 22, idHistoria: 30, idVeterinario: 40, fechaAtencion: '2026-10-21T10:00:00', diagnostico: 'Seguimiento' },
  ]),
  citas: section([{ idCita: 20, idMascota: 10, fechaCita: '2026-10-19T15:00:00', motivoCita: 'Motivo real de cita' }, { idCita: 21, idMascota: 11 }, { idCita: 22, idMascota: 10 }]),
  mascotas: section([{ idMascota: 10, nombre: 'Paciente A', fechaNacimiento: '2023-07-20' }, { idMascota: 11, nombre: 'Paciente B', fechaNacimiento: '2026-02-12' }]),
  veterinarios: section([{ idVeterinario: 40, nombres: 'Profesional', apellidos: 'Uno' }, { idVeterinario: 41, nombres: 'Profesional', apellidos: 'Dos' }]),
})

test('relaciona cada atención con su mascota y veterinario por los IDs correctos', () => {
  const rows = attentionRows(fixture())
  assert.equal(rows[0].pet.nombre, 'Paciente A')
  assert.equal(rows[1].pet.nombre, 'Paciente B')
  assert.equal(rows[0].vetName, 'Profesional Uno')
  assert.equal(rows[1].vetName, 'Profesional Dos')
  assert.equal(rows[0].cita.motivoCita, 'Motivo real de cita')
})
test('filtro de mascota se combina con orden y fecha usando fecha de atención', () => {
  const rows = attentionRows(fixture())
  const ids = rows => rows.map(r => r.attention.idAtencion)
  assert.deepEqual(ids(filterAttentionRows(rows)), [3, 1, 2])
  assert.deepEqual(ids(filterAttentionRows(rows, { petId: '10', order: 'antiguas' })), [1, 3])
  assert.deepEqual(ids(filterAttentionRows(rows, { petId: '10', from: '2026-10-20', to: '2026-10-20' })), [1])
  assert.deepEqual(ids(filterAttentionRows(rows, { from: '2026-10-19', to: '2026-10-19' })), [])
  assert.deepEqual(ids(filterAttentionRows(rows, { petId: '999' })), [])
  assert.deepEqual(ids(rows), [1, 2, 3])
})
test('diagnóstico y textos íntegros no se resumen ni recortan en los datos', () => {
  const data = fixture()
  const before = JSON.stringify(data)
  const rows = filterAttentionRows(attentionRows(data))
  assert.equal(rows.find(r => r.attention.idAtencion === 1).attention.diagnostico, longText)
  assert.equal(JSON.stringify(data), before)
  assert.ok(rows.find(r => r.attention.idAtencion === 1).attention.tratamiento.includes('\n'))
})
test('CSS recorta solo las tarjetas y permite texto completo y scroll dentro del modal', async () => {
  const css = await readFile(new URL('../src/pages/Atenciones.css', import.meta.url), 'utf8')
  assert.match(css, /\.attention-card-identity h2\{[^}]*-webkit-line-clamp:2/)
  assert.match(css, /\.attention-clamp\{[^}]*-webkit-line-clamp:3/)
  assert.match(css, /\.attention-clinical-block p\{[^}]*white-space:pre-wrap[^}]*overflow-wrap:anywhere/)
  assert.match(css, /\.attention-modal\{[^}]*max-height:[^}]*overflow-y:auto/)
})
test('edad histórica con años y meses, sin usar edad actual', () => {
  assert.equal(historicalAge('2023-07-20', '2026-10-20T18:14:00'), '3 años y 3 meses')
  assert.equal(historicalAge('2026-02-12', '2026-10-12T22:30:00'), '8 meses')
  assert.equal(historicalAge('2025-10-21', '2026-10-20T18:14:00'), '11 meses')
  assert.equal(historicalAge('2025-10-20', '2026-10-20T18:14:00'), '1 año')
  assert.equal(historicalAge('2026-09-20', '2026-10-20T18:14:00'), '1 mes')
  assert.equal(historicalAge('2026-10-19', '2026-10-20T18:14:00'), '1 día')
  assert.equal(historicalAge('2026-10-20', '2026-10-20T18:14:00'), '0 días')
})
test('edad ausente o inválida, fecha anterior al nacimiento y año bisiesto', () => {
  for (const birth of [undefined, '', 'incorrecta', '2023-02-29', '2026-13-12', '2026-10-21']) {
    assert.equal(historicalAge(birth, '2026-10-20T18:14:00'), 'No disponible')
  }
  assert.equal(historicalAge('2024-02-29', '2025-03-01T10:00:00'), '1 año')
  assert.equal(historicalAge('2023-01-01', null), 'No disponible')
  assert.equal(historicalAge('2023-01-01', '2026-02-30T10:00:00'), 'No disponible')
})
test('fecha y edad respetan Lima incluso cuando el timestamp trae UTC', () => {
  assert.equal(historicalAge('2025-10-25', '2026-10-25T02:00:00Z'), '11 meses')
  assert.match(attentionDate('2026-10-25T02:00:00Z'), /24/)
  assert.equal(attentionDate(null), 'No disponible')
})
test('permisos visibles preservados para los tres roles y usuarios desconocidos', () => {
  assert.deepEqual(attentionPermissions('PROPIETARIO'), { write: false, remove: false, price: false })
  assert.deepEqual(attentionPermissions('VETERINARIO'), { write: true, remove: false, price: false })
  assert.deepEqual(attentionPermissions('ADMIN'), { write: false, remove: false, price: true })
  assert.deepEqual(attentionPermissions(undefined), { write: false, remove: false, price: false })
})
test('una relación incompleta no inventa mascota, veterinario ni edad', () => {
  const data = { atenciones: section([{ idAtencion: 1, idCita: 999 }]) }
  const [row] = attentionRows(data)
  assert.equal(row.pet, undefined)
  assert.equal(row.vetName, 'Veterinario no disponible')
  assert.equal(historicalAge(row.pet?.fechaNacimiento, row.attention.fechaAtencion), 'No disponible')
})
test('carga reutiliza cuatro GET, conserva errores parciales y propaga cancelación', async () => {
  const calls = []
  const signal = new AbortController().signal
  const source = fixture()
  const data = await loadAttentions({ get: async (url, config) => {
    calls.push(url)
    assert.equal(config.signal, signal)
    if (url === '/veterinarios') throw new Error('No disponible')
    return { data: source[url.slice(1)].data }
  } }, signal)
  assert.deepEqual(calls, ['/atenciones', '/mascotas', '/citas', '/veterinarios'])
  assert.equal(data.atenciones.data.length, 3)
  assert.equal(data.veterinarios.data, null)
  assert.ok(data.veterinarios.error)
})
test('un error principal no se convierte en una lista vacía', async () => {
  await assert.rejects(loadAttentions({ get: async url => {
    if (url === '/atenciones') throw new Error('Conexión fallida')
    return { data: [] }
  } }), /Conexión fallida/)
  await assert.rejects(loadAttentions({ get: async () => ({ data: {} }) }), /formato inesperado/)
})
test('detalle consulta la atención seleccionada y rechaza una respuesta ajena', async () => {
  const signal = new AbortController().signal
  const expected = fixture().atenciones.data[0]
  const detail = await loadAttentionDetail({ get: async (url, options) => {
    assert.equal(url, '/atenciones/1')
    assert.equal(options.signal, signal)
    return { data: expected }
  } }, 1, signal)
  assert.equal(detail.diagnostico, longText)
  await assert.rejects(loadAttentionDetail({ get: async () => ({ data: { idAtencion: 2 } }) }, 1), /no corresponde/)
})
test('errores de autorización se explican sin mostrar datos sensibles', () => {
  assert.match(attentionError({ response: { status: 401 } }), /sesión/)
  assert.match(attentionError({ response: { status: 403 } }), /permiso/)
  assert.match(attentionError({ request: {} }), /contactar/)
})

test('la identificación discreta se muestra solo en metadatos de un listado mixto', () => {
  assert.equal(showAttentionPetMetadata('', 2), true)
  assert.equal(showAttentionPetMetadata('10', 2), false)
  assert.equal(showAttentionPetMetadata('11', 2), false)
  assert.equal(showAttentionPetMetadata('', 1), false)
  assert.equal(showAttentionPetMetadata('', 20), true)
})
