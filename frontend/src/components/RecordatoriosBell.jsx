import { Bell, Check, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, errorText } from '../lib/api'

export default function RecordatoriosBell() {
  const [avisos,setAvisos] = useState([])
  const [abierto,setAbierto] = useState(false)
  const [cargando,setCargando] = useState(false)
  const [error,setError] = useState('')
  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const {data} = await api.get('/recordatorios/mis')
      setAvisos(Array.isArray(data) ? data : [])
      setError('')
    } catch(err) { setError(errorText(err)) }
    finally { setCargando(false) }
  }, [])
  useEffect(() => {
    cargar()
    const timer = window.setInterval(cargar, 120000)
    return () => window.clearInterval(timer)
  }, [cargar])
  async function leer(id) {
    try {
      await api.patch(`/recordatorios/${id}/leido`)
      setAvisos(actual => actual.map(a => a.idRecordatorio===id?{...a,leido:true}:a))
      setError('')
    } catch(err) { setError(errorText(err)) }
  }
  const pendientes = avisos.filter(a=>!a.leido).length
  return <div className="relative">
    <button type="button" onClick={()=>{setAbierto(v=>!v);if(!abierto)cargar()}} aria-label={`Notificaciones, ${pendientes} sin leer`} aria-expanded={abierto} className="relative border border-[#eee6f5] rounded-xl p-2.5 text-[#5c28a2] hover:bg-violet-50">
      <Bell size={20}/>{pendientes>0&&<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-fuchsia-500 text-white text-[10px] leading-4 text-center">{pendientes>9?'9+':pendientes}</span>}
    </button>
    {abierto&&<div className="absolute right-0 top-12 z-40 w-[min(90vw,380px)] max-h-[70vh] overflow-auto rounded-2xl border border-violet-100 shadow-xl bg-white text-[#35106b] p-3">
      <div className="flex items-center justify-between mb-3"><strong>Mis recordatorios</strong><div className="flex gap-1"><button aria-label="Actualizar avisos" title="Actualizar" onClick={cargar} disabled={cargando} className="p-2 hover:bg-violet-50 rounded-lg"><RefreshCw size={17}/></button><button aria-label="Cerrar avisos" onClick={()=>setAbierto(false)} className="p-2 hover:bg-violet-50 rounded-lg"><X size={17}/></button></div></div>
      {error&&<p role="alert" className="text-sm text-red-700 mb-2">{error}</p>}
      {!avisos.length&&!error&&<p className="text-sm text-[#79619d] p-3">No tienes recordatorios por ahora.</p>}
      <ul className="space-y-2">{avisos.map(a=><li key={a.idRecordatorio} className={`rounded-xl p-3 border ${a.leido?'bg-white border-violet-100':'bg-[#f7edff] border-purple-200'}`}>
        <p className="font-semibold text-sm">{a.nombreMascota} · {a.nombreVacuna}</p>
        <p className="text-xs text-[#725b90] mt-1">{a.mensaje} · {a.fechaDosis}</p>
        {!a.leido&&<button onClick={()=>leer(a.idRecordatorio)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#6927a9] hover:underline"><Check size={14}/> Marcar como leído</button>}
      </li>)}</ul>
    </div>}
  </div>
}
