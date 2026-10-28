import {pendingDoseRows} from './vaccineDoses.js'
import { fullName } from './display.js'
import { appointmentTime } from './vetAgenda.js'
import { historicalAge } from './attentions.js'
import { limaToday } from './clinicalHistory.js'

export const ownerHistoryTabs = ['resumen', 'vacunas', 'antecedentes']
export const hasClinicalText = value => typeof value === 'string' && !!value.trim()
export function orderedVisits(visits) {
  return [...(visits || [])].sort((a, b) => {
    const x = appointmentTime(a.fechaAtencion), y = appointmentTime(b.fechaAtencion)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return Number.isFinite(x) ? -1 : Number.isFinite(y) ? 1 : 0
    return y - x || String(a.idAtencion).localeCompare(String(b.idAtencion))
  })
}
export function weightEvolution(visits) {
  if (visits == null) return { available: false, measurements: [], latest: null, delta: null }
  const measurements = orderedVisits(visits).filter(a => a.peso != null && String(a.peso).trim() !== '' && Number.isFinite(Number(a.peso)) && Number(a.peso) > 0 && Number.isFinite(appointmentTime(a.fechaAtencion)))
    .reverse().map(a => ({ id: a.idAtencion, date: a.fechaAtencion, weight: Number(a.peso) }))
  const latest = measurements.at(-1) || null, previous = measurements.at(-2)
  return { available: true, measurements, latest, delta: previous && latest ? Math.round((latest.weight - previous.weight) * 1000) / 1000 : null }
}
export function allergyEvaluation(antecedentes) {
  const a = antecedentes || {}
  if (a.estadoAlergias === 'ALERGIAS_REGISTRADAS' && hasClinicalText(a.alergiasSustancias)) return { status: 'known', label: 'Alergias registradas' }
  if (a.estadoAlergias === 'SIN_ALERGIAS_CONOCIDAS' && a.actualizadoEn && a.veterinarioNombre) return { status: 'none', label: 'Sin alergias conocidas, según la evaluación registrada.' }
  return { status: 'unknown', label: a.estadoAlergias === 'NO_EVALUADAS' ? 'Información sobre alergias pendiente de evaluación.' : 'Información sobre alergias aún no registrada.' }
}
export function ownerClinicalModel(record, today = limaToday()) {
  const sections = record.sections
  const vaccines = sections.vacunas.data
  return {
    age: historicalAge(record.pet.fechaNacimiento, today),
    visits: sections.atenciones.data == null ? null : orderedVisits(sections.atenciones.data),
    weight: weightEvolution(sections.atenciones.data),
    doses: vaccines == null ? null : pendingDoseRows(vaccines).sort((a, b) => a.proximaDosis.localeCompare(b.proximaDosis)),
    applied: vaccines == null ? null : vaccines.filter(v => v.fechaAplicacion).sort((a, b) => b.fechaAplicacion.localeCompare(a.fechaAplicacion)),
    antecedentes: record.history.antecedentes || null,
    allergy: allergyEvaluation(record.history.antecedentes),
  }
}
export function historyAttentionRow(attention, record) {
  if (!attention || String(attention.idHistoria) !== String(record.history.idHistoria)) throw new Error('La atención no pertenece al expediente seleccionado.')
  const vet = record.sections.veterinarios.data?.find(v => String(v.idVeterinario) === String(attention.idVeterinario))
  const cita = record.sections.citas.data?.find(c => String(c.idCita) === String(attention.idCita))
  return { attention, pet: record.pet, vet, cita, vetName: fullName(vet) || 'Veterinario no disponible' }
}
export function nextHistoryTab(current, key) {
  const index = ownerHistoryTabs.indexOf(current)
  if (key === 'Home') return ownerHistoryTabs[0]
  if (key === 'End') return ownerHistoryTabs.at(-1)
  if (key === 'ArrowRight') return ownerHistoryTabs[(index + 1) % ownerHistoryTabs.length]
  if (key === 'ArrowLeft') return ownerHistoryTabs[(index + ownerHistoryTabs.length - 1) % ownerHistoryTabs.length]
  return current
}

// Fechas de calendario: evita aceptar días inexistentes que Date normalizaría.
function calendarDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() : null
}
export function openingHistoryLabel(value) {
  const day = typeof value === 'string' ? value.slice(0, 10) : ''
  const validFormat = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value || '')
  const time = typeof value === 'string' && value.length > 10 ? value.slice(11, 19).split(':').map(Number) : [0, 0, 0]
  if (time[0] > 23 || time[1] > 59 || time[2] > 59) return 'Fecha de apertura no disponible'
  if (!validFormat || calendarDay(day) == null || (value.length > 10 && !Number.isFinite(appointmentTime(value)))) return 'Fecha de apertura no disponible'
  return `Apertura del historial clínico: ${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`
}
export function doseCountdown(date, today = limaToday()) {
  const next = calendarDay(date), current = calendarDay(today)
  if (next == null || current == null) return ''
  const days = Math.round((next - current) / 86400000)
  return days === 0 ? 'Hoy' : days > 0 ? `En ${days} ${days === 1 ? 'día' : 'días'}` : `Hace ${-days} ${days === -1 ? 'día' : 'días'}`
}
export function vaccineDateLabel(value) {
  const day = calendarDay(value)
  return day == null ? 'Fecha no disponible' : new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(day))
}

// Complemento de lectura: no repite la fecha visible en una fila de próxima dosis.
export function vaccineSupplement(vaccine, nextDoseRow = false) {
  return {
    observations: hasClinicalText(vaccine?.observaciones) ? vaccine.observaciones : null,
    nextDose: !nextDoseRow && calendarDay(vaccine?.proximaDosis) != null ? vaccine.proximaDosis : null,
  }
}
