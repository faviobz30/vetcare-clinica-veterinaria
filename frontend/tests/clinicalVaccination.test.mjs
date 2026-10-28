import test from 'node:test'
import assert from 'node:assert/strict'
import {vaccinationPayload,selectScheduledDose,vaccinationDateLabel} from '../src/lib/clinicalVaccination.js'
import {vaccineLists,vaccineEvents} from '../src/lib/vaccines.js'
import {ownerClinicalModel} from '../src/lib/ownerHistory.js'
const today='2030-01-10'
const pending=[{idVacuna:9,nombre:'Antirrábica',proximaDosis:'2030-01-28',observaciones:'Indicación clínica áéíóúñ'}]
const row={tipo:'aplicada',idVacunaProgramada:'',nombre:'Séxtuple',fechaAplicacion:today,proximaDosis:'',observaciones:''}
test('atención sin vacunación conserva el contrato vacío',()=>assert.deepEqual(vaccinationPayload([],pending,today),[]))
test('selección recupera nombre e indicaciones sin confundir fecha programada y aplicación',()=>{
 const selected=selectScheduledDose(row,'9',pending)
 assert.equal(selected.nombre,pending[0].nombre);assert.equal(selected.observaciones,pending[0].observaciones)
 assert.equal(selected.fechaAplicacion,today);assert.equal(selected.proximaDosis,'')
 const [body]=vaccinationPayload([selected],pending,today)
 assert.equal(body.idVacunaProgramada,9);assert.equal(body.aplicada,true);assert.equal(body.fechaAplicacion,today)
 assert.equal(body.idMascota,undefined);assert.equal(body.idVeterinario,undefined);assert.equal(body.idAtencion,undefined)
})
test('volver a vacuna nueva no arrastra indicaciones de otra dosis',()=>{
 const selected=selectScheduledDose(selectScheduledDose(row,'9',pending),'',pending)
 assert.equal(selected.nombre,'');assert.equal(selected.observaciones,'');assert.equal(selected.idVacunaProgramada,'')
})
test('dosis desaparecida se rechaza',()=>assert.throws(()=>selectScheduledDose(row,'99',pending),/no está disponible/))
test('programación futura nunca se transmite como aplicación',()=>{
 const [body]=vaccinationPayload([{...row,tipo:'programada',proximaDosis:'2030-02-10'}],pending,today)
 assert.equal(body.aplicada,false);assert.equal(body.fechaAplicacion,null);assert.equal(body.idVacunaProgramada,null)
})
test('aplicación futura y próxima dosis inválida se bloquean',()=>{
 assert.throws(()=>vaccinationPayload([{...row,fechaAplicacion:'2030-01-11'}],pending,today),/fecha efectiva/)
 assert.throws(()=>vaccinationPayload([{...row,proximaDosis:today}],pending,today),/posterior/)
 assert.throws(()=>vaccinationPayload([{...row,tipo:'programada'}],pending,today),/fecha de la vacuna futura/)
})
test('múltiples vacunas mantienen relaciones y refuerzo sin duplicados',()=>{
 const selected=selectScheduledDose(row,'9',pending)
 const result=vaccinationPayload([row,{...selected,proximaDosis:'2030-03-10'}],pending,today)
 assert.equal(result.length,2);assert.equal(result[1].proximaDosis,'2030-03-10')
 assert.throws(()=>vaccinationPayload([selected,selected],pending,today),/repetida/)
 assert.throws(()=>vaccinationPayload([row,{...row,nombre:' SÉXTUPLE '}],pending,today),/repetida/)
})
test('500 caracteres con acentos se conservan y 501 se rechazan',()=>{
 const notes='áéíóú'.repeat(100)
 assert.equal(vaccinationPayload([{...row,observaciones:notes}],pending,today)[0].observaciones,notes)
 assert.throws(()=>vaccinationPayload([{...row,observaciones:notes+'ñ'}],pending,today),/500/)
})
test('fechas visibles usan día/mes/año',()=>assert.equal(vaccinationDateLabel('2030-01-28'),'28/01/2030'))
test('aplicación y su próxima dosis aparecen una vez en calendario y expediente',()=>{
 const rows=[{idVacuna:1,fechaAplicacion:today,proximaDosis:'2030-03-10'},{idVacuna:2,idVacunaOrigen:1,fechaAplicacion:null,proximaDosis:'2030-03-10'}]
 assert.equal(vaccineLists(rows).upcoming.length,1);assert.equal(vaccineLists(rows).applied.length,1)
 assert.equal(vaccineEvents(rows).length,2)
 const model=ownerClinicalModel({pet:{},history:{},sections:{atenciones:{data:[]},vacunas:{data:rows}}},today)
 assert.equal(model.doses.length,1);assert.equal(model.applied.length,1)
})
