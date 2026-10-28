import test from 'node:test'
import assert from 'node:assert/strict'
import { appointmentDestination, featuredPublications, loadPublications, publicSections } from '../src/lib/publicLanding.js'

test('solicitar cita conserva autenticación y dirige roles existentes al flujo privado',()=>{
  assert.equal(appointmentDestination(null),'/login')
  for(const role of ['ADMIN','VETERINARIO','PROPIETARIO']) assert.equal(appointmentDestination({role}),'/panel/citas')
  assert.equal(appointmentDestination({role:'DESCONOCIDO'}),'/panel')
})
test('cuatro secciones de una sola página, sin rutas públicas adicionales',()=>{
  assert.deepEqual(publicSections.map(([id])=>id),['inicio','servicios','como-funciona','historias'])
})
test('máximo tres historias públicas recientes con selección determinista sin mutar el origen',()=>{
  const rows=[1,4,2,3].map(id=>({id,fechaCreacion:`2026-10-${20+id}T10:00:00`,titulo:'Historia '+id,contenido:'Texto íntegro\nLínea dos',foto:true})), before=JSON.stringify(rows)
  assert.deepEqual(featuredPublications(rows).map(h=>h.id),[4,3,2]);assert.equal(JSON.stringify(rows),before)
  assert.equal(featuredPublications(rows)[0].contenido,'Texto íntegro\nLínea dos')
})
test('cero, una y dos publicaciones no se rellenan con testimonios ficticios',()=>{
  for(let n=0;n<3;n++)assert.equal(featuredPublications(Array.from({length:n},(_,id)=>({id,titulo:'Real'}))).length,n)
})
test('proyección pública excluye datos clínicos y contacto aunque lleguen campos adicionales',()=>{
  const [item]=featuredPublications([{id:1,titulo:'Pública',autor:'Nombre público',mascota:'Mascota',diagnostico:'PRIVADO',correo:'privado',antecedentes:{},vacunas:[],telefono:'privado'}])
  for(const field of ['diagnostico','correo','antecedentes','vacunas','telefono','idMascota']) assert.equal(field in item,false)
  assert.equal(item.autor,'Nombre público')
})
test('fechas iguales usan ID descendente y registros sin fecha se ordenan al final',()=>{
  assert.deepEqual(featuredPublications([{id:2},{id:3,fechaCreacion:'2026-01-01'},{id:11,fechaCreacion:'2026-01-01'}]).map(h=>h.id),[11,3,2])
})
test('errores y respuestas malformadas no se convierten en comunidad vacía',async()=>{
  assert.throws(()=>featuredPublications({content:[]}))
  await assert.rejects(loadPublications({get:async()=>{throw Error('HTTP 500')}}))
})
test('solo consulta GET público y propaga la cancelación; no llama perfiles ni recursos clínicos',async()=>{
  const calls=[],signal=new AbortController().signal
  const client={get:async(url,config)=>{calls.push({url,signal:config.signal});return {data:[{id:1,foto:true}]}}}
  assert.equal((await loadPublications(client,signal)).length,1);assert.deepEqual(calls,[{url:'/publicaciones',signal}])
})
