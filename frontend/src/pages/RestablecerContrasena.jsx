import {useEffect,useRef,useState} from 'react'
import {Link,useLocation,useNavigate} from 'react-router-dom'
import {LockKeyhole} from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import {api} from '../lib/api'
import {authError,passwordError,passwordHelp} from '../lib/passwordPolicy'
export default function RestablecerContrasena(){
 const location=useLocation(),navigate=useNavigate(),sending=useRef(false)
 const [token,setToken]=useState(()=>new URLSearchParams(location.hash.slice(1)).get('token')||''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{if(location.hash)navigate(location.pathname,{replace:true})},[location.hash,location.pathname,navigate])
 async function submit(e){e.preventDefault();if(sending.current)return;setError('');const invalid=passwordError(password)||(password!==confirmation?'Las contraseñas no coinciden.':'');if(invalid){setError(invalid);return}sending.current=true;setBusy(true);try{const {data}=await api.post('/auth/restablecer-contrasena',{token,contrasena:password});setMessage(data.mensaje);setToken('');setPassword('');setConfirmation('')}catch(err){setError(authError(err))}finally{sending.current=false;setBusy(false)}}
 return <AuthLayout title="Crear nueva contraseña" description="Ingresa una nueva contraseña para recuperar el acceso a tu cuenta">{message?<p role="status" className="auth-message">{message}</p>:!token?<p role="alert" className="auth-error">El enlace no contiene un token válido. <Link to="/recuperar-contrasena">Solicita uno nuevo</Link>.</p>:<form className="auth-form" onSubmit={submit}><fieldset disabled={busy}><AuthInput label="Nueva contraseña" icon={LockKeyhole} type="password" autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="reset-password-help" value={password} onChange={e=>setPassword(e.target.value)}/><p className="auth-help" id="reset-password-help">{passwordHelp}</p><AuthInput label="Confirmar nueva contraseña" icon={LockKeyhole} type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></fieldset>{error&&<p role="alert" className="auth-error">{error}</p>}<button disabled={busy} className="auth-submit">{busy?'Guardando…':'Guardar nueva contraseña'}</button></form>}<div className="auth-links"><Link to="/login">{message?'Iniciar sesión':'Volver a iniciar sesión'}</Link></div></AuthLayout>
}
