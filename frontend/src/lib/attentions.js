import { appointmentDay, appointmentTime } from './vetAgenda.js'
import { fullName } from './display.js'

const sameId = (a, b) => a != null && b != null && String(a) === String(b)
const list = data => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  throw new Error('El backend devolvió un listado con formato inesperado.')
}

export async function loadAttentions(client, signal) {
  const names = ['atenciones', 'mascotas', 'citas', 'veterinarios']
  const results = await Promise.allSettled(names.map(async name => list((await client.get(`/${name}`, { signal })).data)))
  if (results[0].status === 'rejected') throw results[0].reason
  return Object.fromEntries(results.map((result, i) => [names[i], result.status === 'fulfilled'
    ? { data: result.value, error: null } : { data: null, error: result.reason }]))
}

export async function loadAttentionDetail(client, id, signal) {
  const { data } = await client.get(`/atenciones/${encodeURIComponent(id)}`, { signal })
  if (!sameId(data?.idAtencion, id)) throw new Error('El detalle recibido no corresponde a la atención seleccionada.')
  return data
}

export function attentionRows(data) {
  const citas = new Map((data?.citas?.data || []).map(c => [String(c.idCita), c]))
  const pets = new Map((data?.mascotas?.data || []).map(p => [String(p.idMascota), p]))
  const vets = new Map((data?.veterinarios?.data || []).map(v => [String(v.idVeterinario), v]))
  return (data?.atenciones?.data || []).map(attention => {
    const cita = citas.get(String(attention.idCita))
    const pet = cita ? pets.get(String(cita.idMascota)) : undefined
    const vet = vets.get(String(attention.idVeterinario))
    return { attention, cita, pet, vet, vetName: fullName(vet) || 'Veterinario no disponible' }
  })
}

function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? { year, month, day, stamp: date.getTime() } : null
}

export function historicalAge(birthDate, attentionDate) {
  const birth = calendarDate(birthDate)
  if (!calendarDate(attentionDate?.slice(0, 10))) return 'No disponible'
  const day = attentionDate?.length === 10 ? attentionDate : appointmentDay(attentionDate)
  const at = calendarDate(day)
  if (!birth || !at || birth.stamp > at.stamp) return 'No disponible'
  let months = (at.year - birth.year) * 12 + at.month - birth.month
  if (at.day < birth.day) months -= 1
  if (months < 1) {
    const days = Math.floor((at.stamp - birth.stamp) / 86400000)
    return `${days} ${days === 1 ? 'día' : 'días'}`
  }
  const years = Math.floor(months / 12), remainder = months % 12
  return [years ? `${years} ${years === 1 ? 'año' : 'años'}` : '', remainder ? `${remainder} ${remainder === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean).join(' y ')
}

export function filterAttentionRows(rows, { petId = '', from = '', to = '', order = 'recientes' } = {}) {
  return rows.filter(row => {
    const day = appointmentDay(row.attention.fechaAtencion)
    return (!petId || sameId(row.pet?.idMascota, petId)) && (!from || day >= from) && (!to || (!!day && day <= to))
  }).sort((a, b) => {
    const first = appointmentTime(a.attention.fechaAtencion), second = appointmentTime(b.attention.fechaAtencion)
    if (!Number.isFinite(first) || !Number.isFinite(second)) return Number.isFinite(first) ? -1 : Number.isFinite(second) ? 1 : 0
    return (order === 'antiguas' ? first - second : second - first) || String(a.attention.idAtencion).localeCompare(String(b.attention.idAtencion))
  })
}

export function attentionPermissions(role) {
  return { write: role === 'VETERINARIO', remove: false, price: role === 'ADMIN' }
}

export function attentionError(error) {
  if (error?.response?.status === 401) return 'Tu sesión no está autorizada o venció. Vuelve a iniciar sesión.'
  if (error?.response?.status === 403) return 'No tienes permiso para consultar este registro.'
  if (error?.response) return error.response.data?.error || error.response.data?.mensaje || `No fue posible consultar el backend (HTTP ${error.response.status}).`
  return error?.request ? 'No fue posible contactar al backend. Intenta nuevamente.' : error?.message || 'No fue posible cargar la información.'
}

export function attentionDate(value, part = 'date') {
  const stamp = appointmentTime(value)
  if (!Number.isFinite(stamp)) return 'No disponible'
  const options = part === 'time' ? { hour: 'numeric', minute: '2-digit', hour12: true }
    : { day: '2-digit', month: part === 'long' ? 'long' : 'short', year: 'numeric' }
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', ...options }).format(new Date(stamp))
}

export const showAttentionPetMetadata = (petId, petCount) => !petId && petCount !== 1
