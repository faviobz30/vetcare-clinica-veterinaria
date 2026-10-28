import {Link} from 'react-router-dom'
import {PawPrint,Heart} from 'lucide-react'
import './Auth.css'
export function AuthPaw({className=''}){return <PawPrint className={className} aria-hidden="true" fill="currentColor" strokeWidth={1.1}/>}
export default function AuthLayout({title,description,registration=false,children}){return <main className="auth-page"><section className={`auth-frame${registration?' auth-register':''}`}><div className="auth-curves" aria-hidden="true"/><AuthPaw className="auth-corner-paw"/><Link to="/" className="auth-logo" aria-label="Ir al inicio de VetCare"><AuthPaw/><span>VetCare</span></Link><header className="auth-heading"><h1>{title}</h1><p>{description}</p></header><div className="auth-card">{children}</div><footer className="auth-footer"><div><span/><AuthPaw/><span/></div><p>Cuidamos a quienes más amas <Heart size={17} aria-hidden="true"/></p><Link to="/">Volver al inicio</Link></footer></section></main>}
