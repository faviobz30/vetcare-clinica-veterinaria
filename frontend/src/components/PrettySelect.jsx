import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export default function PrettySelect({value, onChange, options=[], placeholder='Seleccionar', required=false, className='', label, keyboardNavigation=false}) {
  const [open,setOpen]=useState(false)
  const root=useRef(null)
  useEffect(()=>{
    const close=(event)=>{if(!root.current?.contains(event.target))setOpen(false)}
    const escape=(event)=>{if(event.key==='Escape')setOpen(false)}
    document.addEventListener('pointerdown',close)
    document.addEventListener('keydown',escape)
    return ()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)}
  },[])
  function keyboard(event) {
    if (!keyboardNavigation) return
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); root.current.querySelector('.vet-select-trigger')?.focus(); return }
    if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return
    event.preventDefault()
    const nodes = [...root.current.querySelectorAll('[role="option"]')]
    if (!open) {
      setOpen(true)
      requestAnimationFrame(() => { const choices=[...root.current.querySelectorAll('[role="option"]')]; (event.key==='End'?choices.at(-1):choices.find(n=>n.getAttribute('aria-selected')==='true')||choices[0])?.focus() })
    } else {
      const current = nodes.indexOf(document.activeElement)
      const index = event.key==='Home'?0:event.key==='End'?nodes.length-1:(current+(event.key==='ArrowDown'?1:-1)+nodes.length)%nodes.length
      nodes[index]?.focus()
    }
  }
  const selected=options.find(o=>String(o.value)===String(value))
  return <div className={`vet-select ${className}`} ref={root} onKeyDown={keyboard}>
    <button type="button" className="vet-select-trigger" aria-label={label||placeholder} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(o=>!o)}>
      <span className={!selected?'vet-select-placeholder':''}>{selected?.label||placeholder}</span><ChevronDown size={18} className={open?'rotate-180':''}/>
    </button>
    {open&&<div className="vet-select-menu" role="listbox" aria-label={label||placeholder}>
      {!required&&<button type="button" role="option" aria-selected={!selected} className="vet-select-option" onClick={()=>{onChange('');setOpen(false)}}>{placeholder}{!selected&&<Check size={17}/>}</button>}
      {options.map(o=><button type="button" role="option" aria-selected={String(o.value)===String(value)} key={o.value} className="vet-select-option" onClick={()=>{onChange(String(o.value));setOpen(false);if(keyboardNavigation)root.current.querySelector('.vet-select-trigger')?.focus()}}><span>{o.label}</span>{String(o.value)===String(value)&&<Check size={17} className="text-emerald-700"/>}</button>)}
      {!options.length&&<p className="vet-select-empty">No hay opciones disponibles</p>}
    </div>}
    {required&&<input type="text" required tabIndex={-1} aria-hidden="true" value={selected?String(selected.value):''} onChange={()=>{}} className="vet-select-validation"/>}
  </div>
}
