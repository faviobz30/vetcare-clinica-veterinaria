// Validación exclusiva del contacto ADMIN; no cambia formularios de otros roles.
export function adminContactErrors(draft) {
  const errors = {}
  if (!/^9[0-9]{8}$/.test((draft.nroCelular || '').trim())) errors.nroCelular = 'Ingresa 9 dígitos, comenzando por 9.'
  if ((draft.direccion || '').trim().length > 200) errors.direccion = 'La dirección admite hasta 200 caracteres.'
  return errors
}
export function adminContact(profile) {
  return { nroCelular: profile?.nroCelular || '', direccion: profile?.direccionContacto || '' }
}
