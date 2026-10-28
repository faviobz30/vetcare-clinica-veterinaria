import test from 'node:test'
import assert from 'node:assert/strict'
import { antecedentPayload, saveAntecedentGroup, requiresAntecedentReason } from '../src/lib/antecedents.js'
const current={version:0,estadoAlergias:'ALERGIAS_REGISTRADAS',alergiasSustancias:'Sustancia registrada',alergiasReacciones:'Reacción',notasMedicas:'Cuidados\nÍntegros',cirugiasPrevias:'Procedimiento',enfermedadesRelevantes:'Condición',alertasMedicas:'Alerta'}
for(const [group,key] of [['alergias','alergiasObservaciones'],['medicos','enfermedadesRelevantes'],['cirugias','cirugiasPrevias'],['cuidados','notasMedicas']])test(`Tarjeta ${group} conserva los demás campos y saltos`,()=>{
 const values=Object.fromEntries(Object.entries(current));values[key]='Actualización\nCon áéíóúñ'
 const body=antecedentPayload(current,group,values)
 assert.equal(body[key],values[key]);assert.equal(body.estadoAlergias,current.estadoAlergias)
 if(group!=='cuidados')assert.equal(body.notasMedicas,current.notasMedicas)
 assert.equal(body.veterinarioNombre,undefined)
})
test('Vacío explícito borra solo el texto de la tarjeta',()=>{const body=antecedentPayload(current,'medicos',{});assert.equal(body.enfermedadesRelevantes,null);assert.equal(body.cirugiasPrevias,current.cirugiasPrevias)})
test('Valida estado, coherencia y longitudes',()=>{
 assert.throws(()=>antecedentPayload(current,'alergias',{estadoAlergias:'NO_EVALUADAS',alergiasSustancias:'sustancia'}),/coherente/)
 assert.throws(()=>antecedentPayload(current,'alergias',{estadoAlergias:'ALERGIAS_REGISTRADAS'}),/sustancias/)
 assert.throws(()=>antecedentPayload(current,'cuidados',{notasMedicas:'á'.repeat(4001)}),/4000/)
 assert.equal(antecedentPayload(current,'cuidados',{notasMedicas:'á'.repeat(4000)}).notasMedicas.length,4000)
})
test('Consulta versión fresca y conserva otra tarjeta actualizada antes del PUT',async()=>{
 let sent;const history={idHistoria:10,idMascota:1,antecedentes:current}
 const client={get:async()=>({data:{...history,antecedentes:{...current,cirugiasPrevias:'Cambio externo'}}}),put:async(url,body)=>{sent={url,body};return {data:history}}}
 await saveAntecedentGroup(client,history,'medicos',{enfermedadesRelevantes:'Nueva condición',motivo:'Corrección de prueba'})
 assert.equal(sent.url,'/historias-clinicas/10/antecedentes');assert.equal(sent.body.cirugiasPrevias,'Cambio externo')
})
test('Impide sobrescribir una tarjeta modificada mientras estaba abierta',async()=>{
 const history={idHistoria:10,idMascota:1,antecedentes:current};let writes=0
 await assert.rejects(saveAntecedentGroup({get:async()=>({data:{...history,antecedentes:{...current,notasMedicas:'Cambio'}}}),put:async()=>writes++},history,'cuidados',{notasMedicas:'Mi texto'}),/cambió/)
 assert.equal(writes,0)
})
test('No escribe si el GET devuelve otra mascota',async()=>{let writes=0;await assert.rejects(saveAntecedentGroup({get:async()=>({data:{idHistoria:10,idMascota:2}}),put:async()=>writes++},{idHistoria:10,idMascota:1},'cirugias',{}),/paciente/);assert.equal(writes,0)})

test('Corrección o retirada de contenido requiere motivo, incorporación inicial no',()=>{
 assert.equal(requiresAntecedentReason(current,'cuidados',{notasMedicas:'Nuevo',alertasMedicas:current.alertasMedicas}),true)
 assert.equal(requiresAntecedentReason(current,'medicos',{}),true)
 assert.equal(requiresAntecedentReason({estadoAlergias:'NO_EVALUADAS'},'alergias',{estadoAlergias:'SIN_ALERGIAS_CONOCIDAS'}),false)
})
test('Envía versión fresca, motivo y atención opcional sin suplantar autor',async()=>{
 let sent;const history={idHistoria:10,idMascota:1,antecedentes:current};const client={get:async()=>({data:{...history,antecedentes:{...current,version:3}}}),put:async(url,body)=>{sent=body;return {data:history}}}
 await saveAntecedentGroup(client,history,'medicos',{enfermedadesRelevantes:'Reevaluado',motivo:' Seguimiento clínico '},77)
 assert.equal(sent.version,3);assert.equal(sent.motivo,'Seguimiento clínico');assert.equal(sent.idAtencion,77);assert.equal(sent.idVeterinario,undefined)
})
test('Sin versión o sin motivo no permite escribir',async()=>{
 let writes=0;const history={idHistoria:10,idMascota:1,antecedentes:current};
 await assert.rejects(saveAntecedentGroup({get:async()=>({data:{...history,antecedentes:{...current,version:undefined}}}),put:async()=>writes++},history,'medicos',{enfermedadesRelevantes:'Nuevo',motivo:'Corrección'}),/versiones/)
 await assert.rejects(saveAntecedentGroup({get:async()=>({data:history}),put:async()=>writes++},history,'medicos',{enfermedadesRelevantes:'Nuevo'}),/motivo/);assert.equal(writes,0)
})
test('409 entre lectura fresca y guardado se propaga sin reintento ni pérdida del borrador',async()=>{
 let writes=0;const values={enfermedadesRelevantes:'Borrador íntegro áéíóúñ',motivo:'Corrección'},history={idHistoria:10,idMascota:1,antecedentes:current}
 await assert.rejects(saveAntecedentGroup({get:async()=>({data:history}),put:async()=>{writes++;throw Error('409: expediente actualizado')}},history,'medicos',values),/409/)
 assert.equal(writes,1);assert.equal(values.enfermedadesRelevantes,'Borrador íntegro áéíóúñ')
})

test('Campos vacíos del editor no fabrican contenido y conservan textos no vacíos íntegros',()=>{const body=antecedentPayload({},'cuidados',{notasMedicas:'   ',alertasMedicas:''});assert.equal(body.notasMedicas,null);assert.equal(body.alertasMedicas,null);assert.equal(antecedentPayload({},'medicos',{enfermedadesRelevantes:' áéíóúñ\n '}).enfermedadesRelevantes,' áéíóúñ\n ')})
