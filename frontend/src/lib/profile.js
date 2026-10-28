export function profileDraft(profile, detail, role) {
  return { nroCelular: profile?.nroCelular || '', direccion: role === 'PROPIETARIO' ? (detail?.direccion || '') : (detail?.direccion || '') }
}
export function profileChanges(draft, baseline) {
  const changes = {}
  for (const key of ['nroCelular', 'direccion']) {
    const value = (draft[key] || '').trim()
    if (value === (baseline[key] || '').trim()) continue
    if (key === 'nroCelular' && (value.length > 20 || !/^\+?[0-9][0-9 ()-]{5,19}$/.test(value))) throw new Error('Ingresa un celular válido de 6 a 20 caracteres.')
    if (key === 'direccion' && value.length > 200) throw new Error('La dirección admite hasta 200 caracteres.')
    changes[key] = value
  }
  return changes
}
export function profileDisplayName(profile, vet, role) {
  const prefix = role === 'VETERINARIO' && ['Dr.', 'Dra.'].includes(vet?.tratamientoProfesional) ? vet.tratamientoProfesional : ''
  return [prefix, profile?.nombres, profile?.apellidos].filter(Boolean).join(' ')
}
