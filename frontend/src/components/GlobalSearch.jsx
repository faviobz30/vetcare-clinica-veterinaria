import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { fullName, listOf } from '../lib/display'
import { useAuth } from '../contexts/AuthContext'

export default function GlobalSearch(){
 const {user}=useAuth(),navigate=useNavigate()
 const [query,setQuery]=useState(''),[data,setData]=useState([]),[focused,setFocused]=useState(false)
 useEffect(()=>{let active=true;const endpoints=[['Mascota','/mascotas','/panel/mascotas'],['Cita','/citas','/panel/citas'],['Veterinario','/veterinarios','/panel/veterinarios']];if(user?.role==='ADMIN')endpoints.push(['Cliente','/propietarios','/panel/propietarios']);Promise.allSettled(endpoints.map(async ([type,url,to])=>({type,to,items:listOf((await api.get(url)).data)}))).then(results=>{if(active)setData(results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value.items.map(item=>({...r.value,item}))))});return()=>{active=false}},[user?.role])
 const matches=useMemo(()=>{const term=query.trim().toLocaleLowerCase('es');if(term.length<2)return [];return data.filter(({type,item})=>[type,item.nombre,item.nombres,item.apellidos,item.nombrePropietario,item.especie,item.raza,item.especialidad,item.motivoCita,item.estado,fullName(item)].some(v=>String(v||'').toLocaleLowerCase('es').includes(term))).slice(0,8)},[query,data])
 function label(type,item){if(type==='Mascota')return item.nombre||'Mascota';if(type==='Cita')return `Cita ${item.idCita} · ${item.motivoCita||item.estado||''}`;return fullName(item)|| (type==='Veterinario'?`Veterinario ${item.idVeterinario}`:`Cliente ${item.idPropietario}`)}
 return <div className="relative hidden sm:block"><div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#50258f]"/><input aria-label="Buscar en VetCare" value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setFocused(true)} onKeyDown={e=>{if(e.key==='Escape'){setFocused(false);setQuery('')}if(e.key==='Enter'&&matches.length){navigate(matches[0].to);setFocused(false);setQuery('')}}} className="w-[min(36vw,480px)] min-w-[200px] bg-[#fbf9fd] rounded-xl border border-[#e5daf1] py-3 pl-11 pr-9 text-sm" placeholder="Buscar mascotas, citas o veterinarios..."/>{query&&<button aria-label="Limpiar búsqueda" type="button" onClick={()=>setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={16}/></button>}</div>
 {focused&&query.trim().length>=2&&<div className="absolute top-full mt-2 left-0 w-[min(90vw,480px)] bg-white border border-violet-100 shadow-xl rounded-xl z-40 max-h-80 overflow-auto">{matches.length?matches.map(({type,to,item},i)=><button type="button" key={`${type}-${i}`} onClick={()=>{navigate(to);setFocused(false);setQuery('')}} className="w-full text-left px-4 py-3 hover:bg-violet-50 border-b border-violet-50 text-sm"><span className="text-xs text-violet-600 font-bold">{type}</span><span className="block font-medium text-[#36146a]">{label(type,item)}</span></button>):<p className="p-4 text-sm text-gray-500">No hay coincidencias entre tus registros autorizados.</p>}</div>}
 {focused&&query.trim().length>=2&&<button type="button" aria-label="Cerrar resultados" className="fixed inset-0 z-[-1]" onClick={()=>setFocused(false)}/>}
 </div>
}
