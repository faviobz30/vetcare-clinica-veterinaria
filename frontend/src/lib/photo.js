// Conversión en el navegador a JPEG con un máximo estricto de 2 MB.
const MAX_BYTES = 2 * 1024 * 1024
export async function prepareProfilePhoto(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Selecciona una imagen válida.')
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') throw new Error('Selecciona una fotografía JPG, PNG, WebP o AVIF compatible con tu navegador.')
  let bitmap
  try { bitmap = await createImageBitmap(file) }
  catch { throw new Error('Tu navegador no puede abrir este formato. Convierte la foto a JPG o PNG.') }
  try {
    const canvas = document.createElement('canvas')
    let scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const quality = Math.max(.45, .84 - attempt * .06)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_BYTES) return new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' })
      scale *= .75
    }
    throw new Error('No se pudo reducir la foto a menos de 2 MB. Prueba otra imagen.')
  } finally { bitmap.close() }
}
