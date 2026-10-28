import test from 'node:test'
import assert from 'node:assert/strict'
import { allergyEvaluation, historyAttentionRow, nextHistoryTab, orderedVisits, ownerClinicalModel, weightEvolution } from '../src/lib/ownerHistory.js'
import { loadClinicalHistory } from '../src/lib/clinicalHistory.js'
const visit = (id, date, peso) => ({ idAtencion: id, fechaAtencion: date, peso, idHistoria: 1 })
const records = [visit(1, '2026-01-01T10:00:00', 10), visit(3, '2026-03-01T10:00:00', 11.2), visit(2, '2026-02-01T10:00:00', 11)]
const section = data => ({ data, error: null })
const record = (visits = records) => ({ history: { idHistoria: 1, antecedentes: null }, pet: { idMascota: 1, fechaNacimiento: '2023-10-25' }, sections: { atenciones: section(visits), vacunas: section([]), citas: section([]), veterinarios: section([]) } })
test('atenciones en orden reciente sin mutar datos', () => { assert.deepEqual(orderedVisits(records).map(v => v.idAtencion), [3,2,1]); assert.equal(records[1].idAtencion, 3) })
test('peso ordenado cronológicamente, última medición y variación reales', () => { const w = weightEvolution(records); assert.deepEqual(w.measurements.map(m => m.id), [1,2,3]); assert.equal(w.latest.weight, 11.2); assert.equal(w.delta, .2) })
test('ignora mediciones vacías, negativas, cero, no finitas o sin fecha válida', () => { const w = weightEvolution([...records, ...[null,'',0,-1,'x',Infinity].map((p,i) => visit(10+i, '2026-05-01T10:00:00',p)), visit(99,'invalida',12)]); assert.equal(w.measurements.length, 3); assert.equal(w.latest.id,3) })
test('un peso no inventa variaciones ni puntos', () => { const w = weightEvolution([records[0]]); assert.equal(w.measurements.length,1); assert.equal(w.delta,null) })
test('sin pesos y error de carga se distinguen', () => { assert.deepEqual(weightEvolution([]).measurements,[]); assert.equal(weightEvolution([]).available,true); assert.equal(weightEvolution(null).available,false) })
test('edad dinámica cambia al cumplir años sin almacenar edad fija', () => { assert.equal(ownerClinicalModel(record(),'2026-10-24').age,'2 años y 11 meses'); assert.equal(ownerClinicalModel(record(),'2026-10-25').age,'3 años') })
test('antecedentes vacíos jamás equivalen a ausencia de alergias', () => { for(const a of [null,{}, {estadoAlergias:'NO_EVALUADAS'}, {estadoAlergias:'SIN_ALERGIAS_CONOCIDAS'}, {estadoAlergias:'ALERGIAS_REGISTRADAS',alergiasSustancias:' '}]) assert.equal(allergyEvaluation(a).status,'unknown') })
test('ausencia confirmada requiere estado explícito y profesional/fecha', () => { assert.equal(allergyEvaluation({estadoAlergias:'SIN_ALERGIAS_CONOCIDAS',actualizadoEn:'2026-10-25T10:00:00',veterinarioNombre:'Profesional'}).status,'none'); assert.equal(allergyEvaluation({estadoAlergias:'ALERGIAS_REGISTRADAS',alergiasSustancias:'Penicilina'}).status,'known') })
test('vacunas solo con fechas registradas y orden explícito', () => { const r=record(); r.sections.vacunas=section([{idVacuna:1,proximaDosis:'2026-10-01',fechaAplicacion:'2025-01-01'}, {idVacuna:2,proximaDosis:'2026-09-01',fechaAplicacion:'2026-01-01'}, {idVacuna:3}]); const m=ownerClinicalModel(r); assert.deepEqual(m.doses.map(v=>v.idVacuna),[2,1]); assert.deepEqual(m.applied.map(v=>v.idVacuna),[2,1]) })
test('las tres pestañas son accesibles por teclado sin cambiar mascota', () => { assert.equal(nextHistoryTab('resumen','ArrowRight'),'vacunas'); assert.equal(nextHistoryTab('vacunas','ArrowRight'),'antecedentes'); assert.equal(nextHistoryTab('antecedentes','ArrowRight'),'resumen'); assert.equal(nextHistoryTab('resumen','ArrowLeft'),'antecedentes'); assert.equal(nextHistoryTab('vacunas','Home'),'resumen'); assert.equal(nextHistoryTab('resumen','End'),'antecedentes'); assert.equal(nextHistoryTab('vacunas','Enter'),'vacunas') })
test('detalle rechaza una atención de otra historia', () => { assert.throws(()=>historyAttentionRow({...records[0], idHistoria:2},record())); assert.equal(historyAttentionRow(records[0],record()).pet.idMascota,1) })
test('cambiar mascota carga exclusivamente sus vacunas y antecedentes aunque API entregue otras atenciones', async () => {
  const client={get: async url=>({data: url.startsWith('/historias-clinicas/mascota/') ? {idHistoria:Number(url.split('/').at(-1))*10,idMascota:Number(url.split('/').at(-1)),antecedentes:{notasMedicas:'Notas '+url.split('/').at(-1)}} : url.startsWith('/mascotas/') ? {idMascota:Number(url.split('/').at(-1))} : url.startsWith('/vacunas/') ? [{idMascota:1,nombre:'Vacuna uno'}, {idMascota:2,nombre:'Vacuna dos'}] : url==='/atenciones' ? [{idAtencion:1,idHistoria:10},{idAtencion:2,idHistoria:20}] : []})}
  const first=await loadClinicalHistory(client,1), second=await loadClinicalHistory(client,2)
  assert.equal(first.sections.vacunas.data[0].nombre,'Vacuna uno'); assert.equal(second.sections.vacunas.data[0].nombre,'Vacuna dos'); assert.equal(second.history.antecedentes.notasMedicas,'Notas 2'); assert.deepEqual(second.sections.atenciones.data.map(v=>v.idAtencion),[2])
})

test('apertura muestra solamente una fecha real, sin identificadores internos', async () => {
  const { openingHistoryLabel } = await import('../src/lib/ownerHistory.js')
  assert.equal(openingHistoryLabel('2026-10-19T09:32:10'), 'Apertura del historial clínico: 19/10/2026')
  assert.equal(openingHistoryLabel('2024-02-29'), 'Apertura del historial clínico: 29/02/2024')
  for (const value of [null, undefined, '', 'no-fecha', '2026-02-30T09:00:00', '2026-13-01T09:00:00', '2026-10-19T99:00:00', '2026-10-19T24:00:00', '2026-10-19texto']) assert.equal(openingHistoryLabel(value), 'Fecha de apertura no disponible')
})
test('tiempo restante usa días de calendario y no inventa fechas ni cambia estados médicos', async () => {
  const { doseCountdown } = await import('../src/lib/ownerHistory.js')
  assert.equal(doseCountdown('2026-10-30','2026-10-26'), 'En 4 días')
  assert.equal(doseCountdown('2026-10-27','2026-10-26'), 'En 1 día')
  assert.equal(doseCountdown('2026-10-26','2026-10-26'), 'Hoy')
  assert.equal(doseCountdown('2026-10-25','2026-10-26'), 'Hace 1 día')
  assert.equal(doseCountdown('2026-10-24','2026-10-26'), 'Hace 2 días')
  assert.equal(doseCountdown('2026-02-30','2026-10-26'), '')
  assert.equal(doseCountdown(null,'2026-10-26'), '')
})
test('registros con nombres QA o PRUEBA no se ocultan ni modifican', () => {
  const r=record([{...records[0],diagnostico:'PRUEBA QA clínica'}]);r.sections.vacunas=section([{idVacuna:90,nombre:'PRUEBA QA vacuna',proximaDosis:'2026-12-01'}]);const before=JSON.stringify(r)
  const m=ownerClinicalModel(r);assert.equal(m.visits[0].diagnostico,'PRUEBA QA clínica');assert.equal(m.doses[0].nombre,'PRUEBA QA vacuna');assert.equal(JSON.stringify(r),before)
})
test('fechas de vacunas LocalDate se presentan sin exigir hora ni desplazarlas de día', async () => {
  const { vaccineDateLabel } = await import('../src/lib/ownerHistory.js')
  assert.match(vaccineDateLabel('2026-11-20'), /20.*nov.*2026/)
  assert.match(vaccineDateLabel('2024-02-29'), /29.*feb.*2024/)
  for(const value of [null,'2026-02-30','inválida']) assert.equal(vaccineDateLabel(value),'Fecha no disponible')
})

test('detalle de próxima dosis solo ofrece observaciones reales sin duplicar su fecha', async () => {
  const { vaccineSupplement } = await import('../src/lib/ownerHistory.js')
  assert.deepEqual(vaccineSupplement({observaciones:'Indicación registrada\nSegunda línea',proximaDosis:'2026-11-20'},true),{observations:'Indicación registrada\nSegunda línea',nextDose:null})
  assert.deepEqual(vaccineSupplement({proximaDosis:'2026-11-20'},true),{observations:null,nextDose:null})
})
test('aplicaciones muestran próxima dosis registrada como complemento aunque no haya observaciones', async () => {
  const { vaccineSupplement } = await import('../src/lib/ownerHistory.js')
  assert.deepEqual(vaccineSupplement({proximaDosis:'2026-11-20'},false),{observations:null,nextDose:'2026-11-20'})
})
test('sin datos complementarios no genera valoración médica ni un detalle vacío', async () => {
  const { vaccineSupplement } = await import('../src/lib/ownerHistory.js')
  for(const vaccine of [null,{}, {observaciones:' \n ',proximaDosis:null}, {proximaDosis:'2026-02-30'}]) assert.deepEqual(vaccineSupplement(vaccine),{observations:null,nextDose:null})
})
test('observaciones extensas conservan acentos y saltos íntegros sin mutar el registro', async () => {
  const { vaccineSupplement } = await import('../src/lib/ownerHistory.js')
  const observations='Observación registrada: áéíóúñ.\n'+'Texto íntegro. '.repeat(32),vaccine={observaciones:observations}
  assert.equal(vaccineSupplement(vaccine).observations,observations);assert.deepEqual(vaccine,{observaciones:observations})
})
