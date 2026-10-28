import {useEffect,useRef,useState} from 'react'
import EditorForm from './EditorForm'
import {api} from '../lib/api'
import {prepareProfilePhoto} from '../lib/photo'
import {administrativeError} from '../lib/admin'
export default function AdminPhoto({userId,name,onClose,onDone}){
 const selectedUrl=useRef(null)
 const [file,setFile]=useState(null),[preview,setPreview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{const controller=new AbortController();let url;api.get(`/usuarios/${userId}/foto`,{responseType:'blob',signal:controller.signal}).then(({data})=>{if(!controller.signal.aborted&&!selectedUrl.current){url=URL.createObjectURL(data);setPreview(url)}}).catch(err=>{if(!controller.signal.aborted&&err.response?.status!==404)setError(administrativeError(err))});return()=>{controller.abort();if(url)URL.revokeObjectURL(url)}},[userId])
 useEffect(()=>()=>{if(selectedUrl.current)URL.revokeObjectURL(selectedUrl.current)},[])
 async function choose(e){const selected=e.target.files?.[0];e.target.value='';if(!selected)return;setBusy(true);setError('');try{const prepared=await prepareProfilePhoto(selected);if(selectedUrl.current)URL.revokeObjectURL(selectedUrl.current);selectedUrl.current=URL.createObjectURL(prepared);setFile(prepared);setPreview(selectedUrl.current)}catch(err){setError(err.message)}finally{setBusy(false)}}
 async function remove(){if(!window.confirm('¿Quitar esta fotografía de perfil?'))return;setBusy(true);try{await api.delete(`/usuarios/${userId}/foto`);onDone()}catch(err){setError(administrativeError(err))}finally{setBusy(false)}}
 return <EditorForm title={`Fotografía de ${name}`} fields={[]} onClose={onClose} canSubmit={()=>!!file&&!busy} onDone={onDone} onSave={async()=>{const body=new FormData();body.append('foto',file);return api.post(`/usuarios/${userId}/foto`,body)}}><div className="space-y-4">{preview&&<img src={preview} alt="Vista previa de fotografía" className="w-32 h-32 object-cover rounded-full mx-auto"/>}<label className="block">Seleccionar fotografía<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={choose}/></label>{error&&<p role="alert">{error}</p>}<button type="button" className="btn btn-ghost" disabled={busy||!preview} onClick={remove}>Quitar fotografía</button></div></EditorForm>
}
