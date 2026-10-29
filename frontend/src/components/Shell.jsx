import GlobalSearch from './GlobalSearch'
import { CalendarDays, ClipboardPlus, HeartPulse, LayoutDashboard, LogOut, Menu, PawPrint, ShieldCheck, Stethoscope, UsersRound, X, BookHeart, Bell, Syringe, ChevronDown, Camera, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { prepareProfilePhoto } from '../lib/photo'
import { errorText } from '../lib/api'
import RecordatoriosBell from './RecordatoriosBell'
import ProfilePhotoDialog from './ProfilePhotoDialog'

const items = [
  {to:'/panel',label:'Inicio',icon:LayoutDashboard},
  {to:'/panel/perfil',label:'Mi perfil',icon:UserRound},
  {to:'/panel/mis-historias',label:'Mis historias',icon:BookHeart,roles:['PROPIETARIO']},
  {to:'/panel/mascotas',label:'Pacientes',icon:PawPrint},
  {to:'/panel/citas',label:'Citas',icon:CalendarDays},
  {to:'/panel/veterinarios',label:'Veterinarios',icon:Stethoscope},
  {to:'/panel/historias',label:'Historial clínico',icon:BookHeart},
  {to:'/panel/vacunas',label:'Vacunas',icon:Syringe},
  {to:'/panel/atenciones',label:'Atenciones',icon:ClipboardPlus},
  {to:'/panel/propietarios',label:'Clientes',icon:UsersRound,roles:['ADMIN']},
  {to:'/panel/usuarios',label:'Usuarios',icon:ShieldCheck,roles:['ADMIN']},
]
const adminItems=['/panel','/panel/perfil','/panel/veterinarios','/panel/usuarios','/panel/propietarios','/panel/citas','/panel/atenciones'].map(path=>({...items.find(i=>i.to===path),...(path==='/panel/propietarios'?{label:'Propietarios'}:{})}))
function Avatar({name,photoUrl}) {
  return <span className="rounded-full bg-[#eaddfa] w-10 h-10 shrink-0 overflow-hidden grid place-items-center text-[#6927a9] font-bold">
    {photoUrl ? <img src={photoUrl} alt="Fotografía de perfil" className="w-full h-full object-cover"/> : (name || 'V').charAt(0).toUpperCase()}
  </span>
}
function Sidebar({close}) {
  const {user,logout} = useAuth()
  return <div className="h-full flex flex-col bg-gradient-to-b from-[#6828a5] via-[#50278a] to-[#33205f] text-white p-4">
    <div className="flex gap-3 items-center px-2 py-6"><div className="w-12 h-12 rounded-2xl bg-white/10 grid place-items-center"><PawPrint size={31}/></div><div><div className="text-2xl font-extrabold">VetCare</div><p className="text-xs text-white/75">Cuidado que los acompaña</p></div></div>
    <nav className="mt-4 space-y-2 flex-1 overflow-auto">{(user?.role==='ADMIN'?adminItems:items.filter(i=>!i.roles||i.roles.includes(user?.role))).map(({to,label,icon:Icon})=><NavLink key={to} end={to==='/panel'} to={to} onClick={close} className={({isActive})=>`flex gap-3 items-center px-4 py-3 rounded-xl text-sm font-semibold ${isActive?'bg-[#b475e1]/55 shadow-sm text-white':'text-white/85 hover:bg-white/10'}`}><Icon size={19}/>{user?.role==='PROPIETARIO'&&label==='Pacientes'?'Mis mascotas':label}</NavLink>)}</nav>
    <div className="rounded-2xl bg-[#ffffff15] p-4 mb-3"><span className="text-xs tracking-wide text-[#bcebdc] font-bold">{user?.role||'Usuario'}</span><p className="text-xs mt-2 text-white/75 break-words">{user?.name}</p></div>
    <button onClick={logout} className="flex items-center gap-2 p-3 rounded-xl hover:bg-white/10"><LogOut size={18}/> Cerrar sesión</button>
  </div>
}
export default function Shell() {
  const [open,setOpen] = useState(false)
  const [profileOpen,setProfileOpen] = useState(false)
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [preview,setPreview] = useState(null)
  const [photoError,setPhotoError] = useState('')
  const photoLock=useRef(false)
  useEffect(()=>()=>{if(preview?.url)URL.revokeObjectURL(preview.url)},[preview])
  const fileInput = useRef(null)
  const {user,profile,photoUrl,logout,uploadPhoto} = useAuth()
  const role = user?.role
  const name = user?.name || [profile?.nombres,profile?.apellidos].filter(Boolean).join(' ') || 'Usuario'
  async function onPhotoSelected(event) {
    const file=event.target.files?.[0]
    event.target.value=''
    if (!file || photoLock.current) return
    photoLock.current=true
    setMessage(''); setBusy(true)
    try {
      if(role==='ADMIN'&&!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw Error('Selecciona una fotografía JPG, PNG, WebP o AVIF.')
      const ready = await prepareProfilePhoto(file)
      if(role==='ADMIN'){setPhotoError('');setProfileOpen(false);setPreview({file:ready,url:URL.createObjectURL(ready)});return}
      await uploadPhoto(ready)
      setMessage('Fotografía guardada correctamente.')
    } catch(err) { setMessage(err.response ? errorText(err) : err.message || 'No se pudo subir la fotografía.') }
    finally { photoLock.current=false;setBusy(false) }
  }
  async function confirmAdminPhoto(){
    if(photoLock.current)return
    photoLock.current=true;setBusy(true);setPhotoError('')
    try{await uploadPhoto(preview.file,{verify:true});setPreview(null);setMessage('Fotografía guardada y comprobada.');setProfileOpen(true)}
    catch(err){setPhotoError(err.message?.startsWith('La fotografía')?err.message:errorText(err))}
    finally{photoLock.current=false;setBusy(false)}
  }
  return <div className="min-h-screen lg:flex bg-vetcare-bg">
    <aside className="hidden lg:block lg:w-64 shrink-0"><div className="fixed h-screen w-64"><Sidebar/></div></aside>
    {open&&<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={()=>setOpen(false)}><aside className="w-64 h-full" onClick={e=>e.stopPropagation()}><Sidebar close={()=>setOpen(false)}/></aside></div>}
    <div className="flex-1 min-w-0">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-vetcare-soft px-5 md:px-7 py-3 flex gap-3 justify-between items-center min-h-[76px]">
        <div className="flex items-center gap-3"><button className="lg:hidden" onClick={()=>setOpen(!open)} aria-label="Abrir menú">{open?<X/>:<Menu/>}</button><GlobalSearch/><span className="sm:hidden font-extrabold text-vetcare-primary flex gap-2 items-center"><HeartPulse size={21}/> VetCare</span></div>
        <div className="flex gap-3 items-center">{role==='PROPIETARIO' ? <RecordatoriosBell/> : role==='VETERINARIO' ? null : <span title="Recordatorios de vacunación disponibles para propietarios" className="border border-[#eee6f5] rounded-xl p-2.5 text-[#5c28a2] opacity-60"><Bell size={20}/></span>}<div className="relative">
          <button onClick={()=>setProfileOpen(v=>!v)} aria-expanded={profileOpen} aria-label="Opciones de perfil" className="flex items-center gap-2 text-left"><Avatar name={name} photoUrl={photoUrl}/><span className="hidden md:block"><strong className="block text-sm text-[#35106b] max-w-52 truncate">{name}</strong><span className="text-xs text-[#79619d]">{role==='VETERINARIO'?'Médico veterinario':role==='PROPIETARIO'?'Propietario':'Administrador'}</span></span><ChevronDown size={16} className="text-[#5c28a2]"/></button>
          {profileOpen&&<div className="absolute right-0 top-12 z-30 bg-white border border-violet-100 shadow-xl rounded-xl w-64 p-3 space-y-2"><p className="text-sm font-semibold text-[#35106b] break-words">{name}</p><p className="text-xs text-[#79619d] break-all">{profile?.correo||''}</p><button type="button" disabled={busy} className="w-full flex items-center gap-2 text-left text-sm hover:bg-violet-50 rounded-lg p-2" onClick={()=>fileInput.current?.click()}><Camera size={17}/>{busy?'Subiendo fotografía...':'Cambiar fotografía'}</button><input ref={fileInput} type="file" accept={role==='ADMIN'?'image/jpeg,image/png,image/webp,image/avif':'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif'} className="hidden" onChange={onPhotoSelected}/>{message&&<p role="status" className="text-xs text-[#604183]">{message}</p>}<NavLink to="/panel/perfil" className="w-full block text-left text-sm hover:bg-violet-50 rounded-lg p-2" onClick={()=>setProfileOpen(false)}>Ver mi perfil</NavLink><button className="w-full text-left text-sm hover:bg-violet-50 rounded-lg p-2" onClick={()=>{setProfileOpen(false);logout()}}>Cerrar sesión</button></div>}
        </div></div>
      </header>
      <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-7"><Outlet/></div>
    </div>
    {role==='ADMIN'&&preview&&<ProfilePhotoDialog busy={busy} onClose={()=>{setPreview(null);setPhotoError('')}}><h2>Vista previa de tu fotografía</h2><img className="profile-preview" src={preview.url} alt="Vista previa de la nueva fotografía"/>{photoError&&<p role="alert" className="profile-error">{photoError}</p>}<div className="profile-dialog-actions"><button type="button" disabled={busy} onClick={()=>{setPreview(null);setPhotoError('')}}>Cancelar</button><button type="button" className="profile-primary" disabled={busy} onClick={confirmAdminPhoto}>{busy?'Comprobando…':'Guardar foto'}</button></div></ProfilePhotoDialog>}
  </div>
}
