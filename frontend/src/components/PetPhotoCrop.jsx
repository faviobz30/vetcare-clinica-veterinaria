import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cropRectangle, decodePetPhoto, dragCropOffset } from '../lib/petPhoto'

export default function PetPhotoCrop({ file, onCancel, onConfirm }) {
  const [image, setImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canvas = useRef(null), preview = useRef(null), panel = useRef(null), drag = useRef(null)
  useEffect(() => {
    let live = true, bitmap
    decodePetPhoto(file).then(result => { bitmap = result; if (live) setImage(result); else result.close() }).catch(err => { if (live) setError(err.message) })
    return () => { live = false; bitmap?.close() }
  }, [file])
  useEffect(() => {
    const old = document.body.style.overflow, focused = document.activeElement
    document.body.style.overflow = 'hidden'; panel.current.querySelector('button')?.focus()
    const key = event => {
      if (event.key === 'Escape') onCancel()
      if (event.key === 'Tab') {
        const controls = [...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled),canvas[tabindex]')]
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = old; document.removeEventListener('keydown', key); if (focused?.isConnected) focused.focus() }
  }, [onCancel])
  useEffect(() => {
    if (!image) return
    const { sx, sy, side } = cropRectangle(image.width, image.height, zoom, x, y)
    for (const target of [canvas.current, preview.current]) {
      if (!target) continue
      const ctx = target.getContext('2d'); ctx.clearRect(0, 0, target.width, target.height)
      ctx.drawImage(image, sx, sy, side, side, 0, 0, target.width, target.height)
    }
  }, [image, zoom, x, y])
  function move(event) {
    if (!drag.current || !image) return
    const width = event.currentTarget.getBoundingClientRect().width
    const position = dragCropOffset(image.width, image.height, zoom, width,
      drag.current.x, drag.current.y, event.clientX - drag.current.px, event.clientY - drag.current.py)
    setX(position.x); setY(position.y)
  }

  function confirm() {
    if (!image || busy) return
    setBusy(true)
    canvas.current.toBlob(blob => {
      if (blob) onConfirm(new File([blob], 'avatar-mascota.png', { type: 'image/png' }))
      else { setError('No se pudo preparar el recorte.'); setBusy(false) }
    }, 'image/png')
  }
  return createPortal(<div className="fixed inset-0 z-[120] bg-[#211431]/55 flex items-center justify-center p-4"><section ref={panel} role="dialog" aria-modal="true" aria-labelledby="pet-crop-title" className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[94dvh] overflow-auto text-[#3B2382]"><header className="flex items-center justify-between gap-3"><h2 id="pet-crop-title" className="text-xl font-bold">Encuadrar fotografía</h2><button type="button" onClick={onCancel} aria-label="Cancelar recorte" className="p-2"><X size={20}/></button></header><p className="text-sm text-gray-500 mt-2">Arrastra la foto con el mouse o el dedo para centrar el rostro. Ajusta el zoom si necesitas acercarlo. No se guardará hasta confirmar.</p>{error && <p role="alert" className="text-red-700 p-3">{error}</p>}<div className="flex flex-wrap gap-5 justify-center items-center my-5"><canvas ref={canvas} width={512} height={512} aria-label="Encuadre circular de la fotografía" tabIndex={0} title="Arrastra para encuadrar; también puedes usar las flechas del teclado" className="w-56 h-56 rounded-full border-2 border-[#10B981] bg-violet-50 touch-none cursor-grab active:cursor-grabbing" onKeyDown={e=>{if(!image)return;const changes={ArrowLeft:[.05,0],ArrowRight:[-.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]};if(changes[e.key]){e.preventDefault();setX(value=>Math.max(-1,Math.min(1,value+changes[e.key][0])));setY(value=>Math.max(-1,Math.min(1,value+changes[e.key][1])))}}} onPointerDown={e => { if(!image || busy || e.isPrimary===false || e.button!==0)return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { px: e.clientX, py: e.clientY, x, y } }} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}/><div><canvas ref={preview} width={128} height={128} className="w-20 h-20 rounded-full border border-violet-100 bg-violet-50"/><p className="text-xs text-gray-500 mt-2">Vista previa</p></div></div><label className="flex items-center gap-3 text-sm my-3"><span className="w-20">Zoom</span><input type="range" className="flex-1 accent-[#10B981]" min="1" max="3" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><div className="flex justify-end gap-3 mt-5"><button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button><button type="button" className="btn btn-primary" disabled={!image || !!error || busy} onClick={confirm}>Usar este recorte</button></div></section></div>, document.body)
}
