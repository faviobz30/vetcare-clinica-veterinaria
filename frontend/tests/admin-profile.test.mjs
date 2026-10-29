import test from 'node:test'
import assert from 'node:assert/strict'
import {adminContactErrors,adminContact} from '../src/lib/adminProfile.js'
import {profileChanges} from '../src/lib/profile.js'
test('ADMIN exige celular peruano, sin cambiar validación compartida',()=>{
 for(const nroCelular of ['', '782912','899111222','99911122','9991112223','+51999111222','999 11122','99911122a']) assert.ok(adminContactErrors({nroCelular}).nroCelular)
 assert.deepEqual(adminContactErrors({nroCelular:' 999111222 ',direccion:'Lima'}),{})
 assert.deepEqual(profileChanges({nroCelular:'782912'},{nroCelular:''}),{nroCelular:'782912'})
})
test('ADMIN conserva dirección opcional y límite existente',()=>{
 assert.deepEqual(adminContactErrors({nroCelular:'999111222',direccion:''}),{})
 assert.ok(adminContactErrors({nroCelular:'999111222',direccion:'x'.repeat(201)}).direccion)
})
test('borrador ADMIN usa contacto real y PATCH omite identidad',()=>{
 const contact=adminContact({nroCelular:'999111222',direccionContacto:'Lima'})
 assert.deepEqual(contact,{nroCelular:'999111222',direccion:'Lima'})
 assert.deepEqual(profileChanges({...contact,nombres:'Otro',rol:'PROPIETARIO'},contact),{})
 assert.deepEqual(profileChanges({...contact,direccion:'Otra'},contact),{direccion:'Otra'})
})
