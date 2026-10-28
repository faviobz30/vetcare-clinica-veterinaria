import { useEffect, useState } from 'react'
import { RefreshCcw, AlertCircle } from 'lucide-react'
import { api, errorText } from '../lib/api'

export default function ResourcePage({ title, subtitle, endpoint, columns, actions=[] }) {
  const [items,setItems] = useState([])
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(false)
  const [busy,setBusy] = useState(null)
  async function load() {
    setLoading(true); setError('')
    try { const {data}=await api.get(endpoint); setItems(Array.isArray(data) ? data : data?.content || []) }
    catch(e){ setError(errorText(e)) }
    finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[endpoint])
  async function runAction(action, item) {
    if(!window.confirm(`¿${action.label} la cita ${item.idCita}?`)) return
    setBusy(`${item.idCita}-${action.label}`); setError('')
    try { await api.put(`/citas/${item.idCita}/${action.path}`); await load() }
    catch(e){ setError(errorText(e)) }
    finally {setBusy(null)}
  }
  return <section><div className="flex gap-4 flex-wrap justify-between items-center mb-7"><div><h1 className="text-3xl font-extrabold">{title}</h1><p className="text-vetcare-text-muted mt-2">{subtitle}</p></div><button onClick={load} disabled={loading} className="btn btn-ghost"><RefreshCcw size={18}/>{loading?'Cargando...':'Actualizar'}</button></div>
    {error && <div role="alert" className="p-4 rounded-2xl bg-red-50 text-red-800 mb-5 flex gap-2"><AlertCircle size={19}/>{error}</div>}
    <div className="overflow-x-auto rounded-2xl border border-vetcare-soft bg-white shadow-sm"><table className="w-full text-sm"><thead className="bg-vetcare-soft-2 text-vetcare-text"><tr>{columns.map(c=><th key={c.key} className="text-left px-5 py-4 font-bold">{c.label}</th>)}{actions.length>0&&<th className="text-left px-5 py-4">Acciones</th>}</tr></thead><tbody>{items.map((item,i)=><tr key={item.idCita??item.idMascota??item.idVeterinario??i} className="border-t border-vetcare-soft-2">{columns.map(c=><td key={c.key} className="px-5 py-4 whitespace-nowrap">{c.key==='estado' ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.estado==='ATENDIDA'?'bg-green-100 text-green-800':item.estado==='CANCELADA'?'bg-gray-100 text-gray-600':'bg-vetcare-soft-2 text-vetcare-primary'}`}>{item.estado}</span> : c.render ? c.render(item) : String(item[c.key]??'—')}</td>)}{actions.length>0&&<td className="px-5 py-4 flex gap-2">{actions.filter(a=>!a.states||a.states.includes(item.estado)).map(a=><button key={a.path} disabled={busy!==null} onClick={()=>runAction(a,item)} className="btn btn-ghost text-xs">{a.label}</button>)}</td>}</tr>)}{!items.length&&<tr><td colSpan={columns.length+(actions.length?1:0)} className="text-center p-10 text-vetcare-text-muted">{loading?'Consultando backend...':'No hay registros para mostrar.'}</td></tr>}</tbody></table></div>
  </section>
}
