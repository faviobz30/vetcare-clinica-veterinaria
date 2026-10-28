// El endpoint existente sustituye el conjunto completo: se conservan los campos ajenos a la tarjeta.
export const antecedentGroups = {
  alergias: { title: 'Editar alergias', keys: ['estadoAlergias', 'alergiasSustancias', 'alergiasReacciones', 'alergiasObservaciones'] },
  medicos: { title: 'Editar antecedentes médicos', keys: ['enfermedadesRelevantes'] },
  cirugias: { title: 'Editar cirugías y procedimientos', keys: ['cirugiasPrevias'] },
  cuidados: { title: 'Editar cuidados y observaciones', keys: ['notasMedicas', 'alertasMedicas'] },
}
export const antecedentLimits = { alergiasSustancias: 2000, alergiasReacciones: 2000, alergiasObservaciones: 2000, enfermedadesRelevantes: 4000, cirugiasPrevias: 4000, notasMedicas: 4000, alertasMedicas: 2000 }
export function antecedentPayload(current, group, values) {
  const definition = antecedentGroups[group]
  if (!definition) throw Error('Sección de antecedentes desconocida.')
  const body = Object.fromEntries(['estadoAlergias', ...Object.keys(antecedentLimits)].map(key => [key, current?.[key] ?? (key === 'estadoAlergias' ? 'NO_EVALUADAS' : null)]))
  for (const key of definition.keys) body[key] = key === 'estadoAlergias' ? values[key] ?? 'NO_EVALUADAS' : (typeof values[key] === 'string' && !values[key].trim() ? null : values[key] ?? null)
  if (!['NO_EVALUADAS', 'SIN_ALERGIAS_CONOCIDAS', 'ALERGIAS_REGISTRADAS'].includes(body.estadoAlergias)) throw Error('Selecciona un estado de evaluación válido.')
  for (const [key, limit] of Object.entries(antecedentLimits)) if (body[key] != null && (typeof body[key] !== 'string' || body[key].length > limit)) throw Error(`El campo supera el máximo de ${limit} caracteres.`)
  const substances = !!body.alergiasSustancias?.trim(), reactions = !!body.alergiasReacciones?.trim()
  if (body.estadoAlergias === 'ALERGIAS_REGISTRADAS' && !substances) throw Error('Indica las sustancias o medicamentos registrados como alergia.')
  if (body.estadoAlergias !== 'ALERGIAS_REGISTRADAS' && (substances || reactions)) throw Error('El estado de evaluación no es coherente con las alergias indicadas. Revisa sustancias y reacciones.')
  return body
}
export function requiresAntecedentReason(current,group,values){
 return antecedentGroups[group].keys.some(key=>{const old=current?.[key],next=values[key]??null;return old!=null&&String(old).trim()&&!(key==='estadoAlergias'&&old==='NO_EVALUADAS')&&old!==next})
}
export async function saveAntecedentGroup(client, history, group, values, idAtencion) {
  const { data: fresh } = await client.get(`/historias-clinicas/${history.idHistoria}`)
  if (String(fresh.idHistoria) !== String(history.idHistoria) || String(fresh.idMascota) !== String(history.idMascota)) throw Error('El expediente recibido no corresponde al paciente seleccionado.')
  // No sobrescribir silenciosamente una tarjeta que cambió mientras su formulario estaba abierto.
  for (const key of antecedentGroups[group].keys) if ((fresh.antecedentes?.[key] ?? null) !== (history.antecedentes?.[key] ?? null)) throw Error('Esta sección cambió desde que abriste el formulario. Conserva tu texto y vuelve a consultar el expediente antes de guardar.')
  if(!Number.isSafeInteger(fresh.antecedentes?.version)||fresh.antecedentes.version<0)throw Error('El servidor no ofrece control de versiones. Actualiza el expediente antes de editar.')
  if(requiresAntecedentReason(fresh.antecedentes,group,values)&&!values.motivo?.trim())throw Error('Indica el motivo al corregir o retirar información existente.')
  if((values.motivo||'').length>500)throw Error('El motivo admite hasta 500 caracteres.')
  return client.put(`/historias-clinicas/${history.idHistoria}/antecedentes`, {...antecedentPayload(fresh.antecedentes, group, values),version:fresh.antecedentes.version,motivo:values.motivo?.trim()||null,...(idAtencion!=null?{idAtencion}:{})})
}

export function consultationAntecedentSections(history){
 const a=history?.antecedentes||{}
 const allergy=a.estadoAlergias==='SIN_ALERGIAS_CONOCIDAS'?'Sin alergias conocidas, según la evaluación registrada.':a.estadoAlergias==='ALERGIAS_REGISTRADAS'?[a.alergiasSustancias,a.alergiasReacciones,a.alergiasObservaciones].filter(Boolean).join('\n'):'La evaluación de alergias está pendiente.'
 return [
  {key:'alergias',title:'Alergias',text:allergy},
  {key:'medicos',title:'Enfermedades previas o crónicas',text:a.enfermedadesRelevantes||'No hay información registrada sobre enfermedades previas o crónicas.'},
  {key:'cirugias',title:'Cirugías y procedimientos',text:a.cirugiasPrevias||'No hay información registrada sobre cirugías o procedimientos.'},
  {key:'cuidados',title:'Cuidados y observaciones importantes',text:[a.notasMedicas,a.alertasMedicas].filter(Boolean).join('\n')||'No hay cuidados especiales u observaciones registrados.'},
 ]
}
