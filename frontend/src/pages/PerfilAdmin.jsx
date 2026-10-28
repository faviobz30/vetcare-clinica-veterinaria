import {api} from '../lib/api'
import {useCitaToast} from '../lib/useCitaToast'
import {profileChanges} from '../lib/profile'
import './Perfil.css'
import { useState }  from 'react'
import { Camera, Trash2, UserRound } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { errorText } from '../lib/api'
import { prepareProfilePhoto } from '../lib/photo'

export default function PerfilAdmin() {
  const { user, profile, photoUrl, uploadPhoto, deletePhoto,refreshProfile } = useAuth()
  const role = user?.role
  const [busy,setBusy] = useState('')
  const [message,setMessage] = useCitaToast()
  const [editing,setEditing]=useState(false),[draft,setDraft]=useState({})
  const [error,setError] = useState('')
  async function onPhoto(e) {
    const file = e.target.files?.[0]; e.target.value=''
    if (!file) return
    setError(''); setMessage(''); setBusy('foto')
    try { await uploadPhoto(await prepareProfilePhoto(file)); setMessage('Fotografía actualizada.') }
    catch (err) { setError(err.response ? errorText(err) : err.message) }
    finally { setBusy('') }
  }
  async function onDeletePhoto() {
    if (!window.confirm('¿Eliminar tu fotografía de perfil?')) return
    setError(''); setBusy('foto')
    try { await deletePhoto(); setMessage('Fotografía eliminada.') }
    catch (err) { setError(errorText(err)) }
    finally { setBusy('') }
  }
  async function save(e){e.preventDefault();if(busy)return;setBusy('datos');setError('');try{const baseline={nroCelular:profile?.nroCelular||'',direccion:profile?.direccionContacto||''};const p=profileChanges(draft,baseline);if(Object.keys(p).length)await api.patch('/usuarios/me',p);await refreshProfile();setEditing(false);setMessage('Datos guardados correctamente.')}catch(err){setError(err.response?errorText(err):err.message)}finally{setBusy('')}}
  return <section className="account-profile space-y-6">
    <div><h1 className="text-3xl font-black flex items-center gap-2"><UserRound/> Mi perfil</h1><p className="text-vetcare-text-muted mt-1">Datos de la cuenta autenticada, según tu rol.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 text-red-800 p-3">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 text-emerald-800 p-3">{message}</p>}
    <article className="bg-white border border-vetcare-soft rounded-2xl p-6 flex gap-5 items-center">
      <span className="w-20 h-20 rounded-full overflow-hidden bg-[#eaddfa] grid place-items-center text-2xl font-black text-[#6927a9]">
        {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover"/> : (profile?.nombres || 'V').charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-lg">{[profile?.nombres, profile?.apellidos].filter(Boolean).join(' ') || user?.name}</p>
        <p className="text-sm text-vetcare-text-muted">{profile?.correo}</p>
        <p className="text-xs mt-1 font-semibold text-vetcare-primary">{role}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <label className="btn btn-ghost text-sm"><Camera size={16}/> Cambiar foto<input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/avif" onChange={onPhoto} disabled={!!busy}/></label>
          {photoUrl && <button type="button" className="btn btn-ghost text-sm" disabled={!!busy} onClick={onDeletePhoto}><Trash2 size={16}/> Quitar foto</button>}
        </div>
      </div>
    </article>
    {!editing?<button className="profile-edit" onClick={()=>{setDraft({nroCelular:profile?.nroCelular||'',direccion:profile?.direccionContacto||''});setEditing(true)}}>Editar información</button>:null}
    <form className="profile-card" onSubmit={save}><h2>Datos personales</h2><div className="profile-form-grid"><label className="profile-field">Celular<input className="input" readOnly={!editing} disabled={!!busy} value={editing?draft.nroCelular:profile?.nroCelular||''} onChange={e=>setDraft(d=>({...d,nroCelular:e.target.value}))}/></label><label className="profile-field">Dirección<input className="input" maxLength={200} readOnly={!editing} disabled={!!busy} value={editing?draft.direccion:profile?.direccionContacto||''} onChange={e=>setDraft(d=>({...d,direccion:e.target.value}))}/></label></div>{editing&&<div className="flex gap-3 mt-4"><button type="button" className="btn btn-ghost" disabled={!!busy} onClick={()=>setEditing(false)}>Cancelar</button><button className="btn btn-primary" disabled={!!busy}>Guardar</button></div>}</form>
    <dl className="bg-white border border-vetcare-soft rounded-2xl p-6 grid sm:grid-cols-2 gap-4 text-sm">
      <div><dt className="text-vetcare-text-muted">Documento</dt><dd className="font-semibold">{profile?.tipoDocumento} {profile?.nroDocumento}</dd></div>
      <div><dt className="text-vetcare-text-muted">Celular</dt><dd className="font-semibold">{profile?.nroCelular || '—'}</dd></div>
    </dl>
  </section>
}
