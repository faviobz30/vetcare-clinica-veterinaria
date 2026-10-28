import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookHeart, CalendarDays, Heart, HeartPulse, Menu, PawPrint, ShieldCheck, Stethoscope, Syringe, UserRound, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { appointmentDestination, loadPublications, publicSections } from '../lib/publicLanding'
import veterinaria from '../assets/landing-veterinaria.png'
import gatito from '../assets/landing-gatito.png'
import './Inicio.css'

const services = [
  { icon: Stethoscope, title: 'Consultas veterinarias', description: 'Atención general y seguimiento profesional de la salud de tu mascota.' },
  { icon: Syringe, title: 'Vacunas y recordatorios', description: 'Consulta las vacunas registradas y mantente al tanto de sus próximas dosis.', mint: true },
  { icon: BookHeart, title: 'Historia clínica privada', description: 'Accede al historial de salud de tus mascotas desde un espacio seguro.' },
  { icon: HeartPulse, title: 'Seguimiento y atención', description: 'Consulta diagnósticos, tratamientos y recomendaciones registradas por el veterinario.', mint: true },
]
const steps = [
  { icon: UserRound, title: 'Crea tu cuenta', description: 'Regístrate como propietario y comienza a gestionar el cuidado de tus mascotas.' },
  { icon: PawPrint, title: 'Registra a tu mascota', description: 'Agrega su información y fotografía para identificarla fácilmente.', mint: true },
  { icon: CalendarDays, title: 'Agenda una cita', description: 'Selecciona un veterinario y solicita una fecha disponible.' },
  { icon: BookHeart, title: 'Consulta su seguimiento', description: 'Revisa sus atenciones, vacunas e historial clínico desde tu cuenta.' },
]
function Brand() {
  return <Link to="/" className="public-brand" aria-label="VetCare, página de inicio"><PawPrint size={42}/><span><strong>VetCare</strong><small>Cuidado que los acompaña</small></span></Link>
}
function AppointmentLink({ to, children = 'Solicitar cita', className = '' }) {
  return <Link to={to} className={`public-button primary ${className}`}><CalendarDays size={19}/>{children}<ArrowRight size={18}/></Link>
}
function Story({ story }) {
  const [failed, setFailed] = useState(false)
  return <article className="public-story">
    {story.foto && !failed ? <img loading="lazy" src={`${api.defaults.baseURL}/publicaciones/${encodeURIComponent(story.id)}/foto`} alt={`Fotografía de la publicación de ${story.mascota || 'la comunidad'}`} onError={() => setFailed(true)}/> : <div className="public-story-fallback" aria-label="Publicación sin fotografía disponible"><PawPrint size={40}/></div>}
    <div className="public-story-body"><h3>{story.titulo || 'Historia de la comunidad'}</h3><p className="public-story-excerpt">{story.contenido}</p><div className="public-story-byline"><span className="public-author-icon"><UserRound size={17}/></span><span><strong>{story.autor || 'Autor no indicado'}</strong><small>{story.mascota || 'Mascota no indicada'}</small></span></div>
      <details><summary>Leer historia</summary><p className="public-story-full">{story.contenido}</p>{story.categoria && <small>{story.categoria}</small>}</details>
    </div>
  </article>
}
export default function Inicio() {
  const { user } = useAuth()
  const [menu, setMenu] = useState(false)
  const [active, setActive] = useState('inicio')
  const [stories, setStories] = useState(null)
  const [revision, setRevision] = useState(0)
  const menuButton = useRef(null)
  const destination = appointmentDestination(user)
  useEffect(() => {
    const controller = new AbortController()
    loadPublications(api, controller.signal).then(data => { if (!controller.signal.aborted) setStories({ data, revision }) })
      .catch(() => { if (!controller.signal.aborted) setStories({ error: true, revision }) })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    const observer = new IntersectionObserver(() => {
      const reached = publicSections.filter(([id]) => document.getElementById(id)?.getBoundingClientRect().top <= 150)
      setActive(reached.at(-1)?.[0] || 'inicio')
    }, { rootMargin: '-70px 0px -45% 0px', threshold: [0, .15, .4] })
    publicSections.forEach(([id]) => { const section = document.getElementById(id); if (section) observer.observe(section) })
    return () => observer.disconnect()
  }, [])
  function scrollTo(event, id) {
    const section = document.getElementById(id)
    if (!section) return
    event.preventDefault()
    setMenu(false)
    setActive(id)
    window.history.replaceState(null, '', `#${id}`)
    section.focus({ preventScroll: true })
    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }
  function sectionLinks() {
    return publicSections.map(([id, title]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={event => scrollTo(event, id)}>{title}</a>)
  }
  const current = stories?.revision === revision ? stories : null
  return <div className="public-vetcare">
    <a className="public-skip" href="#contenido-publico">Saltar al contenido</a>
    <header className="public-header" onKeyDown={event => { if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus() } }}>
      <div className="public-header-inner"><Brand/>
        <button ref={menuButton} className="public-menu-toggle" aria-label={menu ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={menu} aria-controls="public-menu" onClick={() => setMenu(value => !value)}>{menu ? <X/> : <Menu/>}</button>
        <nav id="public-menu" className={menu ? 'open' : ''} aria-label="Navegación pública">{sectionLinks()}</nav>
        <div className="public-auth"><Link to="/login" className="public-button outline">Iniciar sesión</Link><Link to="/registro" className="public-button primary">Registrarte</Link></div>
      </div>
    </header>
    <main id="contenido-publico" tabIndex={-1}>
      <section id="inicio" tabIndex={-1} className="public-hero public-wide" aria-labelledby="public-title">
        <div className="public-hero-copy"><p className="public-eyebrow">BIENVENIDO A VETCARE</p><h1 id="public-title">Cuidamos su salud,<br/>acompañamos cada<br/>etapa de su vida</h1><p className="public-intro">Agenda citas, mantén sus vacunas al día, consulta su historial clínico y recibe una atención veterinaria cercana y profesional.</p>
          <div className="public-hero-actions"><AppointmentLink to={destination}/><a href="#servicios" className="public-button outline" onClick={event => scrollTo(event, 'servicios')}>Conocer servicios</a></div>
          <ul className="public-benefits">{[[PawPrint, 'Atención profesional y de confianza'], [Heart, 'Bienestar en cada etapa'], [ShieldCheck, 'Mascotas más sanas y felices']].map(([Icon, label]) => <li key={label}><span><Icon size={22}/></span>{label}</li>)}</ul>
        </div>
        <div className="public-hero-visual"><span className="public-organic one"/><span className="public-organic two"/><img src={veterinaria} alt="Veterinaria con bata y estetoscopio atendiendo a un perro Golden Retriever" fetchPriority="high"/><Heart className="public-hero-heart" size={42} aria-hidden="true"/><span className="public-hero-note" aria-hidden="true">Su salud<br/>también es<br/>una historia<br/>de amor <Heart size={18}/></span><span className="public-sparks" aria-hidden="true">✧</span></div>
      </section>
      <section id="servicios" tabIndex={-1} className="public-section public-container" aria-labelledby="public-services-title"><p className="public-eyebrow">NUESTROS SERVICIOS</p><h2 id="public-services-title">Servicios veterinarios para cada etapa</h2><div className="public-four-grid">{services.map(({ icon: Icon, title, description, mint }) => <article className="public-service" key={title}><span className={`public-icon ${mint ? 'mint' : ''}`}><Icon size={30}/></span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <section className="public-prevention public-container" aria-label="Prevención veterinaria"><img src={gatito} alt="Gatito descansando con sus patas delanteras extendidas" loading="lazy"/><div className="public-prevention-message"><strong>La prevención también<br/>es una forma de cariño</strong><Heart size={29} aria-hidden="true"/></div><p>Las revisiones periódicas ayudan a cuidar su bienestar en cada etapa.</p><AppointmentLink to={destination}>Solicitar cita ahora</AppointmentLink></section>
      <section id="como-funciona" tabIndex={-1} className="public-section public-container" aria-labelledby="public-how-title"><p className="public-eyebrow">PASO A PASO</p><h2 id="public-how-title">Cómo funciona VetCare</h2><div className="public-four-grid">{steps.map(({ icon: Icon, title, description, mint }, i) => <article className="public-step" key={title}><div className="public-step-top"><span className="public-step-number">{i + 1}</span><span className={`public-icon ${mint ? 'mint' : ''}`}><Icon size={28}/></span></div><h3>{title}</h3><p>{description}</p>{i < 3 && <ArrowRight className="public-step-arrow" size={22} aria-hidden="true"/>}</article>)}</div></section>
      <section id="historias" tabIndex={-1} className="public-community public-wide" aria-labelledby="public-stories-title"><div className="public-container"><div className="public-community-heading"><div><p className="public-eyebrow">NUESTRA COMUNIDAD</p><h2 id="public-stories-title">Historias de nuestra comunidad</h2><p>Dueños de mascotas como tú comparten momentos especiales que inspiran.</p></div><a href="#publicaciones" className="public-button outline" onClick={event => scrollTo(event, 'publicaciones')}>Ver historias <ArrowRight size={17}/></a></div>
        <div id="publicaciones" tabIndex={-1} className={`public-stories count-${current?.data?.length || 0}`}>
          {!current ? <p className="public-stories-message" role="status">Cargando historias de la comunidad…</p> : current.error ? <div className="public-stories-message" role="alert"><p>No se pudieron cargar las historias públicas.</p><button className="public-text-button" onClick={() => setRevision(value => value + 1)}>Volver a intentar</button></div> : !current.data.length ? <p className="public-stories-message">Todavía no hay historias públicas. Los próximos momentos compartidos aparecerán aquí.</p> : current.data.map(story => <Story key={story.id} story={story}/>)}
        </div>
      </div></section>
      <section className="public-register public-wide" aria-labelledby="public-register-title"><div><p className="public-eyebrow">ÚNETE A VETCARE</p><h2 id="public-register-title">Crea tu cuenta y cuida de ellos con VetCare</h2><p>Únete a una comunidad que cree en una vida más sana y feliz para todas las mascotas.</p></div><div className="public-register-actions"><Link to="/registro" className="public-button light">Registrarte <ArrowRight size={17}/></Link><Link to="/login" className="public-button ghost">Iniciar sesión</Link></div><Heart className="public-register-heart" size={30} aria-hidden="true"/></section>
    </main>
    <footer className="public-footer public-container"><Brand/><nav aria-label="Navegación del pie de página">{sectionLinks()}</nav><p>Las historias son públicas; los expedientes clínicos son privados.</p></footer>
  </div>
}
