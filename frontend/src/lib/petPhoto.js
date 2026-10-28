export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_CHANGED = 'vetcare:pet-photo-changed'
const changes = new Map()
export const getPetPhotoChange = id => changes.get(String(id))

export function validatePhotoHeader(file, bytes) {
  if (!file || file.size === 0) throw new Error('Selecciona una fotografía.')
  if (file.size > MAX_PHOTO_BYTES) throw new Error('La fotografía no debe superar 5 MB.')
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to))
  const webp = ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !(png || jpg || webp)) throw new Error('Solo se admiten fotografías JPG, PNG o WebP válidas.')
}

export function cropRectangle(width, height, zoom = 1, x = 0, y = 0) {
  if (!(width > 0 && height > 0 && Number.isFinite(zoom) && zoom >= 1 && zoom <= 3)) throw new Error('Dimensiones o zoom inválidos.')
  const side = Math.min(width, height) / zoom
  const clamp = value => Math.max(-1, Math.min(1, value))
  return { sx: (width - side) * (clamp(x) + 1) / 2, sy: (height - side) * (clamp(y) + 1) / 2, side }
}

export async function decodePetPhoto(file) {
  if (file?.size > MAX_PHOTO_BYTES) throw new Error('La fotografía no debe superar 5 MB.')
  validatePhotoHeader(file, new Uint8Array(await file.arrayBuffer()))
  let image
  try { image = await createImageBitmap(file, { imageOrientation: 'from-image' }) }
  catch { throw new Error('No se pudo abrir la imagen. Puede estar corrupta.') }
  if (image.width * image.height > 16_777_216) { image.close(); throw new Error('La imagen no debe superar 16 megapíxeles.') }
  return image
}

export function notifyPetPhoto(id, tieneFoto) {
  const detail = { id, tieneFoto, version: (changes.get(String(id))?.version || 0) + 1 }
  changes.set(String(id), detail)
  window.dispatchEvent(new CustomEvent(PHOTO_CHANGED, { detail }))
}

// La mascota ya creada se conserva si falla la foto: nunca repetir el POST de registro.
export async function createPetWithPhoto(client, payload, photo) {
  const { data: pet } = await client.post('/mascotas', payload)
  let photoError = null
  if (photo) {
    const body = new FormData(); body.append('foto', photo)
    try { await client.post(`/mascotas/${pet.idMascota}/foto`, body); pet.tieneFoto = true }
    catch (error) { photoError = error }
  }
  return { pet, photoError }
}

// Pointer Events comparte la misma geometría para mouse, lápiz y touch.
export function dragCropOffset(width, height, zoom, viewportWidth, startX, startY, dx, dy) {
  if (!(viewportWidth > 0)) throw new Error('Área de recorte inválida.')
  const { side } = cropRectangle(width, height, zoom)
  const clamp = value => Math.max(-1, Math.min(1, value))
  return {
    x: width > side ? clamp(startX - dx * side / viewportWidth * 2 / (width - side)) : 0,
    y: height > side ? clamp(startY - dy * side / viewportWidth * 2 / (height - side)) : 0,
  }
}
