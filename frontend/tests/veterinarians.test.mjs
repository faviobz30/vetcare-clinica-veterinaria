import test from 'node:test'
import assert from 'node:assert/strict'
import {professionalName,vetInitials,eligibleVets,vetError,vetFormErrors,vetPasswordIssues,vetServerErrors} from '../src/lib/veterinarians.js'
test('título profesional explícito y nombre completo uniforme',()=>{const v={nombres:'Sofía',apellidos:'Ramírez'};assert.equal(professionalName(v),'Sofía Ramírez');assert.equal(professionalName({...v,tratamientoProfesional:'Dra.'}),'Dra. Sofía Ramírez');assert.equal(professionalName({...v,tratamientoProfesional:'Doctor'}),'Sofía Ramírez');assert.equal(vetInitials(v),'SR')})
test('elegibilidad requiere rol veterinario sin perfil',()=>{const users=[{idUsuario:1,rol:'VETERINARIO'},{idUsuario:2,rol:'VETERINARIO'},{idUsuario:3,rol:'PROPIETARIO'}];assert.deepEqual(eligibleVets(users,[{idUsuario:1}]),[users[1]])})
test('mensajes distinguen permisos, conflictos y conexión',()=>{assert.match(vetError({response:{status:403}}),/permiso/);assert.match(vetError({response:{status:409}}),/relacionados/);assert.match(vetError(Error('Network Error')),/conectar/);assert.doesNotMatch(vetError(Error('Network Error')),/CORS|Spring/)})

test('formulario veterinario valida DNI y celular peruano sin exigir celular opcional',()=>{
 assert.deepEqual(vetFormErrors({tipoDocumento:'DNI',nroDocumento:'01234567',nroCelular:''}),{})
 assert.deepEqual(vetFormErrors({tipoDocumento:'CE',nroDocumento:'ABC012345',nroCelular:'987654321'}),{})
 for(const nroCelular of ['887654321','98765432','9876543210','+51987654321'])assert.ok(vetFormErrors({nroCelular}).nroCelular)
 assert.ok(vetFormErrors({tipoDocumento:'DNI',nroDocumento:'ABC12345'}).nroDocumento)
 assert.ok(vetFormErrors({tipoDocumento:'PASAPORTE',nroDocumento:'123'}).nroDocumento)
})
test('presentación de contraseña conserva política compartida y enumera solo faltantes',()=>{
 assert.deepEqual(vetPasswordIssues('Fuerte!123456'),[])
 assert.deepEqual(vetPasswordIssues('Árbol!123456'),[])
 assert.deepEqual(vetPasswordIssues('segura!123'),['Incluye una letra mayúscula.'])
 assert.ok(vetPasswordIssues('Admin!12345').some(s=>s.includes('común')))
 assert.ok(vetPasswordIssues('Á'.repeat(40)+'a1!').some(s=>s.includes('larga')))
 assert.ok(vetPasswordIssues('corta').some(s=>s.includes('8 caracteres')))
 assert.ok(vetPasswordIssues('Segura123').some(s=>s.includes('símbolo')))
 assert.ok(vetPasswordIssues('Segura!xyz').some(s=>s.includes('número')))
 assert.doesNotMatch(vetPasswordIssues('corta').join(' '),/bytes/)
})
test('errores de backend se asignan al campo sin confundir conflictos clínicos',()=>{
 assert.deepEqual(vetServerErrors({response:{data:{error:'El correo ya se encuentra registrado'}}}),{correo:'El correo ya se encuentra registrado'})
 assert.ok(vetServerErrors({response:{data:{error:'El documento ya se encuentra registrado'}}}).nroDocumento)
 assert.ok(vetServerErrors({response:{data:{error:'El número de colegiatura ya está registrado'}}}).nroColegiatura)
 assert.deepEqual(vetServerErrors({response:{data:{campos:{'datosUsuario.correo':'Revisa el correo'}}}}),{correo:'Revisa el correo'})
 assert.deepEqual(vetServerErrors({response:{status:409,data:{error:'Existen registros relacionados'}}}),{})
})
