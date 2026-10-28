import {VACCINES_CHANGED} from '../lib/vaccines'
import AntecedentesCambios from './AntecedentesCambios'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import AntecedentsEditor from './AntecedentsEditor'
import { Activity, BookHeart, CalendarDays, ChevronDown, ChevronUp, ChevronRight, ClipboardPlus, ShieldCheck, Syringe, FileText, Heart, Scissors, UserRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { dateDisplay, fullName, listOf } from '../lib/display'
import { loadClinicalHistory } from '../lib/clinicalHistory'
import { attentionDate, attentionError, loadAttentionDetail } from '../lib/attentions'
import { doseCountdown, hasClinicalText, historyAttentionRow, nextHistoryTab, openingHistoryLabel, ownerClinicalModel, ownerHistoryTabs, vaccineDateLabel, vaccineSupplement } from '../lib/ownerHistory'
import PetAvatar from './PetAvatar'
import PrettySelect from './PrettySelect'
import AttentionDetail from './AttentionDetail'
import OwnerWeightChart from './OwnerWeightChart'
import '../pages/Atenciones.css'
import './OwnerClinicalHistory.css'

const tabLabels = { resumen: 'Resumen', vacunas: 'Vacunas', antecedentes: 'Antecedentes' }
const doseLabels = { VENCIDA: 'Vencida', HOY: 'Corresponde hoy', PROGRAMADA: 'Programada', SIN_PROXIMA_DOSIS: 'Sin próxima dosis' }
function readPets(data) {
  if (!Array.isArray(data) && !Array.isArray(data?.content)) throw new Error('No se pudo interpretar el listado de mascotas.')
  return listOf(data)
}
const text = value => hasClinicalText(value) ? value : 'No registrado'

function ClinicalRow({ title, value, empty, icon: Icon = FileText, tone = '', compact = false }) {
  const present = hasClinicalText(value)
  return <div className={`owner-clinical-row ${present ? tone : ''} ${compact ? 'compact' : ''}`}>
    <span className="owner-row-icon"><Icon size={21}/></span>
    <div><h3>{title}</h3><p>{present ? value : empty}</p></div>
  </div>
}
function Section({ title, icon: Icon, action, children, className = '', description }) {
  return <section className={`owner-history-card ${className}`}>
    <header><div><h2>{Icon && <Icon size={22}/>} {title}</h2>{description && <p className="owner-section-description">{description}</p>}</div>{action}</header>
    {children}
  </section>
}
function VaccineDetails({ vaccine, next }) {
  const [open, setOpen] = useState(false)
  const { observations, nextDose } = vaccineSupplement(vaccine, next)
  if (!observations && !nextDose) return null
  return <details className="owner-vaccine-details" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary aria-expanded={open}><span>{open ? 'Ocultar detalle' : 'Ver detalle'}</span>{open ? <ChevronUp size={15} aria-hidden="true"/> : <ChevronDown size={15} aria-hidden="true"/>}</summary>
    <div>{observations && <div className="owner-vaccine-extra"><strong>Observaciones del veterinario</strong><p className="owner-history-preserve">{observations}</p></div>}{nextDose && <div className="owner-vaccine-extra"><strong>Próxima dosis registrada</strong><p>{dateDisplay(nextDose)}</p></div>}</div>
  </details>
}
function Vaccines({ rows, next, vetName, limit, compact = false }) {
  if (rows == null) return <p className="owner-history-empty" role="alert">No se pudieron cargar las vacunas. Vuelve a cargar el expediente.</p>
  if (!rows.length) return <p className="owner-history-empty">{next ? 'No hay próximas dosis registradas.' : 'No hay aplicaciones registradas por el momento.'}</p>
  return <ul className={`owner-vaccine-list ${compact ? 'compact' : 'expanded'}`}>
    {rows.slice(0, limit ?? rows.length).map(v => {
      const state = v.estadoProximaDosis || v.estado
      const countdown = next ? doseCountdown(v.proximaDosis) : ''
      return <li key={v.idVacuna}>
        <span className="owner-history-icon"><CalendarDays size={21}/></span>
        <div className="owner-vaccine-name"><h3>{text(v.nombre)}</h3>{compact && <p>{vaccineDateLabel(v.proximaDosis)}{countdown && ` · ${countdown}`}</p>}</div>
        {!compact && <>
          <div className="owner-vaccine-vet"><UserRound size={18}/><span>{vetName(v.idVeterinario)}</span></div>
          <div className="owner-vaccine-date"><CalendarDays size={18}/><span><small>{next ? 'Fecha programada' : 'Fecha de aplicación'}</small>{vaccineDateLabel(next ? v.proximaDosis : v.fechaAplicacion)}</span></div>
        </>}
        <span className={`owner-history-badge ${!next ? 'positive' : state === 'VENCIDA' ? 'overdue' : ''}`}>{next ? doseLabels[state] || 'Estado no informado' : 'Aplicada'}</span>
        {!compact && <VaccineDetails vaccine={v} next={next}/>}
      </li>
    })}
  </ul>
}

// El componente se remonta por mascota: ninguna respuesta tardía puede ocupar otro expediente.
function PetRecord({ id, profile, clinical }) {
  const [editing, setEditing] = useState(null)
  const [saved, setSaved] = useState('')
  const [revision, setRevision] = useState(0)
  const [loaded, setLoaded] = useState(null)
  const [tab, setTab] = useState('resumen')
  const [allVisits, setAllVisits] = useState(false)
  const [detail, setDetail] = useState(null)
  const detailAbort = useRef(null)
  const tabs = useRef({})
  useEffect(() => {
    const controller = new AbortController()
    loadClinicalHistory(api, id, controller.signal).then(record => {
      if (!controller.signal.aborted) setLoaded({ revision, record })
    }).catch(error => { if (!controller.signal.aborted) setLoaded({ revision, error }) })
    return () => controller.abort()
  }, [id, revision])
  useEffect(()=>{
    const changed=e=>{if(String(e.detail?.id)===String(id))setRevision(v=>v+1)}
    const focus=()=>{if(!editing)setRevision(v=>v+1)}
    window.addEventListener(VACCINES_CHANGED,changed);window.addEventListener('focus',focus)
    return()=>{window.removeEventListener(VACCINES_CHANGED,changed);window.removeEventListener('focus',focus)}
  },[id,editing])
  useEffect(() => () => detailAbort.current?.abort(), [])
  const current = loaded?.revision === revision ? loaded : null
  const retry = () => setRevision(value => value + 1)
  if (!current) return <p className="owner-history-message" role="status">Cargando expediente clínico…</p>
  if (current.error) return <div className="owner-history-message" role="alert"><p>{attentionError(current.error)}</p><button onClick={retry}>Volver a intentar</button></div>
  const record = current.record, { pet, history, sections } = record
  const model = ownerClinicalModel(record), a = model.antecedentes || {}
  const vetName = idVet => fullName(sections.veterinarios.data?.find(v => String(v.idVeterinario) === String(idVet))) || 'Veterinario no disponible'
  async function openAttention(visit) {
    detailAbort.current?.abort()
    const controller = new AbortController()
    detailAbort.current = controller
    setDetail({ loading: true, visit })
    try {
      const attention = await loadAttentionDetail(api, visit.idAtencion, controller.signal)
      const row = historyAttentionRow(attention, record)
      if (!controller.signal.aborted) setDetail({ row, visit })
    } catch (error) { if (!controller.signal.aborted) setDetail({ error: attentionError(error), visit }) }
  }
  function closeDetail() { detailAbort.current?.abort(); setDetail(null) }
  const manageVaccines = <Link className="owner-history-link" to={`/panel/vacunas?paciente=${encodeURIComponent(id)}`}>Gestionar vacunas <ChevronRight size={14}/></Link>
  const editAction = group => clinical ? <button className="owner-history-link" onClick={() => setEditing(group)} aria-label={`Editar ${group === 'alergias' ? 'alergias' : group === 'medicos' ? 'antecedentes médicos' : group === 'cirugias' ? 'cirugías y procedimientos' : 'cuidados y observaciones'}`}>Editar</button> : null
  const [openingTitle, openingDate] = openingHistoryLabel(history.fechaApertura).split(': ')
  const selectedVisits = model.visits?.slice(0, allVisits ? model.visits.length : 3)
  return <>
    {saved && <p className="vet-history-success" role="status">{saved}</p>}
    <section className="owner-history-pet"><PetAvatar pet={pet} size={96}/><div className="owner-history-identity"><h2>{pet.nombre}</h2><div className="owner-pet-columns"><div>
      <small>{openingDate ? <>{openingTitle}: <strong className="owner-opening-date">{openingDate}</strong></> : openingTitle}</small>
      <dl className="owner-pet-details">
        <div className="owner-pet-field"><dt>Propietario</dt><dd>{pet.nombrePropietario || fullName(profile) || 'No registrado'}</dd></div>
        <div className="owner-pet-field"><dt>Teléfono del propietario</dt><dd>{history.telefonoPropietario || profile?.nroCelular || 'No registrado'}</dd></div>
        <div className="owner-pet-field"><dt>Nacimiento</dt><dd>{dateDisplay(pet.fechaNacimiento)}</dd></div>
      </dl>
    </div><dl className="owner-pet-traits">
      <div className="owner-pet-field"><dt>Especie</dt><dd>{text(pet.especie)}</dd></div>
      <div className="owner-pet-field"><dt>Raza</dt><dd>{text(pet.raza)}</dd></div>
      <div className="owner-pet-field"><dt>Sexo</dt><dd>{text(pet.sexo)}</dd></div>
      <div className="owner-pet-field"><dt>Edad</dt><dd>{model.age}</dd></div>
    </dl></div></div><div className="owner-history-latest"><span>Último peso registrado</span><strong>{model.weight.latest ? <>{model.weight.latest.weight} <small>kg</small></> : 'No disponible'}</strong>{model.weight.latest && <small>{attentionDate(model.weight.latest.date)}</small>}{model.weight.delta != null && <small>{model.weight.delta > 0 ? '+' : ''}{model.weight.delta} kg respecto al anterior</small>}</div></section>
    <div className="owner-history-tabs" role="tablist" aria-label="Secciones del expediente">{ownerHistoryTabs.map(key => <button key={key} ref={node => { tabs.current[key] = node }} id={`history-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls={`history-panel-${key}`} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)} onKeyDown={event => { const next = nextHistoryTab(tab, event.key); if (next !== tab) { event.preventDefault(); setTab(next); tabs.current[next]?.focus() } }}>{tabLabels[key]}</button>)}</div>
    {Object.values(sections).some(s => s.error) && <div className="owner-history-warning" role="alert">Parte del expediente no se pudo cargar. Los datos no disponibles no se consideran registros vacíos. <button onClick={retry}>Volver a cargar</button></div>}
    <div role="tabpanel" id={`history-panel-${tab}`} aria-labelledby={`history-tab-${tab}`} tabIndex={0}>
      {tab === 'resumen' && <div className="owner-history-panels">
        <div className="owner-history-top-grid">
          <Section title="Información importante" icon={ShieldCheck} className="owner-summary-important">
            <ClinicalRow title="Alergias" icon={model.allergy.status === 'none' ? CheckCircle2 : model.allergy.status === 'known' ? AlertCircle : ShieldCheck} value={model.allergy.status === 'known' ? a.alergiasSustancias : model.allergy.label} tone={model.allergy.status === 'known' ? 'warning' : model.allergy.status === 'none' ? 'confirmed' : ''} compact/>
            <ClinicalRow title="Antecedentes de riesgo" icon={FileText} value={[a.alertasMedicas, a.enfermedadesRelevantes, a.cirugiasPrevias].filter(hasClinicalText).join('\n')} empty="No hay antecedentes médicos registrados por el momento." tone={hasClinicalText(a.alertasMedicas) ? 'warning' : ''} compact/>
            <ClinicalRow title="Cuidados actuales" icon={Heart} value={a.notasMedicas} empty="No hay indicaciones especiales registradas." compact/>
            <button className="owner-history-link owner-important-link" onClick={() => { setTab('antecedentes'); tabs.current.antecedentes?.focus() }}>{clinical ? 'Editar antecedentes' : 'Ver antecedentes'} <ChevronRight size={14}/></button>
          </Section>
          <Section title="Próximas vacunas" icon={Syringe} action={clinical ? manageVaccines : <button className="owner-history-link" onClick={() => { setTab('vacunas'); tabs.current.vacunas?.focus() }}>Ver todas <ChevronRight size={15}/></button>}>
            <Vaccines rows={model.doses} next vetName={vetName} limit={3} compact/>
          </Section>
        </div>
        <div className="owner-history-bottom-grid">
          <Section title={allVisits ? 'Atenciones clínicas' : 'Últimas atenciones'} icon={ClipboardPlus} action={model.visits?.length > 3 && <button className="owner-history-link" onClick={() => setAllVisits(value => !value)}>{allVisits ? 'Ver últimas tres' : 'Ver todas'} <ChevronRight size={15}/></button>}>
            {selectedVisits == null ? <p className="owner-history-empty">No se pudieron cargar las atenciones.</p> : !selectedVisits.length ? <p className="owner-history-empty">Todavía no hay atenciones clínicas registradas.</p> : <ul className="owner-history-visits">{selectedVisits.map(visit => <li key={visit.idAtencion}>
              <button onClick={() => openAttention(visit)}><span className="owner-visit-date"><CalendarDays size={18}/><span>{attentionDate(visit.fechaAtencion)}<small>{attentionDate(visit.fechaAtencion, 'time')}</small></span></span><span className="owner-visit-diagnosis"><strong>{visit.diagnostico || 'Diagnóstico no registrado'}</strong><small>{vetName(visit.idVeterinario)}</small></span><ChevronRight size={18}/></button>
            </li>)}</ul>}
          </Section>
          <Section title="Evolución del peso" icon={Activity}><OwnerWeightChart evolution={model.weight}/>{clinical && <p className="owner-history-caption">Mediciones de las atenciones autorizadas para tu cuenta.</p>}</Section>
        </div>
      </div>}
      {tab === 'vacunas' && <div className="owner-history-panels">
        {clinical && <div className="vet-history-toolbar">{manageVaccines}</div>}
        <Section title="Próximas dosis" icon={CalendarDays} description={`Dosis registradas para ${pet.nombre}.`}><Vaccines rows={model.doses} next vetName={vetName}/></Section>
        <Section title="Historial de aplicaciones" icon={ShieldCheck} description="Vacunas aplicadas, de más recientes a más antiguas."><Vaccines rows={model.applied} vetName={vetName}/></Section>
      </div>}
      {tab === 'antecedentes' && <div className="owner-history-panels">
        <AntecedentesCambios historyId={history.idHistoria} version={a.version}/>
        <div className="owner-antecedents-grid">
          <div className="owner-antecedents-column">
            <Section title="Alergias" icon={ShieldCheck} action={editAction('alergias')}>
              <ClinicalRow title={model.allergy.status === 'known' ? 'Sustancias o medicamentos' : 'Evaluación de alergias'} value={model.allergy.status === 'known' ? a.alergiasSustancias : model.allergy.label} icon={model.allergy.status === 'known' ? AlertCircle : model.allergy.status === 'none' ? CheckCircle2 : ShieldCheck} tone={model.allergy.status === 'known' ? 'warning' : model.allergy.status === 'none' ? 'confirmed' : ''}/>
              {hasClinicalText(a.alergiasReacciones) && <ClinicalRow title="Reacciones conocidas" value={a.alergiasReacciones} icon={Activity}/>}
              {hasClinicalText(a.alergiasObservaciones) && <ClinicalRow title="Observaciones" value={a.alergiasObservaciones}/>}
            </Section>
            <Section title="Cirugías y procedimientos" icon={Scissors} action={editAction('cirugias')}><ClinicalRow title="Procedimientos anteriores" value={a.cirugiasPrevias} empty="No hay procedimientos anteriores registrados." icon={CalendarDays}/></Section>
          </div>
          <div className="owner-antecedents-column">
            <Section title="Enfermedades previas o crónicas" icon={Heart} action={editAction('medicos')}><ClinicalRow title="Condiciones y seguimiento" value={a.enfermedadesRelevantes} empty="No hay enfermedades previas documentadas." icon={BookHeart}/></Section>
            <Section title="Cuidados y observaciones importantes" icon={FileText} action={editAction('cuidados')}>
              <ClinicalRow title="Recomendaciones y cuidados" value={a.notasMedicas} empty="No hay recomendaciones especiales registradas." icon={FileText}/>
              {hasClinicalText(a.alertasMedicas) && <ClinicalRow title="Alertas médicas" value={a.alertasMedicas} tone="warning" icon={AlertCircle}/>}
            </Section>
          </div>
        </div>
        {a.actualizadoEn && <p className="owner-history-caption">Última actualización: {attentionDate(a.actualizadoEn)} · {a.veterinarioNombre || 'Profesional no disponible'} · {clinical ? 'Edición clínica autorizada.' : 'Consulta de solo lectura.'}</p>}
      </div>}

    </div>
    {clinical && editing && <AntecedentsEditor key={editing} group={editing} history={history} pet={pet} onClose={() => setEditing(null)} onDone={updated => { setLoaded({ revision, record: { ...record, history: updated } }); setEditing(null); setSaved('Antecedentes guardados correctamente.') }}/>}
    {clinical && tab === 'resumen' && <div className="vet-history-toolbar"><Link className="owner-history-link" to="/panel/atenciones">Abrir Atenciones clínicas <ChevronRight size={14}/></Link></div>}
    {detail && <AttentionDetail state={detail} row={detail.row} onClose={closeDetail} onRetry={() => openAttention(detail.visit)}/>}
  </>
}
export default function OwnerClinicalHistory() {
  const { profile, user } = useAuth()
  const clinical = user?.role === 'VETERINARIO'
  const location = useLocation()
  const requested = new URLSearchParams(location.search).get('paciente') || ''
  const [list, setList] = useState(null)
  const [selection, setSelection] = useState(requested)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    api.get('/mascotas', { signal: controller.signal }).then(({ data }) => { if (!controller.signal.aborted) setList({ pets: readPets(data), revision }) }).catch(error => { if (!controller.signal.aborted) setList({ error, revision }) })
    return () => controller.abort()
  }, [revision])
  const current = list?.revision === revision ? list : null
  const pets = current?.pets || [], selected = String(pets.find(p => String(p.idMascota) === selection)?.idMascota || pets[0]?.idMascota || '')
  return <section className={`owner-history ${clinical ? 'vet-history' : ''}`}><div className="owner-history-heading"><div><h1>Historial clínico</h1><p>{clinical ? 'Consulta y actualiza la información clínica de tus pacientes autorizados.' : 'El expediente y la evolución de salud de tus mascotas.'}</p></div>{pets.length > 0 && <PrettySelect label={clinical ? 'Seleccionar paciente del expediente' : 'Seleccionar mascota del expediente'} value={selected} options={pets.map(p => ({ value: p.idMascota, label: p.nombre }))} onChange={setSelection} required keyboardNavigation/>}</div>{!current ? <p role="status" className="owner-history-message">Cargando tus mascotas…</p> : current.error ? <div className="owner-history-message" role="alert"><p>{attentionError(current.error)}</p><button onClick={() => setRevision(value => value + 1)}>Volver a intentar</button></div> : !pets.length ? <p className="owner-history-message">{clinical ? 'No hay pacientes autorizados disponibles.' : 'Todavía no tienes mascotas registradas.'}</p> : <PetRecord key={selected} id={selected} profile={clinical ? null : profile} clinical={clinical}/>}</section>
}
