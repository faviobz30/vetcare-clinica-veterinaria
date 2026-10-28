export const listOf = data => Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : [])
export const fullName = value => {
  if (!value) return ''
  const nested = value.usuario || value.usuarioResponse || value.datosUsuario || {}
  const direct = [value.nombres, value.apellidos].filter(Boolean).join(' ').trim()
  const inner = [nested.nombres, nested.apellidos].filter(Boolean).join(' ').trim()
  return direct || inner || value.nombreCompleto || value.nombreVeterinario || value.nombreUsuario || ''
}
export const vetLabel = v => {
  const name = fullName(v)
  const spec = v?.especialidad || 'Especialidad no indicada'
  return `${name || `Veterinario ${v.idVeterinario}`} — ${spec}`
}
export const dateDisplay = value => {
  if (!value) return '—'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value)
}
