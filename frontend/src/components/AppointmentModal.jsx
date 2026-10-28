import { useEffect, useRef } from 'react'
// Contención de teclado para los formularios existentes sin modificar otros módulos.
export default function AppointmentModal({children,onClose,blocked}) {
  const root=useRef(null),close=useRef(onClose),busy=useRef(blocked)
  useEffect(()=>{close.current=onClose;busy.current=blocked},[onClose,blocked])
  useEffect(()=>{
    const previous=document.activeElement,overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    root.current.querySelector('[data-cita-initial-focus],button,input,textarea')?.focus()
    const keyboard=event=>{
      const top=[...document.querySelectorAll('[role=dialog],dialog[open]')].filter(node=>node.getClientRects().length).at(-1)
      if(top!==root.current.querySelector('[role=dialog]'))return
      if(event.key==='Escape'){event.preventDefault();if(!busy.current)close.current()}
      if(event.key==='Tab'){
        const nodes=[...root.current.querySelectorAll('button:not([disabled]),input:not([type=hidden]),textarea,a[href],[tabindex="0"]')].filter(n=>n.getClientRects().length)
        if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1)?.focus()}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0]?.focus()}
      }
    }
    document.addEventListener('keydown',keyboard)
    return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keyboard);if(previous?.isConnected)previous.focus()}
  },[])
  return <div ref={root} className="appointments-modal-scope">{children}</div>
}
