import {useSearchParams} from 'react-router-dom'
import AntecedentesCambios from '../components/AntecedentesCambios'
import { useEffect, useRef, useState } from 'react'
import { BookHeart, CalendarDays, ClipboardPlus, RefreshCw, ShieldCheck, Syringe } from 'lucide-react'
import PetAvatar from '../components/PetAvatar'
import OwnerClinicalHistory from '../components/OwnerClinicalHistory'
import PrettySelect from '../components/PrettySelect'
import { useAuth } from '../contexts/AuthContext'
import { api, errorText } from '../lib/api'
import { dateDisplay, fullName, listOf } from '../lib/display'
import { clinicalSummary, clinicalTimeline, loadClinicalHistory, sortClinicalEvents } from '../lib/clinicalHistory'

const labels = { atenciones: 'Atenciones clínicas', vacunas: 'Vacunas', citas: 'Citas', veterinarios: 'Profesionales' }
const roleDescription = {
  ADMIN: 'Vista administrativa de los registros clínicos autorizados.',
  VETERINARIO: 'Se muestran tus atenciones y citas asignadas, y las vacunas autorizadas del paciente. Los contadores reflejan ese alcance.',
  PROPIETARIO: 'Consulta los registros de salud de tus mascotas. Los datos clínicos los registra el equipo autorizado.',
}
const dateTime = value => value ? `${dateDisplay(value)}${String(value).includes('T') ? ` · ${String(value).slice(11, 16)}` : ''}` : 'Fecha no registrada'
const readableError = error => error?.response || error?.request ? errorText(error) : error?.message || 'No se pudo cargar la información.'
const money = value => value == null ? 'No registrado' : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

function Detail({ label, children }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold text-vetcare-text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{children ?? 'No registrado'}</dd></div>
}

function EventCard({ event, vetName }) {
  const { type, item } = event
  const applied = type === 'vacunas' && !!item.fechaAplicacion
  const Icon = type === 'atenciones' ? ClipboardPlus : type === 'vacunas' ? Syringe : CalendarDays
  const title = type === 'atenciones' ? `Atención clínica #${item.idAtencion}` : type === 'vacunas' ? item.nombre : `Cita #${item.idCita}`
  const state = type === 'atenciones' ? 'Registrada' : type === 'vacunas' ? applied ? 'Aplicada' : 'Programada' : item.estado
  const positive = type === 'atenciones' || applied || item.estado === 'ATENDIDA'
  return <li className="relative pl-8 sm:pl-12 pb-6 last:pb-0">
    <span className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full border border-violet-200 bg-[#f2eafd] text-[#6521b4]"><Icon size={16}/></span>
    <article className="rounded-2xl border border-vetcare-soft bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-vetcare-text-muted">{type === 'citas' ? 'Agenda · fecha de la cita' : applied ? 'Fecha de aplicación' : type === 'vacunas' ? 'Dosis programada' : 'Fecha de atención'} · {dateTime(event.date)}</p><h3 className="mt-1 text-lg font-extrabold">{title}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-800' : item.estado === 'CANCELADA' ? 'bg-slate-100 text-slate-600' : 'bg-violet-50 text-violet-800'}`}>{state || 'Estado no registrado'}</span></div>
      <p className="mt-3 text-sm text-vetcare-text-muted">{vetName(item.idVeterinario)}</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {type === 'atenciones' && <><Detail label="Síntomas">{item.sintoma || 'No registrados'}</Detail><Detail label="Diagnóstico">{item.diagnostico || 'No registrado'}</Detail><Detail label="Tratamiento">{item.tratamiento || 'No registrado'}</Detail><Detail label="Observaciones">{item.observacion || 'Sin observaciones registradas'}</Detail><Detail label="Peso">{item.peso == null ? 'No registrado' : `${item.peso} kg`}</Detail><Detail label="Importe de atención">{money(item.precioAtencion)}</Detail><Detail label="Cita relacionada">{item.idCita == null ? 'No registrada' : `#${item.idCita}`}</Detail></>}
        {type === 'vacunas' && <><Detail label="Próxima dosis">{item.proximaDosis ? dateDisplay(item.proximaDosis) : 'Sin próxima dosis registrada'}</Detail><Detail label="Seguimiento">{doseState(item)}</Detail><Detail label="Atención relacionada">{item.idAtencion == null ? 'Sin atención asociada' : `#${item.idAtencion}`}</Detail><Detail label="Observaciones">{item.observaciones || 'Sin observaciones registradas'}</Detail></>}
        {type === 'citas' && <><Detail label="Motivo">{item.motivoCita || 'No registrado'}</Detail><Detail label="Registro">{item.estado === 'ATENDIDA' ? 'Cita atendida. Los hallazgos clínicos se muestran en la atención correspondiente.' : 'Registro de agenda; no constituye una atención clínica.'}</Detail></>}
      </dl>
    </article>
  </li>
}

function doseState(vaccine) {
  return ({ VENCIDA: 'Dosis vencida', HOY: 'Corresponde hoy', PROGRAMADA: 'Dosis futura', SIN_PROXIMA_DOSIS: 'Sin próxima dosis' })[vaccine.estadoProximaDosis || vaccine.estado] || 'Estado no informado'
}

function ClinicalRecord({ user }) {
  const [pets, setPets] = useState([])
  const [petsLoading, setPetsLoading] = useState(true)
  const [petsError, setPetsError] = useState('')
  const [params]=useSearchParams()
  const [id, setId] = useState(()=>params.get('paciente')||'')
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [order, setOrder] = useState('recientes')
  const [petsVersion, setPetsVersion] = useState(0)
  const request = useRef(null)
  const generation = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    let live = true
    api.get('/mascotas', { signal: controller.signal }).then(({ data }) => {
      if (live) { setPets(listOf(data)); setPetsError(''); setPetsLoading(false) }
    }).catch(err => { if (live) { setPetsError(readableError(err)); setPetsLoading(false) } })
    return () => { live = false; controller.abort() }
  }, [petsVersion, user?.role, user?.idUsuario])
  useEffect(() => () => { generation.current += 1; request.current?.abort() }, [])

  function reset(nextId = '') {
    generation.current += 1
    request.current?.abort()
    setId(nextId); setRecord(null); setError(''); setNotice(''); setBusy(false); setFilter('todos')
  }
  async function consult(event) {
    event?.preventDefault()
    if (!id) { setNotice('Selecciona una mascota antes de consultar su expediente.'); return }
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    const version = ++generation.current
    setBusy(true); setError(''); setNotice(''); setRecord(null)
    try {
      const data = await loadClinicalHistory(api, id, controller.signal)
      if (version === generation.current) setRecord(data)
    } catch (err) {
      if (version === generation.current && !controller.signal.aborted) setError(readableError(err))
    } finally { if (version === generation.current) setBusy(false) }
  }

  const summary = record ? clinicalSummary(record.sections) : null
  const events = record ? sortClinicalEvents(clinicalTimeline(record.sections).filter(e => filter === 'todos' || e.type === filter), order === 'antiguos') : []
  const doses = record?.sections.vacunas.data?.filter(v => v.proximaDosis).sort((a, b) => a.proximaDosis.localeCompare(b.proximaDosis)) || []
  const vetName = vetId => {
    const vet = record?.sections.veterinarios.data?.find(v => String(v.idVeterinario) === String(vetId))
    return fullName(vet) || (vetId == null ? 'Veterinario no registrado' : `Veterinario #${vetId}${record?.sections.veterinarios.error ? ' · nombre no disponible' : ''}`)
  }
  const sectionsFailed = record && Object.values(record.sections).some(section => section.error)

  return <section className="space-y-6 pb-8">
    <header><p className="text-xs font-extrabold tracking-widest text-[#9b3a9f]">EXPEDIENTE PRIVADO</p><h1 className="mt-2 text-3xl font-black flex items-center gap-3"><BookHeart className="text-[#6521b4]"/> Historial clínico</h1><p className="mt-2 text-vetcare-text-muted">Atenciones, vacunación y seguimiento de cada paciente en un solo lugar.</p><p className="mt-2 text-sm text-vetcare-text-muted flex items-start gap-2"><ShieldCheck size={17} className="shrink-0 mt-0.5"/>{roleDescription[user?.role] || 'Información disponible según los permisos de tu cuenta.'}</p></header>
    <form onSubmit={consult} className="relative z-20 rounded-2xl border border-vetcare-soft bg-white p-5 flex items-end gap-3 flex-wrap">
      <label className="block w-full sm:w-80"><span className="block text-sm font-semibold mb-2">Mascota</span><PrettySelect label="Mascota" placeholder={petsLoading ? 'Cargando mascotas…' : 'Seleccionar mascota'} value={id} options={pets.map(p => ({ value: p.idMascota, label: p.nombre || `Mascota #${p.idMascota}` }))} onChange={reset}/></label>
      <button className="btn btn-primary" disabled={busy || petsLoading || !!petsError}><BookHeart size={17}/>{busy ? 'Cargando expediente…' : record ? 'Actualizar expediente' : 'Consultar expediente'}</button>
      <button type="button" className="btn btn-ghost" onClick={() => reset()}><RefreshCw size={16}/> Limpiar</button>
    </form>
    {petsError && <div role="alert" className="rounded-xl bg-red-50 text-red-800 p-4"><p>No se pudieron cargar las mascotas: {petsError}</p><button className="btn btn-ghost mt-2" onClick={() => { setPetsLoading(true); setPetsError(''); setPetsVersion(v => v + 1) }}>Reintentar carga de mascotas</button></div>}
    {!petsLoading && !petsError && !pets.length && <p className="rounded-2xl border border-dashed border-violet-200 bg-white p-6 text-vetcare-text-muted">No hay mascotas disponibles para tu cuenta.</p>}
    {notice && <p role="status" className="text-sm text-vetcare-text-muted">{notice}</p>}
    {busy && <p role="status" aria-live="polite" className="rounded-xl bg-violet-50 p-4 text-violet-800">Consultando los registros clínicos autorizados…</p>}
    {error && <div role="alert" className="rounded-xl bg-red-50 text-red-800 p-4"><p>No se pudo abrir el expediente: {error}</p><button className="btn btn-ghost mt-2" onClick={() => consult()}>Reintentar consulta</button></div>}
    {!record && !busy && !error && pets.length > 0 && <p className="text-vetcare-text-muted text-sm">Selecciona una mascota y consulta su expediente para ver los registros disponibles.</p>}
    {record && <>
      <article className="rounded-2xl border border-violet-200 bg-[#faf7ff] p-6"><h2 className="font-extrabold text-2xl flex items-center gap-2"><PetAvatar pet={record.pet} size={48}/>{record.pet.nombre}</h2><p className="mt-1 text-sm text-vetcare-text-muted">Historia #{record.history.idHistoria} · Apertura: {dateTime(record.history.fechaApertura)}</p><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Especie">{record.pet.especie}</Detail><Detail label="Raza">{record.pet.raza || 'No registrada'}</Detail><Detail label="Sexo">{record.pet.sexo || 'No registrado'}</Detail><Detail label="Nacimiento">{record.pet.fechaNacimiento ? dateDisplay(record.pet.fechaNacimiento) : 'No registrado'}</Detail><Detail label="Propietario">{record.pet.nombrePropietario || 'No informado'}</Detail><Detail label="Paciente">#{record.pet.idMascota}</Detail><Detail label="Último peso registrado">{summary.latestWeight ? `${summary.latestWeight.peso} kg · ${dateDisplay(summary.latestWeight.fechaAtencion)}` : record.sections.atenciones.error ? 'No disponible' : 'Sin medición registrada'}</Detail></dl></article>
      <section aria-label="Resumen clínico" className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[['Atenciones visibles', summary.visits], ['Vacunas aplicadas', summary.applied], ['Dosis desde hoy', summary.nextDoses], ['Citas relacionadas', summary.appointments]].map(([label, count]) => <article key={label} className="rounded-2xl border border-vetcare-soft bg-white p-5"><p className="text-sm text-vetcare-text-muted">{label}</p><p className={`mt-2 font-black ${count == null ? 'text-base text-vetcare-text-muted' : 'text-3xl text-[#51209b]'}`}>{count ?? 'No disponible'}</p></article>)}</section>
      {Object.entries(record.sections).filter(([, section]) => section.error).map(([key, section]) => <div key={key} role="alert" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm"><strong>{labels[key]} no disponibles.</strong> {readableError(section.error)} <button className="underline font-semibold" onClick={() => consult()}>Reintentar expediente</button></div>)}
      <section className="rounded-2xl border border-vetcare-soft bg-white p-5 sm:p-6"><h2 className="text-xl font-extrabold flex items-center gap-2"><Syringe size={21}/> Seguimiento de dosis</h2><p className="mt-1 text-sm text-vetcare-text-muted">Próximas dosis registradas, incluidas las asociadas a vacunas ya aplicadas.</p>{summary.overdueDoses > 0 && <p className="mt-3 text-sm font-semibold text-amber-800">{summary.overdueDoses} dosis con fecha vencida.</p>}{record.sections.vacunas.error ? <p className="mt-4 text-sm text-amber-800">No se pudo consultar el seguimiento de vacunación.</p> : doses.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{doses.map(v => <li key={v.idVacuna} className="rounded-xl border border-violet-100 bg-[#fbf9fd] p-4"><p className="font-bold">{v.nombre}</p><p className="mt-1 text-sm">{dateDisplay(v.proximaDosis)} · {doseState(v)}</p><p className="mt-1 text-xs text-vetcare-text-muted">{vetName(v.idVeterinario)} · vacuna #{v.idVacuna}</p></li>)}</ul> : <p className="mt-4 text-sm text-vetcare-text-muted">No hay próximas dosis registradas.</p>}</section>
      <AntecedentesCambios historyId={record.history.idHistoria} version={record.history.antecedentes?.version}/><section aria-labelledby="clinical-timeline-title"><div className="flex flex-wrap items-end justify-between gap-4 mb-5"><div><h2 id="clinical-timeline-title" className="text-2xl font-extrabold">Cronología clínica</h2><p className="text-sm text-vetcare-text-muted mt-1">Las citas representan agenda; las atenciones contienen los hallazgos clínicos.</p></div><div className="flex flex-wrap gap-3"><label className="text-sm font-semibold">Registros<select className="input mt-1" value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todos</option><option value="atenciones">Atenciones</option><option value="vacunas">Vacunas</option><option value="citas">Citas</option></select></label><label className="text-sm font-semibold">Orden<select className="input mt-1" value={order} onChange={e => setOrder(e.target.value)}><option value="recientes">Más recientes primero</option><option value="antiguos">Más antiguos primero</option></select></label></div></div>
        {events.length ? <ol className="relative before:absolute before:bottom-0 before:left-4 before:top-3 before:w-px before:bg-violet-200">{events.map(event => <EventCard key={event.key} event={event} vetName={vetName}/>)}</ol> : <p className="rounded-2xl border border-dashed border-violet-200 bg-white p-8 text-vetcare-text-muted">{filter !== 'todos' && record.sections[filter].error ? 'Esta sección no está disponible. Reintenta la consulta.' : sectionsFailed && filter === 'todos' ? 'No hay registros en las secciones cargadas. Algunas secciones no se pudieron consultar.' : filter === 'todos' ? 'La historia está abierta y todavía no tiene atenciones, vacunas ni citas visibles.' : `No hay registros de ${labels[filter].toLowerCase()} visibles para esta mascota.`}</p>}
      </section>
    </>}
  </section>
}

// Un cambio de identidad o rol descarta inmediatamente todo el expediente previo.
export default function HistoriaClinica() {
  const { user } = useAuth()
  if (['PROPIETARIO', 'VETERINARIO'].includes(user?.role)) return <OwnerClinicalHistory key={`${user?.idUsuario || ''}-${user?.role || ''}`}/>
  return <ClinicalRecord key={`${user?.idUsuario || ''}-${user?.role || ''}`} user={user}/>
}
