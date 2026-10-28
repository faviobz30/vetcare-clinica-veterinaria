import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {MoreVertical} from 'lucide-react'
export default function CitaActionsMenu({actions,disabled=false,label}){
 const [position,setPosition]=useState(null),trigger=useRef(null),menu=useRef(null)
 useEffect(()=>{
  if(!position)return
  menu.current?.querySelector('button')?.focus()
  const close=()=>setPosition(null)
  const outside=e=>{if(!menu.current?.contains(e.target)&&!trigger.current?.contains(e.target))close()}
  const key=e=>{const nodes=[...menu.current.querySelectorAll('button')],i=nodes.indexOf(document.activeElement)
   if(e.key==='Escape'){e.preventDefault();close();trigger.current?.focus()}
   if(e.key==='Tab')close()
   if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();nodes[e.key==='Home'?0:e.key==='End'?nodes.length-1:(i+(e.key==='ArrowDown'?1:-1)+nodes.length)%nodes.length]?.focus()}
  }
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',close);window.addEventListener('scroll',close,true)
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',close);window.removeEventListener('scroll',close,true)}
 },[position])
 if(!actions.length)return null
 return <><button ref={trigger} type="button" className="btn btn-ghost cita-menu-trigger" aria-label={`Acciones de ${label}`} aria-haspopup="menu" aria-expanded={!!position} disabled={disabled} onClick={()=>{const r=trigger.current.getBoundingClientRect();setPosition(position?null:{left:Math.max(8,Math.min(r.right-220,window.innerWidth-228)),top:Math.max(8,Math.min(r.bottom+6,window.innerHeight-actions.length*44-24))})}}><MoreVertical size={18}/></button>{position&&createPortal(<div ref={menu} className="admin-cita-menu" role="menu" aria-label="Acciones de cita" style={position}>{actions.map(({label,icon:Icon,onClick,tone})=><button type="button" role="menuitem" key={label} className={tone||''} onClick={()=>{setPosition(null);trigger.current?.focus();onClick()}}><Icon size={17}/>{label}</button>)}</div>,document.body)}</>
}
