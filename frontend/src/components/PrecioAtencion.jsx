import {useRef,useState} from 'react'
import AppointmentModal from './AppointmentModal'
import {api,errorText} from '../lib/api'
export default function PrecioAtencion({item,onClose,onDone}){
 const [price,setPrice]=useState(item.precioAtencion??''),[busy,setBusy]=useState(false),[error,setError]=useState(''),lock=useRef(false)
 async function save(e){e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await api.patch(`/atenciones/${item.idAtencion}/precio`,{precioAtencion:Number(price)});onDone()}catch(e){setError(errorText(e))}finally{lock.current=false;setBusy(false)}}
 return <AppointmentModal onClose={onClose} blocked={busy}><div className="appointments-overlay"><section className="appointments-dialog" role="dialog" aria-modal="true" aria-labelledby="price-title"><header><h2 id="price-title">Asignar precio de atención</h2></header><form onSubmit={save}><label className="cita-operation-field">Precio (S/)<input className="input" required type="number" min="0.01" step="0.01" value={price} disabled={busy} onChange={e=>setPrice(e.target.value)}/></label>{error&&<p className="appointments-error" role="alert">{error}</p>}<footer><button type="button" disabled={busy} onClick={onClose}>Volver</button><button className="appointments-primary" disabled={busy}>{busy?'Guardando…':'Guardar precio'}</button></footer></form></section></div></AppointmentModal>
}
