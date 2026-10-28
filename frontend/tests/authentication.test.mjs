import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {passwordError,registrationError,authError} from '../src/lib/passwordPolicy.js'
const base={nombres:'Persona',apellidos:'Sintética',tipoDocumento:'DNI',nroDocumento:'12345678',nroCelular:'999888777',direccion:'Dirección sintética',correo:'test@example.invalid',contrasena:'Consulta@Segura37'}
test('política común acepta ocho caracteres y unicode',()=>{for(const v of ['Aq1!bcde','Áñ2!bcde',base.contrasena])assert.equal(passwordError(v),'')})
test('rechaza claves comunes y requisitos ausentes',()=>{for(const v of ['Corta1!','solo123!','SOLO123!','SinNumero!','SinSimbolo123','Password1!','Contraseña1!','VetCare2026!'])assert.notEqual(passwordError(v),'')})
test('límite BCrypt cuenta bytes sin truncar acentos',()=>{assert.equal(passwordError('Aa1!'+'é'.repeat(34)),'');assert.notEqual(passwordError('Aa1!'+'é'.repeat(35)),'')})
test('registro valida documento, celular, campos vacíos y coincidencia',()=>{assert.equal(registrationError(base,base.contrasena),'');for(const patch of [{nombres:' '},{tipoDocumento:'ADMIN'},{nroDocumento:'123'},{nroCelular:'abc'}])assert.notEqual(registrationError({...base,...patch},base.contrasena),'');assert.match(registrationError(base,'Otra@Segura37'),/no coinciden/)})
test('errores de autenticación no exponen detalles técnicos',()=>{assert.match(authError({response:{status:401}}),/incorrectos/);assert.match(authError({response:{status:503,data:{trace:'secreto'}}}),/no está disponible/);assert.match(authError({response:{status:429}}),/minuto/);assert.ok(!authError({response:{status:500,data:{trace:'secreto'}}}).includes('secreto'))})
test('las cuatro páginas reutilizan logo y layout; logo navega a ruta pública sin tocar tokens',async()=>{
 const root=new URL('../src/',import.meta.url)
 for(const file of ['Login','Registro','RecuperarContrasena','RestablecerContrasena']){const source=await readFile(new URL(`pages/${file}.jsx`,root),'utf8');assert.match(source,/<AuthLayout/)}
 const layout=await readFile(new URL('components/auth/AuthLayout.jsx',root),'utf8');assert.match(layout,/<Link to="\/" className="auth-logo" aria-label="Ir al inicio de VetCare"/);assert.ok(!layout.includes('logout'));assert.ok(!layout.includes('sessionStorage'));assert.ok(!layout.includes('window.location'))
})
test('registro coloca contacto antes del correo y contraseña y omite texto técnico',async()=>{const source=await readFile(new URL('../src/pages/Registro.jsx',import.meta.url),'utf8');const labels=[...source.matchAll(/<AuthInput label="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(labels,['Nombres','Apellidos','Número de documento','Celular','Dirección','Correo electrónico','Contraseña','Confirmar contraseña']);assert.ok(!source.includes('Los datos se envían'));assert.ok(!source.includes('mín. 6'))})
