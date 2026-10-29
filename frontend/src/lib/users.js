import {passwordError} from './passwordPolicy.js'
import {adminMatches} from './admin.js'
import {fullName} from './display.js'
export function filterUsers(items,query,role){return items.filter(u=>adminMatches(query,fullName(u),u.correo,u.nroDocumento)&&(!role||u.rol===role))}
export function pageUsers(items,page,size=10){const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(Math.max(1,page),pages);return {pages,current,rows:items.slice((current-1)*size,current*size),start:items.length?(current-1)*size+1:0,end:Math.min(current*size,items.length)}}
export function userInitials(u){return [u?.nombres,u?.apellidos].filter(Boolean).map(v=>v.trim()[0]||'').join('').toUpperCase()||'U'}
export function userError(e){return ({401:'Tu sesión expiró. Vuelve a iniciar sesión.',403:'No tienes permiso para esta operación.',404:'La cuenta ya no está disponible. Actualiza el listado.',409:'No se puede eliminar o guardar la cuenta porque tiene registros relacionados o datos duplicados.'})[e?.response?.status]||e?.response?.data?.error||'No se pudo conectar. Intenta nuevamente.'}

export function readUserRoles(data){
 if(!Array.isArray(data))throw new Error('No se pudo interpretar el catálogo de roles.')
 const allowed=['ADMIN','VETERINARIO','PROPIETARIO'],roles=data.filter(r=>allowed.includes(r?.nombre))
 if(!roles.length)throw new Error('No hay roles disponibles para crear una cuenta. Contacta al administrador del sistema.')
 if(roles.some(r=>!Number.isSafeInteger(r.idRol)||r.idRol<=0)||new Set(roles.map(r=>r.idRol)).size!==roles.length||new Set(roles.map(r=>r.nombre)).size!==roles.length)throw new Error('No se pudo interpretar el catálogo de roles.')
 return roles
}
export function userRolesError(error){
 const status=error?.response?.status
 if(status===401)return 'Tu sesión expiró. Inicia sesión nuevamente para crear cuentas.'
 if(status===403)return 'Tu cuenta no tiene permiso para consultar los roles.'
 if(status===400||status===404)return 'El servicio de roles no está disponible. Es necesario actualizar el servidor.'
 if(!error?.response&&!error?.isAxiosError&&error?.message?.includes('roles'))return error.message
 return 'No se pudieron cargar los roles. Intenta nuevamente.'
}
export function userFormErrors(v){
 const errors={}
 if(v.tipoDocumento==='DNI'&&!/^\d{8}$/.test(v.nroDocumento||''))errors.nroDocumento='El DNI debe tener 8 dígitos.'
 if(['CE','PASAPORTE'].includes(v.tipoDocumento)&&!/^[A-Za-z0-9]{6,20}$/.test(v.nroDocumento||''))errors.nroDocumento='Usa entre 6 y 20 letras o números.'
 if(v.nroCelular&&!/^\+?[0-9][0-9 ()-]{5,19}$/.test(v.nroCelular))errors.nroCelular='Ingresa un celular válido de 6 a 20 caracteres.'
 if('contrasena' in v){const invalid=passwordError(v.contrasena);if(invalid)errors.contrasena=new TextEncoder().encode(v.contrasena||'').length>72?'La contraseña es demasiado larga. Usa una más breve.':invalid.replace(' Máximo 72 bytes.','')}
 return errors
}
export function userServerErrors(error){
 const data=error?.response?.data,errors={}
 for(const [key,message]of Object.entries(data?.campos||{}))errors[key.split('.').at(-1)]=message
 const message=data?.error||''
 if(/correo/i.test(message))errors.correo=message
 else if(/documento/i.test(message))errors.nroDocumento=message
 else if(/contraseña/i.test(message))errors.contrasena=message.replace(/Máximo 72 bytes[.]?/g,'Usa una contraseña más breve si es demasiado larga.')
 return errors
}
