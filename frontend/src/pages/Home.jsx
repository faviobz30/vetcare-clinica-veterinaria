import AdminHome from './AdminHome'
import HomeWelcome from '../components/HomeWelcome'
import {homeStatTones} from '../lib/homePresentation'
import PetAvatar from '../components/PetAvatar'
import VetHome from './VetHome'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, PawPrint, UsersRound, BookHeart, ClipboardPlus, ArrowRight, CheckCircle2, Clock3, Stethoscope, Heart, Syringe, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api, errorText } from '../lib/api'
import pets from '../assets/login-pets.png'

const empty = { citas: [], mascotas: [], atenciones: [], veterinarios: [], propietarios: [] }
const datePart = (s) => typeof s === 'string' ? s.slice(0, 10) : ''
const fmtHour = (s) => s ? new Date(s).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—'
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('es-PE', { day:'2-digit', month:'short' }) : '—'
const todayLocal = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

function Stat({ icon:Icon, title, value, description, tint, tone }) {
  return <article className={`${tone?`home-top-stat home-stat-${tone}`:''} rounded-2xl bg-white border border-[#eee6f5] shadow-sm p-4 flex items-center gap-4 min-w-0`}>
    <span className={`${tone?'home-top-stat-icon':''} flex-none w-14 h-14 rounded-full grid place-items-center ${tint}`}><Icon size={27} strokeWidth={2.3}/></span>
    <div className="min-w-0"><div className="text-sm font-semibold text-[#3b225e]">{title}</div><div className="text-3xl font-black text-[#311063] leading-tight">{value}</div><p className="text-xs text-[#756389] mt-1">{description}</p></div>
  </article>
}
const stateColor = {PENDIENTE:'bg-amber-100 text-amber-800', CONFIRMADA:'bg-cyan-100 text-cyan-900', ATENDIDA:'bg-emerald-100 text-emerald-800', CANCELADA:'bg-slate-100 text-slate-700'}
function GeneralHome() {
  const { user, profile } = useAuth()
  const role = user?.role || ''
  const [data, setData] = useState(empty)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState([])
  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true); setError('')
      const requests = [['citas','/citas'],['mascotas','/mascotas'],['atenciones','/atenciones'],['veterinarios','/veterinarios']]
      if(role === 'ADMIN') requests.push(['propietarios','/propietarios'])
      const results = await Promise.allSettled(requests.map(async ([key,url]) => ({key, items:(await api.get(url)).data})))
      if (!active) return
      const next = {...empty}; let failures = []
      results.forEach((r,i)=> { if(r.status==='fulfilled' && Array.isArray(r.value.items)) next[r.value.key]=r.value.items; else failures.push(`${requests[i][0]}: ${r.status==='rejected'?errorText(r.reason):'respuesta inesperada'}`) })
      setData(next); setError(failures.join(' · ')); setLoading(false)
    }
    load()
    return () => {active=false}
  }, [role])
  const today = todayLocal()
  const upcoming = useMemo(() => data.citas.filter(c => c.estado !== 'CANCELADA' && c.estado !== 'ATENDIDA' && datePart(c.fechaCita) >= today).sort((a,b) => String(a.fechaCita).localeCompare(String(b.fechaCita))), [data.citas,today])
  const citasToday = data.citas.filter(c=>datePart(c.fechaCita)===today)
  const attended = data.citas.filter(c=>c.estado==='ATENDIDA').length
  const name = profile?.nombres?.trim() || (user?.name?.includes('@') ? '' : (user?.name || '').split(' ')[0])
  const greeting = role === 'PROPIETARIO' ? `¡Bienvenida${name ? `, ${name}` : ''}!` : `¡Bienvenido${name ? `, ${name}` : ''} a VetCare!`
  const stats = role==='VETERINARIO' ? [
    [PawPrint,'Pacientes',new Set(data.citas.map(c=>c.idMascota)).size,'Mascotas en tus citas','bg-fuchsia-100 text-fuchsia-700'],
    [CalendarDays,'Citas de hoy',citasToday.length,'En tu agenda','bg-violet-100 text-violet-700'],
    [Clock3,'Pendientes',data.citas.filter(c=>c.estado==='PENDIENTE').length,'Esperan confirmación','bg-amber-100 text-amber-700'],
    [BookHeart,'Atenciones',data.atenciones.length,'Registros autorizados','bg-emerald-100 text-emerald-700']
  ] : role==='PROPIETARIO' ? [
    [PawPrint,'Mis mascotas',data.mascotas.length,'Compañeros registrados','bg-fuchsia-100 text-fuchsia-700'],
    [CalendarDays,'Próximas citas',upcoming.length,'Citas programadas','bg-violet-100 text-violet-700'],
    [CheckCircle2,'Citas atendidas',attended,'Consultas realizadas','bg-emerald-100 text-emerald-700'],
    [BookHeart,'Mis atenciones',data.atenciones.length,'Información disponible','bg-sky-100 text-sky-700']
  ] : [
    [PawPrint,'Pacientes',data.mascotas.length,'Mascotas registradas','bg-fuchsia-100 text-fuchsia-700'],
    [CalendarDays,'Citas de hoy',citasToday.length,'Agendadas hoy','bg-violet-100 text-violet-700'],
    [UsersRound,'Propietarios',data.propietarios.length,'Registros de clientes','bg-emerald-100 text-emerald-700'],
    [Stethoscope,'Veterinarios',data.veterinarios.length,'Profesionales registrados','bg-sky-100 text-sky-700']
  ]
  const actions = role==='VETERINARIO' ? [
    {icon:CalendarDays,label:'Mis citas',to:'/panel/citas',tint:'bg-[#fbe8f6] text-[#a50a91]'},
    {icon:ClipboardPlus,label:'Registrar atención',to:'/panel/atenciones',tint:'bg-[#efe9ff] text-[#5a32ce]'},
    {icon:BookHeart,label:'Historia clínica',to:'/panel/historias',tint:'bg-[#e7f5ee] text-[#168064]'},
    {icon:PawPrint,label:'Pacientes',to:'/panel/mascotas',tint:'bg-[#fef1dc] text-[#9b6723]'}
  ] : role==='PROPIETARIO' ? [
    {icon:CalendarDays,label:'Solicitar cita',to:'/panel/citas',tint:'bg-[#fbe8f6] text-[#a50a91]'},
    {icon:PawPrint,label:'Mis mascotas',to:'/panel/mascotas',tint:'bg-[#efe9ff] text-[#5a32ce]'},
    {icon:BookHeart,label:'Historial de salud',to:'/panel/historias',tint:'bg-[#e7f5ee] text-[#168064]'},
    {icon:Syringe,label:'Vacunas',to:'/panel/vacunas',tint:'bg-[#eee9fc] text-[#5a32ce]'}
  ] : [
    {icon:CalendarDays,label:'Nueva cita',to:'/panel/citas',tint:'bg-[#fbe8f6] text-[#a50a91]'},
    {icon:PawPrint,label:'Pacientes',to:'/panel/mascotas',tint:'bg-[#efe9ff] text-[#5a32ce]'},
    {icon:Stethoscope,label:'Veterinarios',to:'/panel/veterinarios',tint:'bg-[#e7f5ee] text-[#168064]'},
    {icon:UsersRound,label:'Propietarios',to:'/panel/propietarios',tint:'bg-[#fef1dc] text-[#9b6723]'}
  ]
  const tasks = role==='VETERINARIO' ? [
    {id:'confirm',text:'Revisar citas pendientes',sub:`${data.citas.filter(c=>c.estado==='PENDIENTE').length} pendientes`,to:'/panel/citas'},
    {id:'agenda',text:'Consultar próximas citas',sub:`${upcoming.length} programadas`,to:'/panel/citas'},
    {id:'clinical',text:'Revisar historias clínicas autorizadas',sub:'Acceso clínico',to:'/panel/historias'}
  ] : role==='PROPIETARIO' ? [
    {id:'pets',text:'Revisar los datos de mis mascotas',sub:'Mi perfil',to:'/panel/mascotas'},
    {id:'appointments',text:'Consultar mis próximas citas',sub:`${upcoming.length} programadas`,to:'/panel/citas'}
  ] : [
    {id:'pending',text:'Revisar citas pendientes',sub:`${data.citas.filter(c=>c.estado==='PENDIENTE').length} pendientes`,to:'/panel/citas'},
    {id:'vets',text:'Consultar veterinarios',sub:`${data.veterinarios.length} registrados`,to:'/panel/veterinarios'},
    {id:'records',text:'Revisar atenciones',sub:`${data.atenciones.length} registradas`,to:'/panel/atenciones'}
  ]
  return <section className="space-y-5 pb-10">
    {role==='PROPIETARIO'?<HomeWelcome owner profile={profile||{nombres:name}}/>:(<>
    <div className="vetcare-hero relative min-h-[230px] rounded-[25px] overflow-hidden border border-[#eddefb] flex items-center p-7 md:p-10">
      <svg className="vetcare-hero-shapes" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M520 300Q635 142 805 165T1010 0H1200V300Z" fill="#c4a4fa" opacity=".18"/><path d="M660 300Q785 86 940 110T1170 0H1200V300Z" fill="#bd93fb" opacity=".18"/><path d="M880 300Q988 203 1110 245T1200 186V300Z" fill="#a77cf4" opacity=".19"/></svg>
      <div className="relative z-10 vetcare-hero-copy"><p className="text-xs font-extrabold tracking-[.2em] text-[#6221a8] mb-3">VETCARE</p><h1 className="text-3xl md:text-4xl xl:text-[43px] leading-tight font-black text-[#35106b]">{greeting}</h1><p className="mt-3 text-lg text-[#51258d]">{role==='VETERINARIO'?'Hoy es un gran día para hacer la diferencia':role==='PROPIETARIO'?'Cuidamos juntos de quienes más amas':'Cuidamos a cada paciente con dedicación'} <Heart size={16} className="inline text-[#c83bc7] fill-[#c83bc7]"/></p><p className="mt-4 italic text-sm text-[#76649a]">“Mascotas sanas, familias más felices”</p></div>
      <svg className="vetcare-hero-doodles" viewBox="0 0 350 220" aria-hidden="true"><path d="M45 130 C-3 95 21 65 42 88 C65 63 88 94 45 130Z M244 52 C211 17 244 -3 258 26 C280 3 305 27 244 52Z" fill="none" stroke="#6a29ba" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="M185 11l-7 34 M205 23l7 34 M315 123l27 -12 M310 144l30 3 M313 168l25 17" fill="none" stroke="#6a29ba" strokeWidth="5" strokeLinecap="round"/></svg>
      <img src={pets} alt="Perrito y gatito de VetCare" className="vetcare-hero-pets absolute bottom-0 right-[11%] w-[34%] max-h-[225px] object-contain object-bottom" />
      <div className="vetcare-hero-slogan absolute right-[2%] top-[18%] z-10 w-[13%] text-lg xl:text-2xl">Pequeñas<br/>vidas,<br/>grandes<br/>historias</div>
    </div>
    </>)}
    {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm flex items-start gap-2"><AlertCircle size={17} className="shrink-0"/><div>No se pudo cargar parte de la información: {error}. Las cifras afectadas pueden mostrarse como 0.</div></div>}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{stats.map(([icon,title,value,description,tint],index)=><Stat key={title} icon={icon} title={title} value={loading?'…':value} description={description} tint={tint} tone={role==='PROPIETARIO'?homeStatTones[index]:null}/>)}</div>
    <div className="grid xl:grid-cols-[1.05fr_1fr] gap-4 items-start">
      <section className="rounded-2xl bg-white border border-[#eee6f5] shadow-sm p-5">
        <div className="flex items-center justify-between gap-2 mb-4"><h2 className="text-lg font-black flex items-center gap-2 text-[#361469]"><CalendarDays className="text-[#b80ca7]"/> Citas próximas</h2><Link className="text-sm font-semibold text-[#7527b8] inline-flex items-center gap-1" to="/panel/citas">Ver todas <ArrowRight size={15}/></Link></div>
        {upcoming.slice(0,5).map((c,i)=>{const m=data.mascotas.find(p=>p.idMascota===c.idMascota);return <Link key={c.idCita} to="/panel/citas" className={`flex gap-3 items-center rounded-xl px-2 py-3 hover:bg-[#f8f2ff] ${i%2?'bg-[#faf7fd]':''}`}><div className="text-sm font-extrabold w-14 shrink-0 text-[#3f1779]">{datePart(c.fechaCita)===today?fmtHour(c.fechaCita):fmtDate(c.fechaCita)}</div><PetAvatar pet={m} size={44}/><div className="min-w-0 flex-1"><p className="font-bold text-[#381267]">{m?.nombre || `Mascota #${c.idMascota}`}</p><p className="text-xs text-[#837098] truncate">{c.motivoCita||'Consulta veterinaria'}</p></div><span className={`hidden sm:inline rounded-full text-[10px] font-semibold py-1 px-2 ${stateColor[c.estado]||'bg-violet-100'}`}>{c.estado}</span></Link>})}
        {!loading&&!upcoming.length&&<div className="py-8 text-center text-sm text-[#796991]">No hay próximas citas programadas.</div>}
      </section>
      <div className="space-y-4"><section className="rounded-2xl bg-white border border-[#eee6f5] shadow-sm p-5"><h2 className="text-lg font-black flex items-center gap-2 text-[#361469] mb-4"><span className="text-[#b80ca7]">ϟ</span> Acciones rápidas</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{actions.map(({icon:Icon,label,to,tint})=><Link to={to} key={label} className={`${tint} rounded-xl p-3 min-h-28 flex flex-col justify-between hover:brightness-95 transition`}><Icon size={25}/><span className="text-xs font-bold leading-tight">{label} <ArrowRight size={13} className="mt-1"/></span></Link>)}</div></section>
      <section className="rounded-2xl bg-white border border-[#eee6f5] shadow-sm p-5"><h2 className="text-lg font-black flex items-center gap-2 text-[#361469] mb-3"><CheckCircle2 className="text-[#0d9c77]"/> {role==='VETERINARIO'?'Mis tareas de hoy':role==='PROPIETARIO'?'Mis pendientes':'Seguimiento de la clínica'}</h2><div className="space-y-2">{tasks.map(t=><div key={t.id} className="flex gap-3 items-center text-sm"><button type="button" aria-label={`Marcar ${t.text}`} aria-pressed={done.includes(t.id)} onClick={()=>setDone(v=>v.includes(t.id)?v.filter(x=>x!==t.id):[...v,t.id])} className={`shrink-0 rounded-full ${done.includes(t.id)?'text-[#10a57b]':'text-[#9183b0]'}`}><CheckCircle2 size={20} fill={done.includes(t.id)?'#ddf8ed':'none'}/></button><Link to={t.to} className={`flex-1 hover:underline ${done.includes(t.id)?'line-through text-[#978bad]':'text-[#463075]'}`}>{t.text}</Link><span className="text-[11px] text-[#8c7ea3]">{t.sub}</span></div>)}</div><p className="mt-3 text-xs text-[#9383aa]">Lista visual de seguimiento; marcar una tarea no modifica datos clínicos.</p></section></div>
    </div>
  </section>
}

export default function Home() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <AdminHome key={user?.idUsuario}/> : user?.role === 'VETERINARIO' ? <VetHome key={user?.idUsuario}/> : <GeneralHome/>
}
