import { useEffect, useState } from 'react'
import { PawPrint } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { getPetPhotoChange, PHOTO_CHANGED } from '../lib/petPhoto'

export default function PetAvatar({ pet, size = 44, className = '' }) {
  const { user } = useAuth() || {}
  const [change, setChange] = useState(null)
  const [image, setImage] = useState(null)
  const id = pet?.idMascota
  const mutation = getPetPhotoChange(id) || change
  const changed = mutation && String(mutation.id) === String(id)
  const available = changed ? mutation.tieneFoto : pet?.tieneFoto
  const version = changed ? mutation.version : 0
  const key = `${id}-${version}-${user?.idUsuario}-${user?.role}-${!!available}`
  useEffect(() => {
    const onChange = event => { if (String(event.detail.id) === String(id)) setChange(event.detail) }
    window.addEventListener(PHOTO_CHANGED, onChange)
    return () => window.removeEventListener(PHOTO_CHANGED, onChange)
  }, [id])
  useEffect(() => {
    if (!id || !available || !user?.token) return
    const controller = new AbortController()
    let url
    api.get(`/mascotas/${id}/foto`, { responseType: 'blob', signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted && data?.type?.startsWith('image/')) { url = URL.createObjectURL(data); setImage({ key, url }) }
    }).catch(() => { /* Avatar neutro si no existe o deja de estar autorizado. */ })
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url) }
  }, [id, available, key, user?.token])
  const src = available && image?.key === key ? image.url : null
  return <span className={className} style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, minWidth: size, borderRadius: '50%', overflow: 'hidden', border: '1px solid #e7e0f2', background: '#f6f3ff', color: '#8d77b7', verticalAlign: 'middle' }}>
    {src ? <img src={src} alt={`Fotografía de ${pet?.nombre || 'la mascota'}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImage(null)}/> : <PawPrint size={Math.round(size * .48)} aria-label="Sin fotografía disponible"/>}
  </span>
}
