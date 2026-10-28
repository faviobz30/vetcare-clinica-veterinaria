import {useRef,useState} from 'react'
import AppointmentAvailabilityPicker from './AppointmentAvailabilityPicker'
import {availableSelection,SLOT_CONFLICT} from '../lib/appointmentAvailability'
import EditorForm from './EditorForm'
import AppointmentModal from './AppointmentModal'
import {api} from '../lib/api'
import {professionalName} from '../lib/clinicalAppointments'
import {appointmentError,validateAppointment,sameAppointmentId} from '../lib/appointments'
export default function AppointmentEditor({item,pets,vets,selected,onClose,onDone}){
  const sending=useRef(false),[busy,setBusy]=useState(false),edit=!!item,[availability,setAvailability]=useState(null),[revision,setRevision]=useState(0)
  const fields=[...(!edit?[{key:'idMascota',label:'Mascota *',options:pets.map(p=>({value:p.idMascota,label:p.nombre}))},{key:'idVeterinario',label:'Veterinario *',options:vets.map(v=>({value:v.idVeterinario,label:[professionalName(v),v.especialidad].filter(Boolean).join(' · ')}))}]:[]),{key:'fechaCita',label:'Fecha y hora (Lima) *',wide:true,render:({values,onChange,busy})=><AppointmentAvailabilityPicker value={values.fechaCita} onChange={onChange} vet={edit?item.idVeterinario:values.idVeterinario} exclude={item?.idCita} revision={revision} busy={busy} onLoaded={setAvailability}/>},{key:'motivoCita',label:'Motivo *',multiline:true,maxLength:250,wide:true}]
  async function save(values){
    if(sending.current)return; sending.current=true;setBusy(true)
    try{
      if(!availableSelection(availability,edit?item.idVeterinario:values.idVeterinario,values.fechaCita))throw Error('Selecciona un horario disponible actualizado.');
      const error=validateAppointment(values);if(error)throw Error(error)
      if(!edit&&(!pets.some(p=>sameAppointmentId(p.idMascota,values.idMascota))||!vets.some(v=>sameAppointmentId(v.idVeterinario,values.idVeterinario))))throw Error('Selecciona una mascota propia y un veterinario disponible en el listado.')
      const body={fechaCita:values.fechaCita,motivoCita:values.motivoCita,...(!edit?{idMascota:Number(values.idMascota),idVeterinario:Number(values.idVeterinario)}:{})}
      return await api({url:edit?`/citas/${item.idCita}`:'/citas',method:edit?'put':'post',data:body})
    }catch(error){const conflict=error?.response?.status===409;if(conflict){setAvailability(null);setRevision(v=>v+1)}const message=conflict?SLOT_CONFLICT:appointmentError(error);throw Object.assign(Error(message),{response:{data:{error:message}}})}finally{sending.current=false;setBusy(false)}
  }
  const close=()=>{if(!sending.current)onClose()}
  return <AppointmentModal onClose={close} blocked={busy}><EditorForm canSubmit={values=>!!values.motivoCita?.trim()&&!!(edit||values.idMascota)&&availableSelection(availability,edit?item.idVeterinario:values.idVeterinario,values.fechaCita)} transformValues={(next,previous)=>next.idVeterinario!==previous.idVeterinario?{...next,fechaCita:''}:next} title={edit?'Reprogramar cita':'Nueva cita'} fields={fields} initial={edit?{...item,fechaCita:item.fechaCita?.slice(0,16)}:{idMascota:selected||'',fechaCita:'',motivoCita:''}} onSave={save} onClose={close} onDone={onDone} submitLabel={edit?'Guardar cambios':'Solicitar cita'}><div className="appointment-booking-help"><strong>{edit?'Reprogramación de cita':'Solicitud de cita'}</strong><p>{edit?'Se conservan la mascota y el veterinario.':'Tu solicitud quedará pendiente de confirmación.'} Selecciona una fecha y un horario disponible para continuar.</p></div></EditorForm></AppointmentModal>
}
