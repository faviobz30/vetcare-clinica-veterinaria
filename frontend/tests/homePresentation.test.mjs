import test from 'node:test'
import assert from 'node:assert/strict'
import {vetWelcome,homeStatTones} from '../src/lib/homePresentation.js'
test('tratamiento vacío o sin tratamiento conserva nombre sin inferencias',()=>{
 for(const nombres of ['Sofía','Andrés','Mateo'])for(const tratamientoProfesional of [null,undefined,'','SIN_TRATAMIENTO','Sin tratamiento','Desconocido']){
  const result=vetWelcome({nombres},{tratamientoProfesional,foto:'foto-mujer.png'})
  assert.equal(result.greeting,`¡Hola, ${nombres}!`);assert.equal(result.variant,'neutro');assert.equal(result.title,'')
 }
})
test('Dr. y Dra. proceden exclusivamente del valor profesional real',()=>{
 assert.deepEqual(vetWelcome({nombres:'Andrés'},{tratamientoProfesional:'Dr.'}),{title:'Dr.',variant:'dr',greeting:'¡Hola, Dr. Andrés!'})
 assert.deepEqual(vetWelcome({nombres:'Sofía'},{tratamientoProfesional:'Dra.'}),{title:'Dra.',variant:'dra',greeting:'¡Hola, Dra. Sofía!'})
 assert.equal(vetWelcome({nombres:'Sofía'},{tratamientoProfesional:'Dr.'}).greeting,'¡Hola, Dr. Sofía!')
})
test('actualización de datos cambia saludo y variante sin estado persistido',()=>{
 const profile={nombres:'Mateo'},vet={tratamientoProfesional:null}
 assert.equal(vetWelcome(profile,vet).variant,'neutro')
 vet.tratamientoProfesional='Dr.';assert.equal(vetWelcome(profile,vet).variant,'dr')
 vet.tratamientoProfesional='Dra.';assert.equal(vetWelcome(profile,vet).variant,'dra')
 vet.tratamientoProfesional=null;assert.equal(vetWelcome(profile,vet).greeting,'¡Hola, Mateo!')
})
test('sin perfil no inventa título ni nombre',()=>assert.equal(vetWelcome(null,null).greeting,'¡Hola!'))
test('indicadores mantienen cuatro tonos en el orden aprobado',()=>assert.deepEqual(homeStatTones,['lavender','cream','blue','mint']))
