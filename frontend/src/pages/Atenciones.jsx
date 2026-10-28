import ClinicalVaccination from '../components/ClinicalVaccination'
import {vaccinationPayload} from '../lib/clinicalVaccination'
import {notifyVaccinesChanged} from '../lib/vaccines'
import {useCitaToast} from '../lib/useCitaToast'
import PrecioAtencion from '../components/PrecioAtencion'
import {Link,useNavigate} from 'react-router-dom'
import AntecedentsEditor from '../components/AntecedentsEditor'
import AntecedentesConsulta from '../components/AntecedentesConsulta'
import {clinicalPayload,professionalName,validateClinicalValues} from '../lib/clinicalAppointments'
import {appointmentTime} from '../lib/vetAgenda'
import CitaToast from '../components/CitaToast'
import '../components/Appointments.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownUp, ArrowRight, CalendarDays, CheckCircle2, Clock3, ClipboardPlus, HeartPulse, MessageCircle, PawPrint, Pencil, Pill, RefreshCw, Trash2, UserRound, Weight, X, Save, AlertCircle } from 'lucide-react'
import { api,errorText } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import PrettySelect from '../components/PrettySelect'
import PetAvatar from '../components/PetAvatar'
import AttentionDetail from '../components/AttentionDetail'
import { attentionDate, attentionError, attentionPermissions, attentionRows, filterAttentionRows, historicalAge, loadAttentionDetail, loadAttentions, showAttentionPetMetadata } from '../lib/attentions'
import './Atenciones.css'

export function AtencionForm({ mode, item, citas, mascotas, veterinarios = [], onClose, onDone, onBusyChange }) {
  const {user,vet}=useAuth()
  const role=user?.role
  const sending=useRef(false),opening=useRef(null)
  const cita=citas.find(c=>String(c.idCita)===String(item?.idCita))
  const [values,setValues]=useState({peso:item?.peso??'',precioAtencion:item?.precioAtencion??'',sintoma:item?.sintoma??'',diagnostico:item?.diagnostico??'',tratamiento:item?.tratamiento??'',observacion:item?.observacion??''})
  const [error,setError]=useState(''),[fieldErrors,setFieldErrors]=useState({}),[busy,setBusy]=useState(false),[context,setContext]=useState(null),[editingAntecedent,setEditingAntecedent]=useState(null),[historyError,setHistoryError]=useState(''),[historyLoading,setHistoryLoading]=useState(false)
  const [clinicalMessage,setClinicalMessage]=useCitaToast()
  const [vaccination,setVaccination]=useState([]),[pendingVaccines,setPendingVaccines]=useState([])
  useEffect(()=>{onBusyChange?.(busy||!!editingAntecedent);return()=>onBusyChange?.(false)},[busy,editingAntecedent,onBusyChange])
  useEffect(()=>{
    if(mode!=='create'||!cita)return
    let active=true
    // Una apertura del modal inicia una sola solicitud POST, también en StrictMode.
    if(!opening.current)opening.current=Promise.all([api.post(`/citas/${cita.idCita}/iniciar-atencion`),api.get(`/historias-clinicas/mascota/${cita.idMascota}`)])
    opening.current.then(([{data:confirmed},{data:history}])=>{
      if(String(confirmed.idCita)!==String(cita.idCita)||String(confirmed.idMascota)!==String(cita.idMascota)||String(history.idMascota)!==String(cita.idMascota))throw Error('La información recibida no corresponde a la cita seleccionada.')
      if(active)setContext({cita:confirmed,history:history.idHistoria,expediente:history})
    }).catch(err=>{if(active)setError(err.response?errorText(err):err.message)})
    return()=>{active=false}
  },[mode,cita])
  async function submit(event){
    event.preventDefault();if(sending.current)return;setError('');const validation=validateClinicalValues(values);setFieldErrors(validation);if(Object.keys(validation).length)return
    if(mode==='create'&&!context){setError('No se pudo habilitar esta cita. Cierra el formulario y actualiza la agenda para reintentar.');return}
    sending.current=true;setBusy(true)
    try{const payload=clinicalPayload(values,mode==='create'?context.cita:null,context?.history,role)
      if(mode==='create'){if(role==='VETERINARIO'&&vaccination.length)payload.vacunas=vaccinationPayload(vaccination,pendingVaccines);await api.post('/atenciones',payload);if(vaccination.length)notifyVaccinesChanged(cita.idMascota);}else await api.put(`/atenciones/${item.idAtencion}`,payload)
      onDone()
    }catch(err){setFieldErrors(err.response?.data?.campos||{});setError(err.response?errorText(err):err.message)}finally{sending.current=false;setBusy(false)}
  }
  const patient=mascotas.find(m=>String(m.idMascota)===String(cita?.idMascota)),professional=veterinarios.find(v=>String(v.idVeterinario)===String(cita?.idVeterinario))||(String(vet?.idVeterinario)===String(cita?.idVeterinario)?vet:null)
  const change=key=>event=>{setValues(v=>({...v,[key]:event.target.value}));setFieldErrors(current=>({...current,[key]:undefined}))}
  async function refreshHistory(){
    if(!context)return;setHistoryLoading(true);setHistoryError('')
    try{const {data}=await api.get(`/historias-clinicas/${context.history}`);if(String(data.idMascota)!==String(cita.idMascota)||String(data.idHistoria)!==String(context.history))throw Error('El expediente no corresponde al paciente de esta cita.');setContext(current=>({...current,expediente:data}))}
    catch(err){setHistoryError(err.response?errorText(err):err.message)}finally{setHistoryLoading(false)}
  }
  function savedAntecedents(history){
    if(String(history.idMascota)!==String(cita.idMascota)||String(history.idHistoria)!==String(context.history)){setHistoryError('El expediente recibido no corresponde al paciente.');return}
    setContext(current=>({...current,expediente:history}));setEditingAntecedent(null);setClinicalMessage('Antecedentes actualizados en el expediente.');
  }
  const date=cita?.fechaCita,start=appointmentTime(date),end=Number.isFinite(start)?new Date(start+30*60000).toISOString():null
  const vetName=professionalName(professional)||'Veterinario no disponible'
  return <><CitaToast message={clinicalMessage} onClose={()=>setClinicalMessage('')}/><div style={editingAntecedent?{display:'none'}:undefined} className="fixed inset-0 z-50 bg-[#211431]/55 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="clinical-form-title">
    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 md:p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-6"><h2 data-cita-initial-focus tabIndex={-1} id="clinical-form-title" className="text-2xl font-bold">{mode==='create'?'Registrar atención clínica':'Editar atención'}</h2><button type="button" disabled={busy} className="btn btn-ghost" onClick={onClose} aria-label="Cerrar"><X size={18}/></button></div>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        {mode==='create'&&<section className="cita-readonly-header" aria-label="Cita seleccionada (solo lectura)"><div className="cita-readonly-top"><strong>Paciente: {patient?.nombre||'Paciente no disponible'}</strong><span className="appointments-status confirmada">{cita?.estado||'No disponible'}</span></div><dl><div><dt>Propietario</dt><dd>{patient?.nombrePropietario||'No disponible'}</dd></div><div><dt>Fecha</dt><dd>{attentionDate(date)}</dd></div><div><dt>Horario · Lima</dt><dd>{attentionDate(date,'time')} a {attentionDate(end,'time')}</dd></div><div><dt>Veterinario</dt><dd>{vetName}</dd></div><div><dt>Motivo</dt><dd>{cita?.motivoCita||'No registrado'}</dd></div></dl></section>}
        {mode==='create'&&context&&<AntecedentesConsulta history={context.expediente} editable={role==='VETERINARIO'} onEdit={setEditingAntecedent} onRefresh={refreshHistory} busy={busy} loading={historyLoading} error={historyError}/>}
        <label className="block"><span className="text-sm font-semibold">Peso (kg)</span><input aria-invalid={!!fieldErrors.peso} aria-describedby={fieldErrors.peso?'clinical-peso-error':undefined} className={`input mt-2 ${fieldErrors.peso?'clinical-field-invalid':''}`} type="number" step="0.01" min="0.01" required disabled={busy} value={values.peso} onChange={change('peso')}/>{fieldErrors.peso&&<span className="clinical-field-error" id="clinical-peso-error">{fieldErrors.peso}</span>}</label>
        {role==='ADMIN'&&<label className="block"><span className="text-sm font-semibold">Precio (S/) · administrativo</span><input className="input mt-2" type="number" step="0.01" min="0.01" placeholder="Pendiente de asignación" disabled={busy} value={values.precioAtencion} onChange={change('precioAtencion')}/></label>}
        {[['sintoma','Síntomas'],['diagnostico','Diagnóstico'],['tratamiento','Tratamiento'],['observacion','Observaciones']].map(([key,label])=><label key={key} className="block sm:col-span-2"><span className="text-sm font-semibold">{label}</span><textarea aria-invalid={!!fieldErrors[key]} aria-describedby={fieldErrors[key]?`clinical-${key}-error`:undefined} className={`input min-h-20 mt-2 ${fieldErrors[key]?'clinical-field-invalid':''}`} rows={3} required={key!=='observacion'} maxLength={500} disabled={busy} value={values[key]} onChange={change(key)}/>{fieldErrors[key]&&<span className="clinical-field-error" id={`clinical-${key}-error`}>{fieldErrors[key]}</span>}</label>)}
        {mode==='create'&&context&&role==='VETERINARIO'&&<ClinicalVaccination petId={cita.idMascota} vetId={cita.idVeterinario} rows={vaccination} onChange={setVaccination} onPending={setPendingVaccines} busy={busy}/>}
        {mode==='create'&&!context&&!error&&<p className="sm:col-span-2 text-sm" role="status">Verificando horario y expediente de la cita…</p>}
        {error&&<p role="alert" className="sm:col-span-2 bg-red-50 p-3 rounded-xl text-red-800 text-sm flex gap-2"><AlertCircle size={18}/>{error}</p>}
        <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" disabled={busy} className="btn btn-ghost" onClick={onClose}>Cancelar</button><button disabled={busy||(mode==='create'&&!context)} className="btn btn-primary"><Save size={17}/>{busy?'Guardando...':mode==='create'?'Guardar atención':'Guardar cambios'}</button></div>
      </form>
    </div>
  </div>{editingAntecedent&&context&&<AntecedentsEditor initialFocusHeading group={editingAntecedent} history={context.expediente} pet={patient||{nombre:'Paciente'}} onDone={savedAntecedents} onClose={()=>setEditingAntecedent(null)}/>}</>
}

function SummaryField({ icon: Icon, label, text, mint = false }) {
  return <div className="attention-summary-field"><span className={`attention-summary-icon${mint ? ' is-mint' : ''}`}><Icon size={19}/></span><div><h3>{label}</h3><p className="attention-clamp" title={text || undefined}>{text || 'No registrado'}</p></div></div>
}

export function AttentionCard({ row, permissions, onDetail, onEdit, onRemove, onPrice, showPet = true }) {
  const a = row.attention
  return <article className="attention-card">
    <div className="attention-card-identity"><h2 title={a.diagnostico || undefined}>{a.diagnostico?.trim() ? a.diagnostico : 'Diagnóstico no registrado'}</h2><div className="attention-card-date"><span><CalendarDays size={18}/>{attentionDate(a.fechaAtencion)}</span><span><Clock3 size={16}/>{attentionDate(a.fechaAtencion, 'time')}</span></div><div className="attention-vet"><UserRound size={22}/><div><p>{row.vetName}</p><small>{row.vet?.especialidad || 'Especialidad no disponible'}{row.vet?.nroColegiatura ? ` · Colegiatura ${row.vet.nroColegiatura}` : ''}</small></div></div>{showPet && <div className="flex items-center gap-2 mt-2 text-xs text-[#6B7280]"><PetAvatar pet={row.pet} size={24}/><span>{row.pet?.nombre || 'Mascota no disponible'}</span></div>}</div>
    <div className="attention-card-summary"><SummaryField icon={Pill} label="Tratamiento" text={a.tratamiento} mint/><SummaryField icon={HeartPulse} label="Síntomas" text={a.sintoma}/><SummaryField icon={MessageCircle} label="Observaciones" text={a.observacion}/></div>
    <div className="attention-card-actions"><span className="attention-status"><CheckCircle2 size={16}/>Registrada</span><div className="attention-measures"><div><Weight size={22}/><span><small>Peso</small><strong>{a.peso == null ? 'No disponible' : `${a.peso} kg`}</strong></span></div><div><CalendarDays size={22}/><span><small>Edad</small><strong>{historicalAge(row.pet?.fechaNacimiento, a.fechaAtencion)}</strong></span></div></div><button className="attention-outline" onClick={() => onDetail(a.idAtencion)}>Ver detalle<ArrowRight size={18}/></button>{permissions.price&&<div className="cita-price"><p>Cita relacionada: {row.cita?attentionDate(row.cita.fechaCita):'No disponible'}</p>{a.idCita&&<Link className="attention-outline" to={`/panel/citas?cita=${a.idCita}`}>Consultar cita</Link>}<p>{a.precioAtencion==null?'Precio pendiente de asignación':`Precio: S/ ${Number(a.precioAtencion).toFixed(2)}`}</p><button className="attention-outline" onClick={()=>onPrice(a)}>Asignar precio</button></div>}{permissions.write && <div className="attention-management"><button onClick={() => onEdit(a)}><Pencil size={14}/>Editar</button>{permissions.remove && <button onClick={() => onRemove(a)}><Trash2 size={14}/>Eliminar</button>}</div>}</div>
  </article>
}

function AttentionsPage({ user }) {
  const role = user?.role
  const navigate=useNavigate()
  const [message,setMessage]=useCitaToast()
  const permissions = attentionPermissions(role)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [operationError, setOperationError] = useState('')
  const [petId, setPetId] = useState('')
  const [order, setOrder] = useState('recientes')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [form, setForm] = useState(null)
  const [priceForm,setPriceForm]=useState(null)
  const [detail, setDetail] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const request = useRef(null)
  const detailRequest = useRef(null)
  const alive = useRef(false)
  const removing = useRef(false)
  const load = useCallback(() => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    return loadAttentions(api, controller.signal).then(result => {
      if (alive.current && !controller.signal.aborted) { setData(result); setError(''); setLoading(false) }
    }).catch(err => {
      if (alive.current && !controller.signal.aborted) { setData(null); setError(attentionError(err)); setLoading(false) }
    })
  }, [])
  useEffect(() => {
    alive.current = true
    void load()
    return () => { alive.current = false; request.current?.abort(); detailRequest.current?.abort() }
  }, [load])
  const refresh = () => { setLoading(true); setOperationError(''); void load() }
  const closeDetail = useCallback(() => { detailRequest.current?.abort(); setDetail(null) }, [])
  function openDetail(id) {
    detailRequest.current?.abort()
    const controller = new AbortController()
    detailRequest.current = controller
    setDetail({ id, loading: true, error: '', data: null })
    loadAttentionDetail(api, id, controller.signal).then(result => {
      if (alive.current && !controller.signal.aborted) setDetail({ id, loading: false, error: '', data: result })
    }).catch(err => {
      if (alive.current && !controller.signal.aborted) setDetail({ id, loading: false, error: attentionError(err), data: null })
    })
  }
  async function remove(attention) {
    if (!permissions.remove || removing.current) return
    if (!window.confirm('¿Eliminar esta atención clínica? Esta operación utiliza los permisos administrativos existentes.')) return
    removing.current = true; setDeleting(true); setOperationError('')
    try { await api.delete(`/atenciones/${attention.idAtencion}`); setLoading(true); await load() }
    catch (err) { setOperationError(attentionError(err)) }
    finally { removing.current = false; if (alive.current) setDeleting(false) }
  }
  const rows = useMemo(() => attentionRows(data), [data])
  const pets = data?.mascotas.data || []
  const rangeInvalid = !!(from && to && from > to)
  const visible = filterAttentionRows(rows, { petId, order, from, to })
  const valid = useMemo(() => (data?.citas.data || []).filter(c => c.estado === 'CONFIRMADA' && !data.atenciones.data.some(a => String(a.idCita) === String(c.idCita))), [data])
  const selectedRow = detail?.data ? attentionRows({ ...data, atenciones: { data: [detail.data] } })[0] : null
  const subtitle = role === 'PROPIETARIO' ? 'Revisa el resumen médico de las atenciones de tus mascotas.' : role === 'VETERINARIO' ? 'Consulta y gestiona las atenciones clínicas de tus pacientes autorizados.' : 'Consulta y administra los registros de atención clínica autorizados.'
  return <section className="atenciones-page">
    <header className="attention-page-header"><div><h1>Atenciones clínicas</h1><p>{subtitle}</p></div><div className="attention-page-tools"><button className="attention-refresh" disabled={loading || deleting} onClick={refresh}><RefreshCw size={17}/><span>Actualizar</span></button>{permissions.write && <button className="attention-primary" disabled={loading || !data || !!data.citas.error} onClick={() => navigate('/panel/citas')}><ClipboardPlus size={17}/>Registrar atención</button>}</div></header>
    <div className="attention-toolbar">
      <div className="attention-pet-filters">{pets.length > 1 ? <><PrettySelect value={petId} onChange={setPetId} placeholder={role === 'PROPIETARIO' ? 'Todas mis mascotas' : 'Todos los pacientes'} label="Filtrar por mascota" options={pets.map(p => ({ value: p.idMascota, label: p.nombre }))}/>{pets.length <= 4 && <div className="attention-pet-chips" role="group" aria-label="Mascotas"><button className={!petId ? 'is-selected' : ''} aria-pressed={!petId} onClick={() => setPetId('')}>Todas</button>{pets.map(p => <button key={p.idMascota} className={String(p.idMascota) === petId ? 'is-selected' : ''} aria-pressed={String(p.idMascota) === petId} onClick={() => setPetId(String(p.idMascota))}><PawPrint size={19}/>{p.nombre}</button>)}</div>}</> : pets.length === 1 && <span className="attention-only-pet"><PawPrint size={18}/>{pets[0].nombre}</span>}</div>
      <div className="attention-sort attention-sort-custom"><ArrowDownUp size={19}/><PrettySelect value={order} onChange={setOrder} required keyboardNavigation label="Ordenar atenciones" options={[{value:"recientes",label:"Más recientes primero"},{value:"antiguas",label:"Más antiguas primero"}]}/></div>
    </div>
    {role !== 'PROPIETARIO' && <div className="attention-date-filters"><label>Desde<input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)}/></label><label>Hasta<input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></label>{(from || to || petId) && <button onClick={() => { setFrom(''); setTo(''); setPetId('') }}>Limpiar filtros</button>}</div>}
    {rangeInvalid && <p role="alert" className="attention-feedback attention-error">La fecha inicial debe ser anterior o igual a la fecha final.</p>}
    <CitaToast message={message} onClose={()=>setMessage('')}/>
    {operationError && <p role="alert" className="attention-feedback attention-error">{operationError}</p>}
    {loading ? <p role="status" className="attention-feedback">Cargando atenciones clínicas…</p> : error ? <div role="alert" className="attention-feedback attention-error"><p>No fue posible cargar las atenciones. {error}</p><button className="attention-outline" onClick={refresh}>Reintentar</button></div> : <>
      {data && Object.entries(data).filter(([, result]) => result.error).map(([name, result]) => <p key={name} role="alert" className="attention-feedback attention-warning">No se pudo cargar {name}: {attentionError(result.error)}. Algunos datos complementarios se mostrarán como «No disponible».</p>)}
      {!rangeInvalid && <div className="attention-list" aria-label="Atenciones registradas">{visible.map(row => <AttentionCard key={row.attention.idAtencion} row={row} showPet={showAttentionPetMetadata(petId, pets.length)} permissions={permissions} onPrice={setPriceForm} onDetail={openDetail} onEdit={attention => setForm({ mode: 'edit', item: attention })} onRemove={attention => { if (!deleting) void remove(attention) }}/>)}</div>}
      {!rangeInvalid && !visible.length && <div className="attention-empty"><FileEmpty/><h2>{petId && (data?.citas.error || data?.mascotas.error) ? 'No fue posible relacionar las atenciones con la mascota seleccionada.' : petId ? 'No se encontraron atenciones para esta mascota.' : from || to ? 'No se encontraron atenciones en estas fechas.' : 'Todavía no hay atenciones clínicas registradas.'}</h2><p>{petId || from || to ? 'Prueba con otra selección o cambia el intervalo de fechas.' : 'Aquí aparecerán las consultas registradas por el equipo autorizado.'}</p></div>}
    </>}
    {priceForm&&role==='ADMIN'&&<PrecioAtencion item={priceForm} onClose={()=>setPriceForm(null)} onDone={()=>{setPriceForm(null);setMessage('Precio guardado correctamente.');refresh()}}/>}
    {detail && <AttentionDetail state={detail} row={selectedRow} onClose={closeDetail} onRetry={() => openDetail(detail.id)}/>}
    {form && data && permissions.write && <AtencionForm mode={form.mode} item={form.item} citas={valid} mascotas={pets} veterinarios={data?.veterinarios?.data||[]} onClose={() => setForm(null)} onDone={() => { setForm(null); setMessage('Atención guardada correctamente.');refresh() }}/>}
  </section>
}

function FileEmpty() { return <ClipboardPlus size={34} aria-hidden="true"/> }

export default function Atenciones() {
  const { user } = useAuth()
  return <AttentionsPage key={`${user?.idUsuario || ''}-${user?.role || ''}`} user={user}/>
}
