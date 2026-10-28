import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 12000,
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('vetcare_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function errorText(error) {
  if (!error.response) return 'No se pudo contactar al backend. Comprueba que Spring Boot esté iniciado y que CORS permita http://localhost:5173.'
  const data = error.response.data
  if (data?.campos && typeof data.campos === 'object') return Object.entries(data.campos).map(([k,v]) => `${k}: ${v}`).join(' · ')
  return data?.error || data?.mensaje || data?.message || `Error HTTP ${error.response.status}`
}
