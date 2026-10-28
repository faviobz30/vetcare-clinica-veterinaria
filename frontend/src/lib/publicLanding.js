export const publicSections = [['inicio', 'Inicio'], ['servicios', 'Servicios'], ['como-funciona', 'Cómo funciona'], ['historias', 'Historias']]
export function appointmentDestination(user) {
  if (!user) return '/login'
  return ['ADMIN', 'VETERINARIO', 'PROPIETARIO'].includes(user.role) ? '/panel/citas' : '/panel'
}
export function featuredPublications(data) {
  if (!Array.isArray(data)) throw new Error('No se pudo interpretar el listado de historias públicas.')
  // Solo el DTO público, nunca recursos de historias clínicas o perfiles privados.
  return data.filter(h => h && h.id != null).map(h => ({
    id: h.id, titulo: h.titulo, contenido: h.contenido, mascota: h.mascota,
    autor: h.autor, categoria: h.categoria, fechaCreacion: h.fechaCreacion, foto: h.foto === true,
  })).sort((a, b) => String(b.fechaCreacion || '').localeCompare(String(a.fechaCreacion || '')) || String(b.id).localeCompare(String(a.id), undefined, { numeric: true })).slice(0, 3)
}
export async function loadPublications(client, signal) {
  return featuredPublications((await client.get('/publicaciones', { signal })).data)
}
