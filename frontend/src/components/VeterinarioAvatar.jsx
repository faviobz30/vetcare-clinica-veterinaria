import {useEffect,useState} from 'react'
import {api} from '../lib/api'
import {vetInitials} from '../lib/veterinarians'
export default function VeterinarioAvatar({vet,revision}) {
 const [url,setUrl]=useState(null)
 useEffect(()=>{if(!vet.fotoDisponible)return;const controller=new AbortController();let objectUrl
 api.get(`/veterinarios/${vet.idVeterinario}/foto`,{responseType:'blob',signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted&&data.type?.startsWith('image/')){objectUrl=URL.createObjectURL(data);setUrl(objectUrl)}}).catch(()=>{})
 return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[vet.idVeterinario,vet.fotoDisponible,revision])
 return <span className="vets-avatar" aria-hidden="true">{vet.fotoDisponible&&url?<img src={url} alt="" onError={()=>setUrl(null)}/>:vetInitials(vet)}</span>
}
