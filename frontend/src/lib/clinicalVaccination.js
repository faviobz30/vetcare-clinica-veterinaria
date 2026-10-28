import {limaToday} from './clinicalHistory.js'

export function vaccinationDateLabel(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date||'')?date.split('-').reverse().join('/'):'Fecha no disponible'
}

// La fecha de la dosis pendiente no es la fecha efectiva ni la del próximo refuerzo.
export function selectScheduledDose(row,id,pending) {
  const dose=id?pending.find(v=>String(v.idVacuna)===String(id)):null
  if(id&&!dose)throw Error('La dosis seleccionada ya no está disponible.')
  return {...row,idVacunaProgramada:id,nombre:dose?.nombre||'',observaciones:dose?.observaciones||'',proximaDosis:''}
}

// El servidor determina mascota, veterinario y atención; nunca se envían desde cada fila.
export function vaccinationPayload(rows, pending, today=limaToday()) {
  const selected=new Set(), names=new Set()
  return rows.map(row=>{
    const applied=row.tipo!=='programada'
    const scheduled=row.idVacunaProgramada?pending.find(v=>String(v.idVacuna)===String(row.idVacunaProgramada)):null
    if(row.idVacunaProgramada&&!scheduled)throw Error('Actualiza las dosis pendientes antes de guardar.')
    const name=(scheduled?.nombre||row.nombre||'').trim()
    if(!name||name.length>120)throw Error('Indica un nombre de vacuna de hasta 120 caracteres.')
    if(selected.has(String(row.idVacunaProgramada))&&scheduled)throw Error('La dosis programada está repetida.')
    if(scheduled)selected.add(String(scheduled.idVacuna))
    const key=name.toLocaleLowerCase('es')
    if(names.has(key))throw Error('La vacuna está repetida en esta atención.')
    names.add(key)
    if(applied&&(!row.fechaAplicacion||row.fechaAplicacion>today))throw Error('Indica una fecha efectiva de aplicación válida (Lima).')
    if(!applied&&!row.proximaDosis)throw Error('Indica la fecha de la vacuna futura.')
    if(row.proximaDosis&&(row.proximaDosis<today||(applied&&row.proximaDosis<=row.fechaAplicacion)))throw Error('La próxima dosis debe ser posterior a la aplicación y no estar vencida.')
    if((row.observaciones||'').length>500)throw Error('Las indicaciones admiten hasta 500 caracteres.')
    return {aplicada:applied,idVacunaProgramada:applied&&scheduled?scheduled.idVacuna:null,nombre:name,fechaAplicacion:applied?row.fechaAplicacion:null,proximaDosis:row.proximaDosis||null,observaciones:row.observaciones?.trim()?row.observaciones:null}
  })
}
