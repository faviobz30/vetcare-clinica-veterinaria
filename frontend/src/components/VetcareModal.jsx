import {useEffect,useId,useRef} from 'react'
import {createPortal} from 'react-dom'
import {X} from 'lucide-react'
import './VetcareModal.css'

export default function VetcareModal({children,busy=false,onClose,label='VetCare',className=''}) {
 const panel=useRef(null),id=useId(),close=useRef(onClose),processing=useRef(busy)
 useEffect(()=>{close.current=onClose;processing.current=busy},[onClose,busy])
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow
  document.body.style.overflow='hidden'
  panel.current?.querySelector('[data-autofocus],button,input')?.focus()
  const focusable=()=>[...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],textarea:not(:disabled),select:not(:disabled)')].filter(n=>n.tabIndex!==-1&&n.offsetParent!==null)
  const keys=event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(!processing.current)close.current();return}
   if(event.key==='Tab'){const nodes=focusable();if(!nodes.length){event.preventDefault();panel.current.focus()}else if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1).focus()}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0].focus()}}
  }
  const trap=event=>{if(panel.current&&!panel.current.contains(event.target))(focusable()[0]||panel.current).focus()}
  document.addEventListener('keydown',keys,true);document.addEventListener('focusin',trap)
  return()=>{document.removeEventListener('keydown',keys,true);document.removeEventListener('focusin',trap);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus()}
 },[])
 return createPortal(<div className="vetcare-modal-backdrop"><section ref={panel} className={`vetcare-modal profile-dialog ${className}`} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} aria-busy={busy}><span id={id} className="sr-only">{label}</span><button type="button" className="profile-dialog-close" aria-label="Cerrar" disabled={busy} onClick={onClose}><X size={20}/></button>{children}</section></div>,document.body)
}
