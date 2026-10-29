import {useEffect,useState} from 'react'
import {userInitials} from '../lib/users'
export default function UserAvatar({user,cache,large=false}){
 const {photos,load,revision}=cache
 const [failed,setFailed]=useState(null),url=photos[user.idUsuario]
 useEffect(()=>{if(user.fotoDisponible)load(user.idUsuario)},[user.idUsuario,user.fotoDisponible,load,revision])
 return <span className={`users-avatar ${large?'users-avatar-large':''}`} aria-hidden="true">{user.fotoDisponible&&url&&url!==failed?<img src={url} alt="" onError={()=>setFailed(url)}/>:userInitials(user)}</span>
}
