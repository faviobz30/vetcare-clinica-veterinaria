import test from 'node:test'
import assert from 'node:assert/strict'
import {passwordChangeErrors,securityPasswordHelp} from '../src/lib/changePassword.js'
const valid={contrasenaActual:'Anterior!1234',nuevaContrasena:'Nueva!56789',confirmarContrasena:'Nueva!56789'}
test('contraseña actual, política y confirmación se validan por campo',()=>{assert.deepEqual(passwordChangeErrors(valid),{});assert.ok(passwordChangeErrors({...valid,contrasenaActual:''}).contrasenaActual);assert.ok(passwordChangeErrors({...valid,nuevaContrasena:'debil'}).nuevaContrasena);assert.ok(passwordChangeErrors({...valid,confirmarContrasena:'Otra!56789'}).confirmarContrasena)})
test('rechaza contraseña idéntica y comunes sin mensajes técnicos',()=>{assert.ok(passwordChangeErrors({...valid,nuevaContrasena:valid.contrasenaActual,confirmarContrasena:valid.contrasenaActual}).nuevaContrasena);assert.ok(passwordChangeErrors({...valid,nuevaContrasena:'Password!123'}).nuevaContrasena);assert.doesNotMatch(securityPasswordHelp,/bytes|JWT|api/)})
