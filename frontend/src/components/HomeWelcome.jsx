import pets from '../assets/login-pets.png'
import {vetWelcome} from '../lib/homePresentation'
import './HomeWelcome.css'

// Incorporar las fotografías originales con estos nombres y recompilar; no requiere cambiar código.
const photos=import.meta.glob('../assets/inicio-veterinario-*.png',{eager:true,query:'?url',import:'default'})

export default function HomeWelcome({profile,vet,owner=false,admin=false,error=''}) {
  const welcome=vetWelcome(profile,vet)
  const photo=owner?pets:photos[`../assets/inicio-veterinario-${welcome.variant}.png`]||pets
  const greeting=admin?`¡Hola${profile?.nombres?.trim()?`, ${[profile.nombres,profile.apellidos].filter(Boolean).join(' ').trim()}`:''}!`:owner?`¡Bienvenida${profile?.nombres?.trim()?`, ${profile.nombres.trim()}`:''}!`:welcome.greeting
  return <header className={`vetcare-hero home-welcome ${owner?'home-welcome-owner':'home-welcome-vet'}`}>
    <svg className="vetcare-hero-shapes" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M520 300Q635 142 805 165T1010 0H1200V300Z" fill="#c4a4fa" opacity=".18"/><path d="M660 300Q785 86 940 110T1170 0H1200V300Z" fill="#bd93fb" opacity=".18"/><path d="M880 300Q988 203 1110 245T1200 186V300Z" fill="#a77cf4" opacity=".19"/></svg>
    <div className="home-welcome-copy"><p className="home-welcome-eyebrow">{admin?'VETCARE · ADMINISTRACIÓN':owner?'VETCARE':'VETCARE · ESPACIO VETERINARIO'}</p><h1>{greeting}</h1><p className="home-welcome-description">{admin?'Gestiona y supervisa tu clínica veterinaria desde un solo lugar.':owner?'Gracias por ser parte de su cuidado.':'Gracias por cuidar la salud de sus pacientes.'}</p>{error&&<p className="home-welcome-error" role="alert">{error}</p>}</div>
    <svg className="home-welcome-doodles" viewBox="0 0 350 220" aria-hidden="true"><path d="M45 130 C-3 95 21 65 42 88 C65 63 88 94 45 130Z M244 52 C211 17 244 -3 258 26 C280 3 305 27 244 52Z" fill="none" stroke="#6a29ba" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="M185 11l-7 34 M205 23l7 34 M315 123l27 -12 M310 144l30 3 M313 168l25 17" fill="none" stroke="#6a29ba" strokeWidth="5" strokeLinecap="round"/></svg>
    <img src={photo} alt={owner?'Perrito y gatito de VetCare':photo===pets?'Mascotas en cuidado veterinario':welcome.variant==='dr'?'Veterinario con perrito':welcome.variant==='dra'?'Veterinaria con perrito':'Cuidado veterinario'} className="home-welcome-photo"/>
    {owner&&<div className="vetcare-hero-slogan home-welcome-slogan">Pequeñas<br/>vidas,<br/>grandes<br/>historias</div>}
  </header>
}
