import {pendingDoseRows} from './vaccineDoses.js'
// Composición de lectura; el backend mantiene la autorización de cada recurso.
const sameId = (a, b) => a != null && b != null && String(a) === String(b)

function collection(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  throw new Error('El backend devolvió un listado con formato inesperado.')
}

export async function loadClinicalHistory(client, id, signal) {
  const config = { signal }
  const [{ data: history }, { data: pet }] = await Promise.all([
    client.get(`/historias-clinicas/mascota/${encodeURIComponent(id)}`, config),
    client.get(`/mascotas/${encodeURIComponent(id)}`, config),
  ])
  if (!sameId(history?.idMascota, id) || !sameId(pet?.idMascota, id) || history?.idHistoria == null) {
    throw new Error('Los datos recibidos no corresponden a la mascota seleccionada.')
  }
  const definitions = [
    ['atenciones', '/atenciones', a => sameId(a.idHistoria, history.idHistoria)],
    ['citas', '/citas', c => sameId(c.idMascota, id)],
    ['vacunas', `/vacunas/mascota/${encodeURIComponent(id)}`, v => sameId(v.idMascota, id)],
    ['veterinarios', '/veterinarios', () => true],
  ]
  const results = await Promise.allSettled(definitions.map(async ([, url, filter]) => {
    const { data } = await client.get(url, config)
    return collection(data).filter(filter)
  }))
  const sections = Object.fromEntries(results.map((result, index) => [definitions[index][0],
    result.status === 'fulfilled' ? { data: result.value, error: null } : { data: null, error: result.reason },
  ]))
  return { history, pet, sections }
}

export function clinicalTimeline(sections) {
  return [
    ...(sections.atenciones.data || []).map(item => ({ key: `atencion-${item.idAtencion}`, type: 'atenciones', date: item.fechaAtencion, item })),
    ...(sections.vacunas.data || []).map(item => ({ key: `vacuna-${item.idVacuna}`, type: 'vacunas', date: item.fechaAplicacion || item.proximaDosis, item })),
    ...(sections.citas.data || []).map(item => ({ key: `cita-${item.idCita}`, type: 'citas', date: item.fechaCita, item })),
  ]
}

export function sortClinicalEvents(events, oldestFirst = false) {
  const direction = oldestFirst ? 1 : -1
  return [...events].sort((a, b) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : a.key.localeCompare(b.key)
    const normalize = value => value.length === 10 ? `${value}T00:00:00` : value
    return direction * normalize(a.date).localeCompare(normalize(b.date)) || a.key.localeCompare(b.key)
  })
}

export function limaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = type => parts.find(part => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function clinicalSummary(sections, today = limaToday()) {
  const visits = sections.atenciones.data
  const vaccines = sections.vacunas.data
  const appointments = sections.citas.data
  const latestWeight = visits == null ? null : sortClinicalEvents(visits.filter(a => a.peso != null).map(item => ({ key: String(item.idAtencion), date: item.fechaAtencion, item })))[0]?.item || null
  return {
    visits: visits?.length ?? null,
    applied: vaccines?.filter(v => !!v.fechaAplicacion).length ?? null,
    nextDoses: (vaccines == null ? null : pendingDoseRows(vaccines))?.filter(v => v.proximaDosis >= today).length ?? null,
    overdueDoses: (vaccines == null ? null : pendingDoseRows(vaccines))?.filter(v => v.proximaDosis < today).length ?? null,
    appointments: appointments?.length ?? null,
    latestWeight,
  }
}
