import {adminMatches} from './admin.js'
import {fullName} from './display.js'
export const ownerState=value=>({ACTIVO:'Activo',INACTIVO:'Inactivo'})[value]||'No disponible'
export const ownerPetSpecies=value=>({PERRO:'Perro',CANINA:'Perro',GATO:'Gato',FELINA:'Gato',AVE:'Ave',OTRO:'Otra especie'})[String(value).toUpperCase()]||(value?String(value).charAt(0).toUpperCase()+String(value).slice(1).toLowerCase():'Especie no registrada')
export const ownerCandidates=(users,owners)=>users.filter(u=>u.rol==='PROPIETARIO'&&!owners.some(p=>p.idUsuario===u.idUsuario))
export const filterOwners=(items,query)=>items.filter(p=>adminMatches(query,fullName(p),p.nroDocumento,p.correo,p.nroCelular))
export function ownerContactErrors(values){return values.nroCelular&&!/^9\d{8}$/.test(values.nroCelular)?{nroCelular:'Ingresa 9 dígitos y comienza con 9.'}:{}}
export function ownerError(error){
 if(error?.message==='El servidor necesita actualizarse para mostrar los datos de contacto completos.')return error.message
 return ({401:'Tu sesión expiró. Inicia sesión nuevamente.',403:'No tienes permiso para esta operación.',404:'El registro ya no está disponible. Actualiza la información.',409:'No se puede eliminar este perfil porque tiene mascotas o registros relacionados. La cuenta y la información clínica se conservan.'})[error?.response?.status]||error?.response?.data?.error||'No se pudo cargar la información. Intenta nuevamente.'
}
export function ownerFieldErrors(error){
 const fields=error?.response?.data?.campos||{},message=error?.response?.data?.error||''
 return {...fields,...(/celular/i.test(message)?{nroCelular:message}:{})}
}
