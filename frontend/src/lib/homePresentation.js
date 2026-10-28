// Valores reales de V11: no inferir tratamiento a partir de nombres o fotografías.
export function vetWelcome(profile,vet) {
  const title=['Dr.','Dra.'].includes(vet?.tratamientoProfesional?.trim())?vet.tratamientoProfesional.trim():''
  const name=profile?.nombres?.trim()||''
  return {title,variant:title==='Dr.'?'dr':title==='Dra.'?'dra':'neutro',greeting:`¡Hola${name?`, ${title?`${title} `:''}${name}`:''}!`}
}
export const homeStatTones=['lavender','cream','blue','mint']
