import {passwordError} from './passwordPolicy.js'
export const securityPasswordHelp='Usa al menos 8 caracteres, con mayúscula, minúscula, número y símbolo. Evita contraseñas comunes.'
export function passwordChangeErrors(values){
 const errors={}
 if(!values.contrasenaActual)errors.contrasenaActual='Ingresa tu contraseña actual.'
 if(passwordError(values.nuevaContrasena))errors.nuevaContrasena=securityPasswordHelp+' Si es demasiado larga, elige una más corta.'
 if(!values.confirmarContrasena||values.nuevaContrasena!==values.confirmarContrasena)errors.confirmarContrasena='Las contraseñas no coinciden.'
 if(values.nuevaContrasena&&values.nuevaContrasena===values.contrasenaActual)errors.nuevaContrasena='Elige una contraseña diferente de la actual.'
 return errors
}
