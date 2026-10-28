import {X} from 'lucide-react'
export default function CitaToast({message,onClose}){return message?<div className="cita-toast" role="status"><span>{message}</span><button type="button" aria-label="Cerrar confirmación" onClick={onClose}><X size={17}/></button></div>:null}
