import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, Trash2, X } from 'lucide-react'
import PetAvatar from './PetAvatar'
import PetPhotoCrop from './PetPhotoCrop'
import { api, errorText } from '../lib/api'
import { getPetPhotoChange, notifyPetPhoto } from '../lib/petPhoto'

export default function PetPhotoEditor({ pet, initialPhoto = null, initialError = '', onClose, onSaved }) {
  const [raw, setRaw] = useState(null)
  const [pending, setPending] = useState(initialPhoto)
  const [preview, setPreview] = useState('')
  const [hasPhoto, setHasPhoto] = useState(() => getPetPhotoChange(pet.idMascota)?.tieneFoto ?? !!pet.tieneFoto)
  const [error, setError] = useState(initialError)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const panel = useRef(null)
  const cancelCrop = useCallback(() => setRaw(null), [])
  useEffect(() => {
    if (!pending) return
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(pending)
    return () => { reader.onload = null; if (reader.readyState === FileReader.LOADING) reader.abort() }
  }, [pending])
  useEffect(() => {
    const old = document.body.style.overflow, previous = document.activeElement
    document.body.style.overflow = 'hidden'; panel.current.querySelector('button')?.focus()
    const key = e => {
      if (e.key === 'Escape' && !sending.current && !panel.current.ownerDocument.querySelector('[aria-labelledby="pet-crop-title"]')) onClose()
      if (e.key === 'Tab' && panel.current.contains(document.activeElement)) {
        const controls = [...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled)')]
        if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1)?.focus() }
        else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0]?.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = old; document.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus() }
  }, [onClose])
  async function save() {
    if (!pending || sending.current) return
    sending.current = true; setBusy(true); setError(''); setMessage('')
    const body = new FormData(); body.append('foto', pending)
    try { await api.post(`/mascotas/${pet.idMascota}/foto`, body); notifyPetPhoto(pet.idMascota, true); setPending(null); setHasPhoto(true); setMessage('Fotografía guardada.'); onSaved?.() }
    catch (err) { setError(errorText(err)) }
    finally { sending.current = false; setBusy(false) }
  }
  async function remove() {
    if (sending.current || !window.confirm('¿Eliminar la fotografía de esta mascota?')) return
    sending.current = true; setBusy(true); setError('')
    try { await api.delete(`/mascotas/${pet.idMascota}/foto`); notifyPetPhoto(pet.idMascota, false); setPending(null); setHasPhoto(false); setMessage('Fotografía eliminada.'); onSaved?.() }
    catch (err) { setError(errorText(err)) }
    finally { sending.current = false; setBusy(false) }
  }
  return createPortal(<div className="fixed inset-0 z-[100] bg-[#211431]/55 flex items-center justify-center p-4"><section ref={panel} role="dialog" aria-modal="true" aria-labelledby="pet-photo-title" className="bg-white rounded-3xl w-full max-w-md p-6 text-[#3B2382]"><header className="flex justify-between items-center gap-3"><h2 id="pet-photo-title" className="text-xl font-bold">Fotografía de la mascota</h2><button disabled={busy} type="button" onClick={onClose} aria-label="Cerrar fotografía" className="p-2"><X size={20}/></button></header><p className="text-sm text-gray-500 mt-2">{pet.nombre} · JPG, PNG o WebP, hasta 5 MB.</p><div className="my-6 flex justify-center">{pending && preview ? <img src={preview} alt="Recorte pendiente de guardar" className="w-28 h-28 object-cover rounded-full border border-violet-100"/> : <PetAvatar pet={{ ...pet, tieneFoto: hasPhoto }} size={112}/>}</div><label className="btn btn-ghost w-full cursor-pointer"><Camera size={17}/>{hasPhoto ? 'Cambiar fotografía' : 'Subir fotografía'}<input className="hidden" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) { setError(''); setRaw(file) } }}/></label>{hasPhoto && <button disabled={busy} type="button" className="btn btn-ghost w-full mt-2" onClick={remove}><Trash2 size={16}/>Eliminar fotografía</button>}{error && <p role="alert" className="text-sm text-red-700 mt-3">{error}</p>}{message && <p role="status" className="text-sm text-emerald-700 mt-3">{message}</p>}{pending && <p className="text-xs text-gray-500 mt-3">El recorte todavía no se ha guardado. Cancelar conservará la fotografía anterior.</p>}<div className="flex justify-end gap-3 mt-5"><button disabled={busy} type="button" className="btn btn-ghost" onClick={onClose}>{pending ? 'Cancelar' : 'Cerrar'}</button><button disabled={!pending || busy} type="button" className="btn btn-primary" onClick={save}>{busy ? 'Guardando…' : 'Guardar fotografía'}</button></div>{raw && <PetPhotoCrop key={raw.name + raw.lastModified} file={raw} onCancel={cancelCrop} onConfirm={file => { setPending(file); setRaw(null) }}/>}</section></div>, document.body)
}
