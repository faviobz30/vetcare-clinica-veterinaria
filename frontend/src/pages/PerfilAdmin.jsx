import AccountSecurity from '../components/AccountSecurity'
import { useEffect, useRef, useState } from 'react'
import { Camera, Pencil, Save, Trash2, UserRound, X } from 'lucide-react'
import { api, errorText } from '../lib/api'
import { useCitaToast } from '../lib/useCitaToast'
import { profileChanges } from '../lib/profile'
import { adminContact, adminContactErrors } from '../lib/adminProfile'
import { useAuth } from '../contexts/AuthContext'
import { prepareProfilePhoto } from '../lib/photo'
import ProfilePhotoDialog from '../components/ProfilePhotoDialog'
import './Perfil.css'

export default function PerfilAdmin() {
  const { user, profile, profileError, photoUrl, uploadPhoto, deletePhoto, refreshProfile } = useAuth()
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useCitaToast()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saved, setSaved] = useState(null)
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)
  const [remove, setRemove] = useState(false)
  const input = useRef(null)
  const lock = useRef(false)
  const contact = saved || adminContact(profile)
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview])
  function start(action) {
    if (lock.current) return false
    lock.current = true; setBusy(action); setError(''); setMessage(''); return true
  }
  function finish() { lock.current = false; setBusy('') }
  function edit() { setDraft(contact); setFields({}); setError(''); setMessage(''); setEditing(true) }
  function cancel() { setDraft(contact); setFields({}); setError(''); setEditing(false) }
  function change(key, value) {
    setDraft(current => ({ ...current, [key]: value }))
    setFields(current => ({ ...current, [key]: undefined })); setError('')
  }
  async function onPhoto(event) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file || !start('preparando')) return
    try {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw Error('Selecciona una fotografía JPG, PNG, WebP o AVIF.')
      const prepared = await prepareProfilePhoto(file)
      setPreview({ file: prepared, url: URL.createObjectURL(prepared) })
    } catch (err) { setError(err.message) } finally { finish() }
  }
  async function confirmPhoto() {
    if (!start('foto')) return
    try {
      if (preview) await uploadPhoto(preview.file, { verify: true })
      else await deletePhoto({ verify: true })
      setPreview(null); setRemove(false)
      setMessage(preview ? 'Fotografía guardada y comprobada.' : 'Fotografía eliminada y comprobada.')
    } catch (err) { setError(err.message?.startsWith('La fotografía') ? err.message : errorText(err)) }
    finally { finish() }
  }
  async function save(event) {
    event.preventDefault()
    if (lock.current || !editing) return
    const invalid = adminContactErrors(draft); setFields(invalid)
    if (Object.keys(invalid).length) return
    const changes = profileChanges(draft, contact)
    if (!Object.keys(changes).length) { setEditing(false); setError(''); setMessage('No hay cambios para guardar.'); return }
    if (!start('datos')) return
    try {
      const { data } = await api.patch('/usuarios/me', changes)
      setSaved(adminContact(data)); setEditing(false); setFields({})
      try { await refreshProfile(); setSaved(null); setMessage('Datos guardados correctamente.') }
      catch { setError('Los datos se guardaron, pero no se pudo actualizar la vista. Reintenta la consulta.'); }
    } catch (err) {
      const reported = err.response?.data?.campos
      if (reported && ('nroCelular' in reported || 'direccion' in reported)) setFields(reported)
      else setError(errorText(err))
    } finally { finish() }
  }
  async function retry() {
    if (!start('consulta')) return
    try { await refreshProfile(); setSaved(null) } catch { setError('No se pudo actualizar el perfil. Intenta nuevamente.') } finally { finish() }
  }
  if (!profile || profileError) return <section className="account-profile admin-profile" aria-busy={!profile && !profileError}><h1>Mi perfil</h1>{profileError ? <><p role="alert" className="profile-error">{profileError}</p><button className="profile-primary" disabled={!!busy} onClick={retry}>Reintentar</button></> : <p>Cargando tu perfil…</p>}{error && <p role="alert">{error}</p>}</section>
  return <section className="account-profile admin-profile">
    <header className="profile-header"><div><h1>Mi perfil</h1><p>Datos de tu cuenta y tu información personal.</p></div>{!editing && <button type="button" className="profile-primary" disabled={!!busy || !!preview || remove} onClick={edit}><Pencil size={17}/>Editar información</button>}</header>
    {error && !preview && !remove && <div className="profile-error" role="alert">{error}{!editing && <button type="button" className="profile-edit" disabled={!!busy} onClick={retry}>Reintentar consulta</button>}</div>}
    {message && <p className="profile-message" role="status">{message}</p>}
    <article className="profile-card profile-identity">
      <div className="profile-avatar">{photoUrl ? <img src={photoUrl} alt="Tu fotografía de perfil"/> : <UserRound size={56} aria-label="Sin fotografía"/>}</div>
      <div className="profile-identity-text"><h2>{[profile.nombres, profile.apellidos].filter(Boolean).join(' ') || user?.name}</h2><p>{profile.correo}</p><span className="profile-role">ADMIN</span>
        <div className="profile-photo-actions"><button type="button" disabled={!!busy || editing} onClick={() => input.current.click()}><Camera size={19}/>Cambiar foto</button><button type="button" disabled={!!busy || editing || !photoUrl} onClick={() => { setError(''); setMessage(''); setRemove(true) }}><Trash2 size={19}/>Quitar foto</button></div>
        <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif" onChange={onPhoto} aria-label="Seleccionar fotografía del administrador"/>
      </div>
    </article>
    <article className="profile-card"><h2>Información de la cuenta</h2><div className="profile-info-grid">
      {[['Tipo de documento', profile.tipoDocumento], ['Número de documento', profile.nroDocumento], ['Rol', user?.role]].map(([label, value]) => <div className="profile-field" key={label}><span>{label}</span><strong className="admin-profile-value">{value || 'No disponible'}</strong></div>)}
    </div></article>
    <form className="profile-card" onSubmit={save} noValidate><h2>Datos personales</h2><div className="profile-form-grid">
      <div className="profile-field"><span>Celular</span>{editing ? <><input aria-label="Celular" type="tel" inputMode="numeric" autoComplete="tel" maxLength={9} className="profile-active-field" value={draft.nroCelular} disabled={!!busy} onChange={e => change('nroCelular', e.target.value)} aria-invalid={!!fields.nroCelular} aria-describedby={fields.nroCelular ? 'admin-phone-error' : undefined}/>{fields.nroCelular && <small id="admin-phone-error" role="alert">{fields.nroCelular}</small>}</> : <strong className="admin-profile-value">{contact.nroCelular || 'No registrado'}</strong>}</div>
      <div className="profile-field"><span>Dirección</span>{editing ? <><input aria-label="Dirección" autoComplete="street-address" maxLength={200} className="profile-active-field" value={draft.direccion} disabled={!!busy} onChange={e => change('direccion', e.target.value)} aria-invalid={!!fields.direccion} aria-describedby={fields.direccion ? 'admin-address-error' : undefined}/>{fields.direccion && <small id="admin-address-error" role="alert">{fields.direccion}</small>}</> : <strong className="admin-profile-value">{contact.direccion || 'No registrada'}</strong>}</div>
    </div>{editing && <div className="profile-edit-actions"><button type="button" className="profile-edit" disabled={!!busy} onClick={cancel}><X size={17}/>Cancelar</button><button className="profile-primary" disabled={!!busy}><Save size={17}/>{busy === 'datos' ? 'Guardando…' : 'Guardar'}</button></div>}</form>
    <AccountSecurity/>
    {(preview || remove) && <ProfilePhotoDialog busy={!!busy} onClose={() => { setPreview(null); setRemove(false); setError('') }}>
      <h2>{preview ? 'Vista previa de tu fotografía' : 'Quitar fotografía'}</h2>
      {preview ? <img className="profile-preview" src={preview.url} alt="Vista previa de la nueva fotografía"/> : <p>¿Quieres quitar tu fotografía de perfil? Tus demás datos se conservarán.</p>}
      {error && <p className="profile-error" role="alert">{error}</p>}
      <div className="profile-dialog-actions"><button type="button" disabled={!!busy} onClick={() => { setPreview(null); setRemove(false); setError('') }}>Cancelar</button><button type="button" className="profile-primary" disabled={!!busy} onClick={confirmPhoto}>{busy ? 'Comprobando…' : preview ? 'Guardar foto' : 'Quitar foto'}</button></div>
    </ProfilePhotoDialog>}
  </section>
}