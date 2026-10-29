import {useRef,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {Eye,EyeOff,LockKeyhole} from 'lucide-react'
import VetcareModal from './VetcareModal'
import {useAuth} from '../contexts/AuthContext'
import {api} from '../lib/api'
import {passwordChangeErrors,securityPasswordHelp} from '../lib/changePassword'
import './AccountSecurity.css'
const empty={contrasenaActual:'',nuevaContrasena:'',confirmarContrasena:''}
export default function AccountSecurity(){
 const [open,setOpen]=useState(false)
 return <article className="profile-card account-security"><h2>Seguridad de la cuenta</h2><p>Protege tu cuenta actualizando tu contraseña personal.</p><button type="button" className="profile-edit" onClick={()=>setOpen(true)}><LockKeyhole size={18}/>Cambiar contraseña</button>{open&&<PasswordForm onClose={()=>setOpen(false)}/>}</article>
}
function PasswordForm({onClose}){
 const [values,setValues]=useState(empty),[fields,setFields]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[visible,setVisible]=useState({})
 const sending=useRef(false),{logout}=useAuth(),navigate=useNavigate()
 function close(){if(sending.current)return;setValues(empty);onClose()}
 async function save(event){event.preventDefault();if(sending.current)return;setError('');const invalid=passwordChangeErrors(values);setFields(invalid);if(Object.keys(invalid).length)return;sending.current=true;setBusy(true)
 try{await api.post('/usuarios/me/contrasena',values);setValues(empty);logout();navigate('/login',{replace:true,state:{notice:'Contraseña actualizada. Inicia sesión con tu nueva contraseña.'}})}
 catch(err){if(err.response?.status===401){setValues(empty);logout();navigate('/login',{replace:true,state:{notice:'Tu sesión ya no es válida. Inicia sesión nuevamente.'}});return}if(err.response?.data?.campos)setFields(err.response.data.campos);else setError(err.response?.status===429?'Demasiados intentos. Espera un minuto antes de intentar nuevamente.':'No se pudo cambiar la contraseña. Intenta nuevamente.')}
 finally{sending.current=false;setBusy(false)}
 }
 return <VetcareModal label="Cambiar contraseña" busy={busy} onClose={close}><h2>Cambiar contraseña</h2><form className="change-password-form" onSubmit={save} noValidate><p>{securityPasswordHelp}</p><fieldset disabled={busy}>{[['contrasenaActual','Contraseña actual','current-password'],['nuevaContrasena','Nueva contraseña','new-password'],['confirmarContrasena','Confirmar nueva contraseña','new-password']].map(([key,label,auto])=><div className="security-field" key={key}><label htmlFor={`security-${key}`}>{label}</label><div className="security-input"><input id={`security-${key}`} name={key} type={visible[key]?'text':'password'} autoComplete={auto} required maxLength={200} value={values[key]} aria-invalid={!!fields[key]} aria-describedby={fields[key]?`error-${key}`:undefined} onChange={e=>{setValues(v=>({...v,[key]:e.target.value}));setFields(v=>({...v,[key]:undefined}));setError('')}}/><button type="button" aria-label={`${visible[key]?'Ocultar':'Mostrar'} ${label.toLowerCase()}`} aria-pressed={!!visible[key]} onClick={()=>setVisible(v=>({...v,[key]:!v[key]}))}>{visible[key]?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{fields[key]&&<small role="alert" id={`error-${key}`}>{fields[key]}</small>}</div>)}</fieldset>{error&&<p role="alert" className="profile-error">{error}</p>}<div className="profile-dialog-actions"><button type="button" disabled={busy} onClick={close}>Cancelar</button><button type="submit" className="profile-primary" disabled={busy}>{busy?'Guardando…':'Guardar nueva contraseña'}</button></div></form></VetcareModal>
}
