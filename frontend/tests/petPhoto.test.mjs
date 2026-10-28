import test from 'node:test'
import assert from 'node:assert/strict'
import { cropRectangle, dragCropOffset, createPetWithPhoto, getPetPhotoChange, notifyPetPhoto, MAX_PHOTO_BYTES, validatePhotoHeader } from '../src/lib/petPhoto.js'
const png = new Uint8Array([137,80,78,71,13,10,26,10])

test('valida formatos iniciales y el máximo de cinco MB', () => {
  assert.doesNotThrow(()=>validatePhotoHeader({size:MAX_PHOTO_BYTES,type:'image/png'},png))
  assert.doesNotThrow(()=>validatePhotoHeader({size:10,type:'image/jpeg'},new Uint8Array([255,216,255])))
  assert.doesNotThrow(()=>validatePhotoHeader({size:20,type:'image/webp'},new TextEncoder().encode('RIFF0000WEBP')))
  assert.throws(()=>validatePhotoHeader({size:MAX_PHOTO_BYTES+1,type:'image/png'},png),/5 MB/)
  assert.throws(()=>validatePhotoHeader({size:0,type:'image/png'},png),/Selecciona/)
  assert.throws(()=>validatePhotoHeader({size:10,type:'image/png'},new Uint8Array([1,2,3])),/válidas/)
  assert.throws(()=>validatePhotoHeader({size:10,type:'image/gif'},png),/válidas/)
})
test('recorte cuadrado centrado, zoom y movimiento sin salir de la imagen', () => {
  assert.deepEqual(cropRectangle(1000,600),{sx:200,sy:0,side:600})
  assert.deepEqual(cropRectangle(1000,600,2,-1,-1),{sx:0,sy:0,side:300})
  assert.deepEqual(cropRectangle(1000,600,2,1,1),{sx:700,sy:300,side:300})
  assert.deepEqual(cropRectangle(600,1000,3,10,-10),{sx:400,sy:0,side:200})
  assert.throws(()=>cropRectangle(600,600,0),/inválidos/)
})
test('registro sin foto usa un solo POST y no requiere datos de imagen', async () => {
  const calls=[]
  const result=await createPetWithPhoto({post:async url=>{calls.push(url);return {data:{idMascota:8}}}}, {}, null)
  assert.deepEqual(calls,['/mascotas']); assert.equal(result.photoError,null)
})
test('fallo de foto conserva mascota creada y nunca repite su POST', async () => {
  const calls=[];const failure=new Error('Subida fallida')
  const client={post:async url=>{calls.push(url);if(url.endsWith('/foto'))throw failure;return {data:{idMascota:8}}}}
  const result=await createPetWithPhoto(client,{nombre:'Prueba'},new Blob(['imagen'],{type:'image/png'}))
  assert.deepEqual(calls,['/mascotas','/mascotas/8/foto']);assert.equal(result.pet.idMascota,8);assert.equal(result.photoError,failure)
})
test('subida correcta marca la fotografía sin duplicar la mascota',async()=>{
  const result=await createPetWithPhoto({post:async()=>({data:{idMascota:8}})}, {}, new Blob(['imagen'],{type:'image/png'}))
  assert.equal(result.pet.tieneFoto,true);assert.equal(result.photoError,null)
})

test('cambios y eliminación llegan a avatares presentes y a los que se abren después', () => {
  const previous = globalThis.window
  globalThis.window = new EventTarget()
  const events = []
  window.addEventListener('vetcare:pet-photo-changed', event => events.push(event.detail))
  try {
    notifyPetPhoto('test-pet', true)
    const first = getPetPhotoChange('test-pet')
    assert.equal(first.tieneFoto, true)
    notifyPetPhoto('test-pet', true)
    assert.ok(getPetPhotoChange('test-pet').version > first.version)
    notifyPetPhoto('test-pet', false)
    assert.equal(getPetPhotoChange('test-pet').tieneFoto, false)
    assert.equal(events.length, 3)
  } finally { globalThis.window = previous }
})

test('arrastre directo sigue la escala de la imagen y permite mouse o touch', () => {
  const start = cropRectangle(1000, 600, 2)
  const moved = dragCropOffset(1000, 600, 2, 300, 0, 0, 70, -30)
  const end = cropRectangle(1000, 600, 2, moved.x, moved.y)
  assert.ok(Math.abs(end.sx - (start.sx - 70)) < 0.000001)
  assert.ok(Math.abs(end.sy - (start.sy + 30)) < 0.000001)
  assert.deepEqual(dragCropOffset(1000,600,2,300,0,0,100000,-100000), {x:-1,y:1})
})
test('el arrastre evita áreas vacías cuando el recorte ocupa todo un eje', () => {
  assert.deepEqual(dragCropOffset(600,600,1,224,0,0,200,200), {x:0,y:0})
  assert.equal(dragCropOffset(1000,600,1,224,0,0,20,20).y, 0)
  assert.throws(()=>dragCropOffset(600,600,2,0,0,0,20,20), /inválida/)
})
