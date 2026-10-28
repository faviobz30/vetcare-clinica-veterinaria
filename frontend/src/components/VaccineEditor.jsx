import { useEffect, useRef } from 'react'
import EditorForm from './EditorForm'
import { api } from '../lib/api'
import { appointmentDay } from '../lib/vetAgenda'
import { vaccineError, validateVaccineForm } from '../lib/vaccines'
import { vaccineDateLabel } from '../lib/ownerHistory'
export default function VaccineEditor({ mode, item, pet, vet, attentions, scheduled, onClose, onDone }) {
  const sending=useRef(false)
  const titles={schedule:'Programar vacuna',edit:'Editar programación',reschedule:'Reprogramar vacuna',apply:'Registrar aplicación',application:'Registrar aplicación',note:'Editar observaciones'}
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const dialog=document.querySelector('[role="dialog"]'),first=dialog?.querySelector('input:not([type=hidden]),textarea,button')
    first?.focus()
    const handle=event=>{
      if(event.key==='Escape'&&!sending.current){event.preventDefault();onClose()}
      if(event.key==='Tab'&&dialog){const nodes=[...dialog.querySelectorAll('button:not([disabled]),input:not([type=hidden]),textarea,[tabindex="0"]')].filter(n=>!n.getAttribute('aria-hidden'));const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
    }
    document.addEventListener('keydown',handle)
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',handle);if(previous?.isConnected)previous.focus()}
  },[onClose])
  const applying=['apply','application'].includes(mode),planning=['schedule','edit','reschedule'].includes(mode)
  const fields=[
    ...(mode==='application'?[{key:'programacion',label:'Dosis programada o aplicación directa *',options:[{value:'direct',label:'Aplicación directa vinculada a atención'},...scheduled.map(v=>({value:v.idVacuna,label:`${v.nombre} · ${vaccineDateLabel(v.proximaDosis)}`}))]}]:[]),
    ...(planning||mode==='application'?[{key:'nombre',label:mode==='application'?'Nombre (solo aplicación directa)':'Nombre de vacuna *',maxLength:120,wide:true,required:mode!=='application',hidden:mode==='reschedule'}]:[]),
    ...(applying?[{key:'idAtencion',label:'Atención clínica del paciente *',options:attentions.map(a=>({value:a.idAtencion,label:`${vaccineDateLabel(appointmentDay(a.fechaAtencion))} · ${a.diagnostico||'Consulta registrada'}`}))},{key:'fechaAplicacion',label:'Fecha efectiva de aplicación *',type:'date'}]:[]),
    ...(mode!=='note'?[{key:'proximaDosis',label:planning?'Fecha programada *':'Próxima dosis (opcional)',type:'date',required:planning}]:[]),
    {key:'observaciones',label:'Observaciones e indicaciones (opcional)',required:false,multiline:true,wide:true,maxLength:500,hidden:mode==='reschedule'},
  ]
  const initial={...item,...(applying?{proximaDosis:''}:{}),programacion:'direct',fechaAplicacion:item?.fechaAplicacion||(attentions[0]?appointmentDay(attentions[0].fechaAtencion):'')}
  async function save(values){
    sending.current=true
    try{
      let action=mode,selected=item
      if(mode==='application'){selected=scheduled.find(v=>String(v.idVacuna)===String(values.programacion));action=selected?'apply':'direct'}
      const problem=validateVaccineForm(action,values,attentions)
      if(problem)throw Object.assign(new Error(problem),{response:{data:{error:problem}}})
      const body={observaciones:values.observaciones??(mode==='application'&&selected?selected.observaciones:null)}
      let url='/vacunas',method='post'
      if(action==='note'){url=`/vacunas/${item.idVacuna}/observaciones`;method='patch'}
      else if(['edit','reschedule'].includes(action)){url=`/vacunas/${item.idVacuna}/programacion`;method='put';Object.assign(body,{nombre:values.nombre,proximaDosis:values.proximaDosis})}
      else if(action==='apply'){url=`/vacunas/${selected.idVacuna}/aplicar`;method='put';Object.assign(body,{idAtencion:Number(values.idAtencion),fechaAplicacion:values.fechaAplicacion,proximaDosis:values.proximaDosis||null})}
      else Object.assign(body,{idMascota:pet.idMascota,idVeterinario:vet.idVeterinario,nombre:values.nombre,proximaDosis:values.proximaDosis||null,...(action==='direct'?{idAtencion:Number(values.idAtencion),fechaAplicacion:values.fechaAplicacion}:{})})
      return await api({url,method,data:body})
    }catch(error){throw Object.assign(new Error(vaccineError(error)),{response:{data:{error:vaccineError(error)}}})}finally{sending.current=false}
  }
  return <EditorForm title={titles[mode]} fields={fields} initial={initial} onSave={save} onClose={()=>{if(!sending.current)onClose()}} onDone={onDone}>
    <p className="text-sm text-vetcare-text-muted">Paciente: {pet.nombre} · Veterinario responsable: {[vet.nombres,vet.apellidos].filter(Boolean).join(' ')}.</p>
    {planning&&<p className="mt-2 text-xs text-vetcare-text-muted">Los recordatorios existentes se calculan automáticamente a 7 días, 1 día, hoy o al vencer la dosis. Guardar no confirma el envío de correo.</p>}
    {mode==='application'&&<p className="mt-2 text-xs text-vetcare-text-muted">Al elegir una programación existente, dejar vacías las observaciones conserva las que ya estaban registradas.</p>}
    {applying&&!attentions.length&&<p role="alert" className="mt-2 text-sm">No hay atenciones autorizadas disponibles. Registra primero la atención en el módulo clínico existente.</p>}
  </EditorForm>
}
