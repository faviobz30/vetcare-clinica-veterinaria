import {useEffect,useRef,useState} from 'react'
import {Mail,LockKeyhole,LogIn} from 'lucide-react'
import {Link,useLocation,useNavigate} from 'react-router-dom'
import {useAuth} from '../contexts/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'
import AuthInput from '../components/auth/AuthInput'
import {authError} from '../lib/passwordPolicy'
export default function Login(){
 const [correo,setCorreo]=useState(''),[contrasena,setContrasena]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const {login}=useAuth(),navigate=useNavigate(),location=useLocation(),sending=useRef(false)
 const [notice,setNotice]=useState(()=>location.state?.notice||'')
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(timer)},[notice])
 async function handleSubmit(e){e.preventDefault();if(sending.current)return;sending.current=true;setError('');setBusy(true);try{await login(correo.trim(),contrasena);navigate('/panel',{replace:true})}catch(err){setError(authError(err))}finally{sending.current=false;setBusy(false)}}
 return <AuthLayout title="Bienvenido a VetCare" description="Ingresa con tus credenciales para acceder a tu espacio"><form className="auth-form" onSubmit={handleSubmit}><fieldset disabled={busy}><AuthInput label="Correo electrónico" icon={Mail} type="email" autoComplete="username" required maxLength={150} placeholder="Tu correo electrónico" value={correo} onChange={e=>setCorreo(e.target.value)}/><AuthInput label="Contraseña" icon={LockKeyhole} type="password" autoComplete="current-password" required placeholder="Tu contraseña" value={contrasena} onChange={e=>setContrasena(e.target.value)}/></fieldset>{error&&<p className="auth-error" role="alert">{error}</p>}{notice&&<p className="auth-message" role="status">{notice}</p>}<button className="auth-submit" disabled={busy}><LogIn size={19}/>{busy?'Validando…':'Iniciar sesión'}</button></form><div className="auth-links"><p><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></p><p>¿Aún no tienes cuenta? <Link to="/registro">Regístrate como propietario</Link></p></div></AuthLayout>
}
