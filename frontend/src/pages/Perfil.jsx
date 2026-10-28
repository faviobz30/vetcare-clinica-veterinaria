import {useProfilePhotoRefresh} from '../lib/profilePhoto'
import AccountSecurity from '../components/AccountSecurity'
import { useEffect, useRef, useState } from 'react'
import { Camera, Save, Trash2, UserRound, X, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api, errorText } from '../lib/api'
import { prepareProfilePhoto } from '../lib/photo'
import { profileChanges, profileDisplayName, profileDraft } from '../lib/profile'
import PerfilAdmin from './PerfilAdmin'
import './Perfil.css'

const dateText = value => value ? new Intl.DateTimeFormat('es-PE').format(new Date(value.slice(0, 10) + 'T12:00:00')) : 'No disponible'
function ReadField({ label, value }) {
  return <label className="profile-field"><span>{label}</span><input value={value || 'No disponible'} readOnly /></label>
}
export default function Perfil() {
  const auth = useAuth()
  if (auth.user?.role === 'ADMIN') return <PerfilAdmin />
  if (auth.profileError) return <section className="account-profile"><h1>Mi perfil</h1><p role="alert">{auth.profileError}</p><button className="profile-primary" onClick={() => auth.refreshProfile().catch(() => {})}>Reintentar</button></section>
  if (!auth.profile || (auth.user?.role === 'PROPIETARIO' ? !auth.owner : !auth.vet)) return <section className="account-profile" aria-busy="true"><h1>Mi perfil</h1><p>Cargando tu perfil…</p></section>
  return <PersonalProfile key={auth.profile.idUsuario} auth={auth} />
}
function PersonalProfile({ auth }) {
  const { user, profile, owner, vet, photoUrl, uploadPhoto, deletePhoto, refreshProfile } = auth
  const role = user.role
  const detail = role === 'PROPIETARIO' ? owner : vet
  const initial = profileDraft(profile, detail, role)
  const [baseline, setBaseline] = useState(initial)
  const [form, setForm] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [remove, setRemove] = useState(false)
  const input = useRef(null)
  const lock = useRef(false)
  const profileIdle = useRef(true)
  useEffect(() => { profileIdle.current=!editing&&!busy;return()=>{profileIdle.current=false} }, [editing,busy])
  useProfilePhotoRefresh(async()=>{
    if(role!=='PROPIETARIO'||!profileIdle.current)return
    try{
      const latest=await refreshProfile()
      if(!profileIdle.current||!latest)return
      const next=profileDraft(latest.profile,latest.owner,role)
      setBaseline(next);setForm(next)
      setError(previous=>previous==='No se pudo actualizar el perfil. Intenta volver a esta ventana nuevamente.'?'':previous)
    }catch{if(profileIdle.current)setError('No se pudo actualizar el perfil. Intenta volver a esta ventana nuevamente.')}
  },{initial:role==='PROPIETARIO'})
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview])
  useEffect(() => {
    if (!message) return undefined
    const timeout = window.setTimeout(() => setMessage(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [message])
  function start(action) {
    if (lock.current) return false
    lock.current = true; setBusy(action); setMessage(''); setError(''); return true
  }
  function finish() { lock.current = false; setBusy('') }
  async function choosePhoto(event) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file || !start('preparando')) return
    try {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Selecciona una imagen JPG, PNG, WebP o AVIF.')
      const prepared = await prepareProfilePhoto(file)
      setPreview({ file: prepared, url: URL.createObjectURL(prepared) })
    } catch (err) { setError(err.message) } finally { finish() }
  }
  async function confirmPhoto() {
    if (!start('foto')) return
    try { await uploadPhoto(preview.file); setPreview(null); setMessage('Fotografía guardada.') }
    catch (err) { setError(errorText(err)) } finally { finish() }
  }
  async function confirmRemove() {
    if (!start('foto')) return
    try { await deletePhoto(); setRemove(false); setMessage('Fotografía eliminada.') }
    catch (err) { setError(errorText(err)) } finally { finish() }
  }
  async function save(event) {
    event.preventDefault()
    if (!start('datos')) return
    try {
      const changes = profileChanges(form, baseline, role)
      if (!Object.keys(changes).length) { setEditing(false); setMessage('No hay cambios para guardar.'); return }
      await api.patch(role === 'PROPIETARIO' ? '/propietarios/me' : '/veterinarios/me', changes)
      const saved = { ...baseline, ...changes }; setBaseline(saved); setForm(saved); setEditing(false)
      try { await refreshProfile(); setMessage('Datos personales guardados.') }
      catch { setError('Los datos se guardaron, pero no se pudo actualizar la vista. Vuelve a cargar el perfil.'); }
    } catch (err) { setError(err.response ? errorText(err) : err.message) } finally { finish() }
  }
  const change = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  return <section className="account-profile">
    <header className="profile-header"><div><h1>Mi perfil</h1><p>Datos de tu cuenta y tu información personal.</p></div>{!editing ? <button type="button" className="profile-edit" disabled={!!busy} onClick={() => { setEditing(true); setMessage(''); setError('') }}><Pencil size={17}/>Editar información</button> : <div className="profile-edit-actions"><button type="button" className="profile-edit" disabled={!!busy} onClick={() => { setForm(baseline); setEditing(false); setError('') }}>Cancelar</button><button type="submit" form="vetcare-personal-profile" className="profile-primary" disabled={!!busy}><Save size={17}/>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>}</header>
    {error && <p className="profile-error" role="alert">{error}</p>}
    {message && <p className="profile-message" role="status">{message}</p>}
    <article className="profile-card profile-identity">
      <div className="profile-avatar">{photoUrl ? <img src={photoUrl} alt="Tu fotografía de perfil" /> : <UserRound size={56} aria-label="Sin fotografía" />}</div>
      <div className="profile-identity-text"><h2>{profileDisplayName(profile, vet, role)}</h2><p>{profile.correo}</p><span className="profile-role">{role}</span>
        <div className="profile-photo-actions"><button type="button" disabled={!!busy} onClick={() => input.current.click()}><Camera size={19} />Cambiar foto</button><button type="button" disabled={!!busy || !photoUrl} onClick={() => { setError(''); setRemove(true) }}><Trash2 size={19} />Quitar foto</button></div>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={choosePhoto} aria-label="Seleccionar fotografía" />
      </div>
    </article>
    <article className="profile-card"><h2>{role === 'PROPIETARIO' ? 'Información de la cuenta' : 'Información profesional'}</h2>
      <div className="profile-info-grid">
        <ReadField label="Tipo de documento" value={profile.tipoDocumento} />
        <ReadField label="Número de documento" value={profile.nroDocumento} />
        {role === 'PROPIETARIO' ? <><div className="profile-field"><span>Estado de la cuenta</span><div><span className={owner.estadoCliente === 'ACTIVO' ? 'profile-status' : 'profile-role'}>{owner.estadoCliente === 'ACTIVO' ? 'Activa' : owner.estadoCliente === 'INACTIVO' ? 'Inactiva' : owner.estadoCliente || 'No disponible'}</span></div></div><ReadField label="Fecha de registro" value={dateText(profile.fechaRegistro || owner.fechaRegistroClinica)} /></> : <><ReadField label="Especialidad" value={vet.especialidad} /><ReadField label="Colegiatura" value={vet.nroColegiatura} /><ReadField label="Tratamiento profesional" value={vet.tratamientoProfesional || 'Sin tratamiento'} /></>}

      </div>
    </article>
    <form id="vetcare-personal-profile" className="profile-card" onSubmit={save}><h2>Datos personales</h2><div className="profile-form-grid">
      <ReadField label="Nombres" value={profile.nombres} />
      <ReadField label="Apellidos" value={profile.apellidos} />
      <ReadField label="Correo electrónico" value={profile.correo} />
      <label className="profile-field"><span>Celular</span><input type="tel" autoComplete="tel" maxLength={20} value={form.nroCelular} onChange={change('nroCelular')} readOnly={!editing} disabled={!!busy} className={editing ? 'profile-active-field' : ''} /></label>
      <label className="profile-field"><span>Dirección</span><input autoComplete="street-address" maxLength={200} value={form.direccion || ''} onChange={change('direccion')} readOnly={!editing} disabled={!!busy} className={editing ? 'profile-active-field' : ''} /></label>
    </div></form>
    <AccountSecurity/>
    {(preview || remove) && <PhotoDialog busy={!!busy} onClose={() => { setPreview(null); setRemove(false) }} title={preview ? 'Vista previa de tu fotografía' : 'Quitar fotografía'}>
      {preview ? <img className="profile-preview" src={preview.url} alt="Vista previa de la nueva fotografía" /> : <p>¿Quieres quitar tu fotografía de perfil? Tus demás datos se conservarán.</p>}
      {error && <p role="alert" className="profile-error">{error}</p>}
      <div className="profile-dialog-actions"><button type="button" disabled={!!busy} onClick={() => { setPreview(null); setRemove(false) }}>Cancelar</button><button type="button" className="profile-primary" disabled={!!busy} onClick={preview ? confirmPhoto : confirmRemove}>{busy ? 'Guardando…' : preview ? 'Guardar foto' : 'Quitar foto'}</button></div>
    </PhotoDialog>}
  </section>
}
function PhotoDialog({ children, title, busy, onClose }) {
  const dialog = useRef(null)
  useEffect(() => { dialog.current.showModal() }, [])
  return <dialog ref={dialog} className="profile-dialog" aria-labelledby="profile-dialog-title" onCancel={event => { if (busy) event.preventDefault(); else onClose() }}><button type="button" className="profile-dialog-close" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={20} /></button><h2 id="profile-dialog-title">{title}</h2>{children}</dialog>
}
