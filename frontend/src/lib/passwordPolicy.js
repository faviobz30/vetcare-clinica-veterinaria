export const passwordHelp='Usa 8 o más caracteres, con mayúscula, minúscula, número y símbolo. Evita contraseñas comunes. Máximo 72 bytes.'
export function passwordError(value){
 if(typeof value!=='string'||[...value].length<8||new TextEncoder().encode(value).length>72||!/[\p{Lu}]/u.test(value)||!/[\p{Ll}]/u.test(value)||!/[\p{Nd}]/u.test(value)||!(/[^\p{L}\p{N}\s]/u).test(value))return passwordHelp
 const base=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'')
 if(['password','contrasena','qwerty','admin','administrator','letmein','welcome','bienvenido','vetcare','abc'].includes(base))return 'Elige una contraseña menos común. '+passwordHelp
 return ''
}
export function registrationError(v,confirmation){
 if(['nombres','apellidos','nroDocumento','correo'].some(k=>!v[k]?.trim()))return 'Completa los datos obligatorios.'
 if(!['DNI','CE','PASAPORTE'].includes(v.tipoDocumento))return 'Selecciona un tipo de documento válido.'
 if(v.tipoDocumento==='DNI'?!/^\d{8}$/.test(v.nroDocumento.trim()):!/^[A-Za-z0-9]{6,20}$/.test(v.nroDocumento.trim()))return 'Revisa el número de documento: DNI de 8 dígitos o documento de 6 a 20 letras y números.'
 if(v.nroCelular&&!/^\+?[0-9][0-9 ()-]{5,19}$/.test(v.nroCelular))return 'Ingresa un celular válido de 6 a 20 caracteres.'
 return passwordError(v.contrasena)||(v.contrasena!==confirmation?'Las contraseñas no coinciden.':'')
}
export function authError(error){
 const status=error?.response?.status
 if(status===401)return 'Correo o contraseña incorrectos.'
 if(status===503)return 'La recuperación de contraseña aún no está disponible. Contacta a la clínica o intenta más tarde.'
 if(status===429)return 'Espera un minuto antes de solicitar instrucciones nuevamente.'
 if(error?.response?.data?.campos)return Object.values(error.response.data.campos).join(' ')
 if(status===400||status===409)return error.response.data.error||'Revisa los datos del formulario.'
 return 'No se pudo completar la solicitud. Comprueba tu conexión e intenta nuevamente.'
}
