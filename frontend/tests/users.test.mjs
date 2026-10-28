import test from 'node:test'
import assert from 'node:assert/strict'
import {filterUsers,pageUsers,userInitials,userError,readUserRoles,userRolesError,userFormErrors,userServerErrors} from '../src/lib/users.js'
const users=Array.from({length:23},(_,i)=>({idUsuario:i+1,nombres:i===0?'Lucía':'Persona',apellidos:'Pérez',correo:`qa${i}@example.invalid`,nroDocumento:String(i).padStart(8,'0'),rol:i<3?'ADMIN':'PROPIETARIO'}))
test('búsqueda y rol combinados respetan documentos y acentos',()=>{assert.equal(filterUsers(users,'lucia','ADMIN').length,1);assert.equal(filterUsers(users,'00000000','ADMIN')[0].nroDocumento,'00000000');assert.equal(filterUsers(users,'lucia','VETERINARIO').length,0)})
test('paginación cliente permite recorrer todos los resultados',()=>{assert.equal(pageUsers(users,1).rows.length,10);assert.equal(pageUsers(users,2).rows.length,10);assert.equal(pageUsers(users,3).rows.length,3);assert.equal(pageUsers(users,99).current,3);assert.equal(pageUsers([],1).start,0);assert.deepEqual([1,2,3].flatMap(p=>pageUsers(users,p).rows),users)})
test('iniciales y errores no exponen mensajes de conexión técnicos',()=>{assert.equal(userInitials(users[0]),'LP');assert.match(userError({response:{status:403}}),/permiso/);assert.match(userError({response:{status:409}}),/relacionados/);assert.match(userError({response:{status:404}}),/disponible/)})

test('catálogo usa IDs del servidor, valida formato y no inventa roles',()=>{
 const roles=[{idRol:81,nombre:'ADMIN'},{idRol:94,nombre:'PROPIETARIO'}]
 assert.deepEqual(readUserRoles(roles),roles)
 for(const data of [null,{},[],[{idRol:1,nombre:'SUPER_ADMIN'}],[{idRol:'1',nombre:'ADMIN'}],[{idRol:1,nombre:'ADMIN'},{idRol:1,nombre:'PROPIETARIO'}],[{idRol:1,nombre:'ADMIN'},{idRol:2,nombre:'ADMIN'}]])assert.throws(()=>readUserRoles(data))
})
test('error de roles diferencia sesión, permiso y backend pendiente de actualizar',()=>{
 assert.match(userRolesError({response:{status:401}}),/sesión/)
 assert.match(userRolesError({response:{status:403}}),/permiso/)
 assert.match(userRolesError({response:{status:400,data:{error:'SQL interno'}}}),/actualizar el servidor/)
 assert.doesNotMatch(userRolesError({response:{status:500,data:{error:'SQL interno'}}}),/SQL/)
})
test('validación de usuarios conserva documentos, contacto y política compartida',()=>{
 assert.deepEqual(userFormErrors({tipoDocumento:'DNI',nroDocumento:'01234567',nroCelular:'999111222',contrasena:'Fuerte!123456'}),{})
 assert.ok(userFormErrors({tipoDocumento:'DNI',nroDocumento:'123',nroCelular:'abc',contrasena:'debil'}).nroDocumento)
 assert.ok(userFormErrors({contrasena:'Admin!12345'}).contrasena)
 assert.match(userFormErrors({contrasena:'Á'.repeat(40)+'a1!'}).contrasena,/más breve/)
 assert.deepEqual(userFormErrors({nroCelular:''}),{})
 assert.doesNotMatch(userFormErrors({contrasena:'corta'}).contrasena,/bytes/)
})
test('errores de duplicidad se muestran junto al campo correspondiente',()=>{
 assert.ok(userServerErrors({response:{data:{error:'El correo ya se encuentra registrado'}}}).correo)
 assert.ok(userServerErrors({response:{data:{error:'El documento ya se encuentra registrado'}}}).nroDocumento)
 assert.deepEqual(userServerErrors({response:{data:{campos:{nombres:'Completa los nombres'}}}}),{nombres:'Completa los nombres'})
})
