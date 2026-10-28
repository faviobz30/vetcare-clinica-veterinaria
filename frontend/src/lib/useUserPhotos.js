import {useCallback,useEffect,useRef,useState} from 'react'
import {api} from './api'
export default function useUserPhotos(){
 const [photos,setPhotos]=useState({}),[revision,setRevision]=useState(0),records=useRef(new Map()),active=useRef(true)
 const dispose=useCallback(()=>{for(const r of records.current.values()){r.controller.abort();if(r.url)URL.revokeObjectURL(r.url)}records.current.clear()},[])
 useEffect(()=>{active.current=true;return()=>{active.current=false;dispose()}},[dispose])
 const clear=useCallback(()=>{dispose();setPhotos({});setRevision(v=>v+1)},[dispose])
 const load=useCallback(id=>{
  if(records.current.has(id))return
  const r={controller:new AbortController(),url:null};records.current.set(id,r)
  api.get(`/usuarios/${id}/foto`,{responseType:'blob',signal:r.controller.signal}).then(({data})=>{if(active.current&&!r.controller.signal.aborted&&data.type?.startsWith('image/')){r.url=URL.createObjectURL(data);setPhotos(p=>({...p,[id]:r.url}))}}).catch(()=>{})
 },[])
 return {photos,load,clear,revision}
}
