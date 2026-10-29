import {useEffect,useRef} from 'react'
const EVENT='vetcare:profile-photo-changed',KEY='vetcare:profile-photo-revision'
// Solo invalidación: no almacena imágenes, nombres, credenciales ni tokens.
export function notifyProfilePhotoChanged(id){
 if(!Number.isSafeInteger(Number(id))||Number(id)<=0)return
 const detail={id:Number(id),revision:Date.now()}
 window.dispatchEvent(new CustomEvent(EVENT,{detail}))
 try{localStorage.setItem(KEY,JSON.stringify(detail))}catch{/* Actualizar y foco siguen disponibles. */}
}
export function useProfilePhotoRefresh(refresh,{initial=false}={}){
 const latest=useRef(refresh)
 useEffect(()=>{latest.current=refresh},[refresh])
 useEffect(()=>{
  let timer
  const update=()=>{clearTimeout(timer);timer=setTimeout(()=>latest.current(),80)}
  const storage=e=>{if(e.key===KEY)update()}
  const visible=()=>{if(document.visibilityState==='visible')update()}
  if(initial)update()
  window.addEventListener(EVENT,update);window.addEventListener('storage',storage);window.addEventListener('focus',update);document.addEventListener('visibilitychange',visible)
  return()=>{clearTimeout(timer);window.removeEventListener(EVENT,update);window.removeEventListener('storage',storage);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',visible)}
 },[initial])
}
