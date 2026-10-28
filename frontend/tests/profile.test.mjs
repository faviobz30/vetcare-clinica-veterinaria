import test from 'node:test'
import assert from 'node:assert/strict'
import { profileChanges, profileDisplayName, profileDraft } from '../src/lib/profile.js'
const base={nombres:'Lucía',apellidos:'Pérez',nroCelular:'999888777',direccion:'Av. Perú'}
test('propietario genera solamente campos editables y omite identidad',()=>{assert.deepEqual(profileChanges({...base,nombres:' Ana ',idUsuario:2,correo:'x',rol:'ADMIN'},base,'PROPIETARIO'),{})})
test('sin cambios no genera una escritura',()=>assert.deepEqual(profileChanges({...base},base,'PROPIETARIO'),{}))
test('dirección puede borrarse sin borrar datos personales',()=>assert.deepEqual(profileChanges({...base,direccion:''},base,'PROPIETARIO'),{direccion:''}))
test('rechaza contacto inválido y omite identidad protegida',()=>{for(const patch of [{nroCelular:'abc'},{direccion:'a'.repeat(201)}]) assert.throws(()=>profileChanges({...base,...patch},base,'PROPIETARIO'))})
test('no agrega tratamiento a propietarios',()=>assert.equal(profileDisplayName(base,{tratamientoProfesional:'Dra.'},'PROPIETARIO'),'Lucía Pérez'))
test('veterinario usa solo tratamiento explícito válido',()=>{assert.equal(profileDisplayName(base,{tratamientoProfesional:'Dra.'},'VETERINARIO'),'Dra. Lucía Pérez');assert.equal(profileDisplayName(base,{},'VETERINARIO'),'Lucía Pérez');assert.equal(profileDisplayName(base,{tratamientoProfesional:'Doctor'},'VETERINARIO'),'Lucía Pérez')})
test('Mi perfil no envía ni permite cambiar tratamiento profesional',()=>{const b={...base,tratamientoProfesional:'Dra.'};for(const tratamientoProfesional of ['', 'Doctor','Dr.'])assert.deepEqual(profileChanges({...b,tratamientoProfesional},b,'VETERINARIO'),{})})
test('formulario reutiliza usuario como fuente y dirección del propietario',()=>assert.deepEqual(profileDraft(base,{direccion:'Dirección real'},'PROPIETARIO'),{nroCelular:base.nroCelular,direccion:'Dirección real'}))
