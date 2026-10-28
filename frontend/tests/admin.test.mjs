import test from 'node:test'
import assert from 'node:assert/strict'
import {adminSummary,adminActivity,adminMatches} from '../src/lib/admin.js'
import {attentionPermissions} from '../src/lib/attentions.js'
test('indicadores vacíos no inventan registros y fallos no se presentan como cero',()=>{
 assert.deepEqual(adminSummary({},'2030-01-10'),{users:null,vets:null,today:null,visits:null,states:{PENDIENTE:null,CONFIRMADA:null,ATENDIDA:null,CANCELADA:null,NO_ASISTIO:null}})
 const zero=adminSummary({usuarios:[],veterinarios:[],atenciones:[],citas:[]},'2030-01-10');assert.equal(zero.users,0);assert.equal(zero.today,0)
})
test('contadores usan registros reales sin sumar citas y atenciones como el mismo indicador',()=>{
 const counts=adminSummary({usuarios:[{},{}],veterinarios:[{}],atenciones:[{}],citas:[{fechaCita:'2030-01-10T09:00:00',estado:'ATENDIDA'},{fechaCita:'2030-01-11T09:00:00',estado:'PENDIENTE'}]},'2030-01-10')
 assert.equal(counts.users,2);assert.equal(counts.vets,1);assert.equal(counts.today,1);assert.equal(counts.visits,1);assert.equal(counts.states.ATENDIDA,1)
})
test('búsqueda admite acentos y múltiples campos sin mutar datos',()=>{
 assert.equal(adminMatches('sofia','Sofía','Ramírez'),true);assert.equal(adminMatches('CMVP','Sofía','CMVP-01'),true);assert.equal(adminMatches('otro','Sofía'),false)
})
test('actividad prioriza próximas activas y después recientes, sin mutar el listado',()=>{
 const rows=[{id:1,estado:'ATENDIDA',fechaCita:'2030-01-09T09:00:00'},{id:2,estado:'CONFIRMADA',fechaCita:'2030-01-11T10:00:00'},{id:3,estado:'CANCELADA',fechaCita:'2030-01-12T09:00:00'}]
 assert.deepEqual(adminActivity(rows,Date.parse('2030-01-10T10:00:00-05:00')).map(c=>c.id),[2,3,1]);assert.deepEqual(rows.map(c=>c.id),[1,2,3])
})
test('ADMIN solo consulta texto clínico y asigna precio, propietario solo lee',()=>{
 assert.deepEqual(attentionPermissions('ADMIN'),{write:false,remove:false,price:true});assert.equal(attentionPermissions('VETERINARIO').write,true);assert.equal(attentionPermissions('PROPIETARIO').price,false)
})
