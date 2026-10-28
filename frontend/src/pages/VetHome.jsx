import {useEffect,useState} from 'react'
import HomeWelcome from '../components/HomeWelcome'
import {homeStatTones} from '../lib/homePresentation'
import PetAvatar from '../components/PetAvatar'
import { Link } from 'react-router-dom'
import { ArrowRight, BookHeart, CalendarDays, ClipboardPlus, Clock3, PawPrint, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { errorText } from '../lib/api'
import useVetAgenda from '../lib/useVetAgenda'
import { agendaDate, agendaLink, filterAppointments, sortAppointments, vetCounters } from '../lib/vetAgenda'

export default function VetHome() {
  const { profile,vet,refreshProfile } = useAuth()
  const [professionalError,setProfessionalError]=useState('')
  useEffect(()=>{
    let active=true
    const update=()=>{void refreshProfile().then(()=>{if(active)setProfessionalError('')}).catch(()=>{if(active)setProfessionalError('No se pudo actualizar el saludo. Vuelve a actualizar los datos.')})}
    window.addEventListener('focus',update)
    return()=>{active=false;window.removeEventListener('focus',update)}
  },[refreshProfile])
  const { data, loading, now, refresh } = useVetAgenda()
  const citas = data?.citas.data ?? null
  const counters = vetCounters(citas, data?.atenciones.data, now)
  const upcoming = sortAppointments(filterAppointments(citas || [], 'proximas', now), now)
  const stats = [
    [PawPrint, 'Pacientes', counters.patients, 'Mascotas distintas en tus citas', 'bg-fuchsia-50 text-fuchsia-700'],
    [CalendarDays, 'Citas de hoy', counters.today, 'Incluye atendidas; excluye canceladas', 'bg-violet-50 text-violet-700'],
    [Clock3, 'Pendientes', counters.pending, 'Asignadas, por confirmar', 'bg-amber-50 text-amber-800'],
    [ClipboardPlus, 'Atenciones', counters.visits, 'Registros clínicos autorizados', 'bg-emerald-50 text-emerald-800'],
  ]
  return <section className="space-y-5 pb-10">
    <HomeWelcome profile={profile} vet={vet} error={professionalError}/>
    <div className="flex flex-wrap gap-3 items-center justify-between"><h2 className="font-extrabold text-xl">Resumen de tu actividad</h2><button className="btn btn-ghost" onClick={()=>{refresh();refreshProfile().then(()=>setProfessionalError('')).catch(()=>setProfessionalError('No se pudo actualizar el saludo. Vuelve a actualizar los datos.'))}} disabled={loading}><RefreshCw size={16}/> Actualizar</button></div>
    {data && Object.entries(data).filter(([, section]) => section.error).map(([name, section]) => <p key={name} role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">No se pudo cargar {name}: {section.error.response || section.error.request ? errorText(section.error) : section.error.message}. Los valores afectados no están disponibles.</p>)}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{stats.map(([Icon, title, value, description, color],index) => <article key={title} className={`home-top-stat home-stat-${homeStatTones[index]} rounded-2xl border border-vetcare-soft bg-white p-5`}><span className={`home-top-stat-icon inline-grid place-items-center w-10 h-10 rounded-xl ${color}`}><Icon size={22}/></span><p className="font-semibold text-sm mt-3">{title}</p><p className={`mt-1 font-black ${value == null && !loading ? 'text-base' : 'text-3xl'} text-[#35106b]`}>{loading ? '…' : value ?? 'No disponible'}</p><p className="text-xs text-vetcare-text-muted mt-2">{description}</p></article>)}</div>
    <div className="grid xl:grid-cols-2 gap-5 items-start">
      <section className="bg-white border border-vetcare-soft rounded-2xl p-5"><div className="flex flex-wrap justify-between gap-2 items-center"><h2 className="text-lg font-extrabold">Próximas citas</h2><Link className="text-sm font-semibold text-violet-700" to={agendaLink('proximas')}>Ver agenda →</Link></div><p className="text-xs text-vetcare-text-muted mt-1">Citas futuras pendientes o confirmadas.</p><div className="mt-4 space-y-2">{loading ? <p role="status">Consultando agenda…</p> : citas == null ? <p className="text-sm text-amber-800">Agenda no disponible.</p> : upcoming.length ? upcoming.slice(0, 5).map(c => <Link key={c.idCita} to={agendaLink('proximas')} className="flex items-center gap-3 rounded-xl p-3 hover:bg-violet-50 border border-violet-100"><PetAvatar pet={data?.mascotas.data?.find(p => String(p.idMascota) === String(c.idMascota))} size={40}/><div className="min-w-0 flex-1"><p className="font-bold">{data?.mascotas.data?.find(p => String(p.idMascota) === String(c.idMascota))?.nombre || 'Paciente · nombre no disponible'}</p><p className="text-xs text-vetcare-text-muted">{agendaDate(c.fechaCita)}</p><p className="text-sm truncate">{c.motivoCita}</p></div><span className={`rounded-full px-2 py-1 text-xs ${c.estado === 'CONFIRMADA' ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'}`}>{c.estado === 'CONFIRMADA' ? 'Confirmada' : 'Pendiente'}</span></Link>) : <p className="py-6 text-sm text-vetcare-text-muted">No tienes próximas citas activas.</p>}</div></section>
      <section className="bg-white border border-vetcare-soft rounded-2xl p-5"><h2 className="text-lg font-extrabold">Mis tareas de hoy</h2><p className="text-xs text-vetcare-text-muted mt-1">Accesos al seguimiento real de tu agenda.</p><div className="mt-4 space-y-3">
        {loading ? <p role="status">Consultando pendientes…</p> : counters.pending == null ? <p className="text-sm text-amber-800">No se pudieron consultar tus citas pendientes.</p> : counters.pending > 0 ? <Link to={agendaLink('pendientes')} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><Clock3 size={21} className="shrink-0 text-amber-700"/><span className="flex-1"><strong className="block text-sm">Revisar citas pendientes</strong><small>{counters.pending} por confirmar</small></span><ArrowRight size={17}/></Link> : <p className="flex gap-2 items-center rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={19}/>No tienes citas pendientes por ahora</p>}
        <Link to={agendaLink('proximas')} className="flex items-center gap-3 rounded-xl border border-violet-100 bg-[#faf7ff] p-4"><CalendarDays size={21} className="shrink-0 text-violet-700"/><span className="flex-1"><strong className="block text-sm">Consultar próximas citas</strong><small className="text-vetcare-text-muted">{loading ? 'Consultando…' : citas == null ? 'Cantidad no disponible' : `${upcoming.length} futuras y activas`}</small></span><ArrowRight size={17}/></Link>
        <Link to="/panel/historias" className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"><BookHeart size={21} className="shrink-0 text-emerald-700"/><span className="flex-1"><strong className="block text-sm">Revisar historias clínicas autorizadas</strong><small className="text-vetcare-text-muted">Expedientes de tus pacientes autorizados</small></span><ArrowRight size={17}/></Link>
      </div></section>
    </div>
  </section>
}
