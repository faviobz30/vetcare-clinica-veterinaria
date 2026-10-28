import {passwordError} from './passwordPolicy.js'
import {fullName} from './display.js'
export function professionalName(v) { return [(['Dr.','Dra.'].includes(v?.tratamientoProfesional)?v.tratamientoProfesional:''),fullName(v)].filter(Boolean).join(' ') || 'Profesional sin nombre' }
export function vetInitials(v) {return [v?.nombres,v?.apellidos].filter(Boolean).map(s=>s.trim().charAt(0)).join('').toUpperCase() || 'V'}
export function eligibleVets(users,items){return users.filter(u=>u.rol==='VETERINARIO'&&!items.some(v=>v.idUsuario===u.idUsuario))}
export function vetError(err){if(!err.response)return err.message==='Formato inesperado'?'No se pudieron interpretar los datos. Intenta actualizar.':'No se pudo conectar. Intenta nuevamente.';return ({401:'Tu sesión expiró. Vuelve a iniciar sesión.',403:'No tienes permiso para esta operación.',409:'No se puede completar la operación: existen registros relacionados o datos duplicados.'})[err.response.status]||err.response.data?.error||'No se pudo completar la operación.'}

// La política compartida decide la validez; aquí solo se presenta lo que falta.
export function vetPasswordIssues(value=''){
 if(!passwordError(value))return []
 const issues=[]
 if([...value].length<8)issues.push('Usa al menos 8 caracteres.')
 if(!/\p{Lu}/u.test(value))issues.push('Incluye una letra mayúscula.')
 if(!/\p{Ll}/u.test(value))issues.push('Incluye una letra minúscula.')
 if(!/\p{Nd}/u.test(value))issues.push('Agrega al menos un número.')
 if(!/[^\p{L}\p{N}\s]/u.test(value))issues.push('Agrega al menos un símbolo.')
 if(new TextEncoder().encode(value).length>72)issues.push('La contraseña es demasiado larga. Usa una más breve.')
 if(passwordError(value).startsWith('Elige'))issues.push('Elige una contraseña menos común.')
 return issues
}
export function vetFormErrors(v){
 const errors={}
 if(v.tipoDocumento==='DNI'&&!/^\d{8}$/.test(v.nroDocumento||''))errors.nroDocumento='El DNI debe tener 8 dígitos.'
 if(['CE','PASAPORTE'].includes(v.tipoDocumento)&&!/^[A-Za-z0-9]{6,20}$/.test(v.nroDocumento||''))errors.nroDocumento='Usa entre 6 y 20 letras o números.'
 if(v.nroCelular&&!/^9\d{8}$/.test(v.nroCelular))errors.nroCelular='Ingresa 9 dígitos y comienza con 9.'
 if('contrasena' in v){const issues=vetPasswordIssues(v.contrasena);if(issues.length)errors.contrasena=issues}
 return errors
}
export function vetServerErrors(err){
 const data=err?.response?.data,errors={}
 for(const [key,message] of Object.entries(data?.campos||{}))errors[key.split('.').at(-1)]=message
 const message=data?.error||''
 if(/correo/i.test(message))errors.correo=message
 else if(/documento/i.test(message))errors.nroDocumento=message
 else if(/colegiatura/i.test(message))errors.nroColegiatura=message
 else if(/contraseña/i.test(message))errors.contrasena=message.replace(/Máximo 72 bytes[.]?/g,'Usa una contraseña más breve si es demasiado larga.')
 return errors
}
