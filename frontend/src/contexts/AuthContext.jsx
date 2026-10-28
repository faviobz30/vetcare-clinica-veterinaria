import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)
const loginPath = import.meta.env.VITE_LOGIN_PATH || '/auth/login'
const profilePath = '/usuarios/me'

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(payload))
  } catch { return {} }
}
function readRole(source) {
  const raw = source?.rol ?? source?.role ?? source?.authorities ?? source?.roles
  const value = Array.isArray(raw) ? raw[0] : raw
  const name = typeof value === 'string' ? value : (value?.authority || value?.nombre || value?.name || '')
  return name.replace(/^ROLE_/, '').replace(/^ROL_/, '').toUpperCase()
}
function getInitialAuth() {
  const token = sessionStorage.getItem('vetcare_token')
  if (!token) return null
  const claims = decodeJwt(token)
  if (claims.exp && claims.exp * 1000 <= Date.now()) {
    sessionStorage.removeItem('vetcare_token')
    sessionStorage.removeItem('vetcare_role')
    return null
  }
  return { token, role: sessionStorage.getItem('vetcare_role') || readRole(claims), name: claims.nombre || claims.sub || 'Usuario', idUsuario: claims.idUsuario }
}
function displayName(p, fallback) {
  return [p?.nombres, p?.apellidos].filter(Boolean).join(' ').trim() || fallback
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialAuth)
  const [profile, setProfile] = useState(null)
  const [owner, setOwner] = useState(null)
  const [vet, setVet] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [photoVersion, setPhotoVersion] = useState(0)
  const [profileError, setProfileError] = useState('')

  async function refreshProfile() {
    const token = user?.token
    const { data } = await api.get(profilePath)
    const role = readRole(data)
    const detail = role === 'PROPIETARIO' ? (await api.get('/propietarios/me')).data : role === 'VETERINARIO' ? (await api.get('/veterinarios/me')).data : null
    if (sessionStorage.getItem('vetcare_token') !== token) return
    setProfile(data); setOwner(role === 'PROPIETARIO' ? detail : null); setVet(role === 'VETERINARIO' ? detail : null)
    const prefix = role === 'VETERINARIO' && ['Dr.', 'Dra.'].includes(detail?.tratamientoProfesional) ? detail.tratamientoProfesional + ' ' : ''
    setUser(prev => prev?.token === token ? { ...prev, name: prefix + displayName(data, prev.name) } : prev)
    setProfileError('')
  }

  useEffect(() => {
    if (!user?.token) return
    let active = true
    // La URL de objeto se revoca al cerrar sesión o actualizar la fotografía.
    let blobUrl
    async function loadProfile() {
      try {
        const { data } = await api.get(profilePath)
        if (!active) return
        setProfileError('')
        setProfile(data)
        setUser(prev => prev?.token === user.token ? {
          ...prev,
          role: readRole(data) || prev.role,
          name: displayName(data, prev.name),
          idUsuario: data.idUsuario ?? prev.idUsuario,
        } : prev)
        const role = readRole(data)
        if (role === 'PROPIETARIO') {
          try { const own = await api.get('/propietarios/me'); if (active) setOwner(own.data) } catch { if (active) { setOwner(null); setProfileError('No se pudo cargar la información del propietario. Intenta nuevamente.') } }
        } else if (role === 'VETERINARIO') {
          try { const mine = await api.get('/veterinarios/me'); if (active) { setVet(mine.data); const prefix = ['Dr.', 'Dra.'].includes(mine.data.tratamientoProfesional) ? mine.data.tratamientoProfesional + ' ' : ''; setUser(prev => prev?.token === user.token ? {...prev, name: prefix + displayName(data, prev.name)} : prev) } } catch { if (active) { setVet(null); setProfileError('No se pudo cargar la información profesional. Intenta nuevamente.') } }
        } else { setOwner(null); setVet(null) }
      } catch (err) {
        if (active) setProfileError('No se pudo cargar el perfil. Intenta nuevamente.')
      }
      try {
        const { data } = await api.get(`${profilePath}/foto`, { responseType: 'blob' })
        if (!active) return
        if (data?.type?.startsWith('image/')) {
          blobUrl = URL.createObjectURL(data)
          setPhotoUrl(blobUrl)
        } else setPhotoUrl(null)
      } catch (err) {
        if (active) {
          setPhotoUrl(null)
          if (err.response?.status !== 404) console.warn('No se pudo consultar la fotografía:', err.response?.status || err.message)
        }
      }
    }
    loadProfile()
    return () => { active = false; if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [user?.token, photoVersion])

  async function login(correo, contrasena) {
    const { data } = await api.post(loginPath, { correo, contrasena })
    const token = data?.token ?? data?.accessToken ?? data?.jwt
    if (!token || typeof token !== 'string') throw new Error('El login respondió, pero no encontramos el JWT. Revisa el formato de LoginResponse.')
    const claims = decodeJwt(token)
    const role = readRole(data) || readRole(claims)
    const auth = { token, role, name: data?.nombre || claims?.nombre || claims?.sub || correo, idUsuario: claims?.idUsuario }
    sessionStorage.setItem('vetcare_token', token)
    sessionStorage.setItem('vetcare_role', role)
    setProfileError('')
    setProfile(null)
    setOwner(null)
    setVet(null)
    setPhotoUrl(null)
    setUser(auth)
    return auth
  }
  async function uploadPhoto(file) {
    const body = new FormData()
    body.append('foto', file)
    await api.post(`${profilePath}/foto`, body, { timeout: 30000 })
    setPhotoVersion(v => v + 1)
  }
  async function deletePhoto() {
    await api.delete(`${profilePath}/foto`)
    setPhotoUrl(null)
    setPhotoVersion(v => v + 1)
  }
  function logout() {
    sessionStorage.removeItem('vetcare_token')
    sessionStorage.removeItem('vetcare_role')
    setUser(null)
    setProfileError('')
    setProfile(null)
    setOwner(null)
    setVet(null)
    setPhotoUrl(null)
  }
  return <AuthContext.Provider value={{ user, profile, owner, vet, setOwner, photoUrl, profileError, refreshProfile, login, logout, uploadPhoto, deletePhoto }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
