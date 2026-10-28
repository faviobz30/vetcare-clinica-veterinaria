import {useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {Mail} from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import {api} from '../lib/api'
import {authError} from '../lib/passwordPolicy'
export default function RecuperarContrasena(){
 const [correo,setCorreo]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),sending=useRef(false)
 async function submit(e){e.preventDefault();if(sending.current)return;sending.current=true;setBusy(true);setError('');setMessage('');try{const {data}=await api.post('/auth/recuperar-contrasena',{correo});setMessage(data.mensaje)}catch(err){setError(authError(err))}finally{sending.current=false;setBusy(false)}}
 return <AuthLayout title="Recuperar contraseña" description="Ingresa tu correo electrónico y te enviaremos las instrucciones para recuperar tu cuenta"><form className="auth-form" onSubmit={submit}><AuthInput label="Correo electrónico" icon={Mail} type="email" autoComplete="email" required maxLength={150} disabled={busy} value={correo} onChange={e=>setCorreo(e.target.value)} placeholder="Tu correo electrónico"/>{error&&<p role="alert" className="auth-error">{error}</p>}{message&&<p role="status" className="auth-message">{message}</p>}<button className="auth-submit" disabled={busy}>{busy?'Procesando…':'Enviar instrucciones'}</button></form><div className="auth-links"><Link to="/login">Volver a iniciar sesión</Link></div></AuthLayout>
}
