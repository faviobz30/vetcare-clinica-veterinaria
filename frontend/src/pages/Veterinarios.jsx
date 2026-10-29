import {useProfilePhotoRefresh} from '../lib/profilePhoto'
import PrettySelect from '../components/PrettySelect'
import VeterinarioAvatar from '../components/VeterinarioAvatar'
import ProfilePhotoDialog from '../components/ProfilePhotoDialog'
import {adminMatches} from '../lib/admin'
import {professionalName,eligibleVets,vetError,vetFormErrors,vetServerErrors} from '../lib/veterinarians'
import {useCitaToast} from '../lib/useCitaToast'
import CitaToast from '../components/CitaToast'
import {useCallback,useEffect,useRef,useState} from 'react'
import {Pencil,Plus,RefreshCw,Trash2,Info,AlertCircle,Link2} from 'lucide-react'
import {api} from '../lib/api'
import {useAuth} from '../contexts/AuthContext'
import EditorForm from '../components/EditorForm'
import {fullName} from '../lib/display'
import './UnifiedHeadings.css'
import './Veterinarios.css'

const docs=[{value:'DNI',label:'DNI'},{value:'CE',label:'CE'},{value:'PASAPORTE',label:'Pasaporte'}]
const titles=[{value:'ninguno',label:'Sin título'},{value:'Dr.',label:'Dr.'},{value:'Dra.',label:'Dra.'}]
export default function Veterinarios(){
 const {user}=useAuth(),admin=user?.role==='ADMIN'
 const [query,setQuery]=useState(''),[treatment,setTreatment]=useState(''),[message,setMessage]=useCitaToast()
 const [items,setItems]=useState([]),[users,setUsers]=useState([]),[loading,setLoading]=useState(true),[usersLoading,setUsersLoading]=useState(admin)
 const [error,setError]=useState(''),[usersError,setUsersError]=useState(''),[form,setForm]=useState(null),[revision,setRevision]=useState(0)
 const [deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState('')
 const loadVersion=useRef(0),removeLock=useRef(false)
 const load=useCallback(async()=>{
  const version=++loadVersion.current;setLoading(true);setError('');setUsersError('');setUsersLoading(admin)
  const results=await Promise.allSettled([api.get('/veterinarios'),admin?api.get('/usuarios'):Promise.resolve({data:[]})])
  if(version!==loadVersion.current)return
  const [v,u]=results
  if(v.status==='fulfilled'&&Array.isArray(v.value.data)){setItems(v.value.data);setRevision(n=>n+1)}else setError(vetError(v.reason||Error('Formato inesperado')))
  if(u.status==='fulfilled'&&Array.isArray(u.value.data))setUsers(u.value.data);else{setUsers([]);setUsersError(vetError(u.reason||Error('Formato inesperado')))}
  setLoading(false);setUsersLoading(false)
 },[admin])
 const invalidate=useCallback(()=>{loadVersion.current++},[])
 useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(active)load()});return()=>{active=false;invalidate()}},[load,invalidate])
 useProfilePhotoRefresh(load)
 const candidates=eligibleVets(users,items)
 const titleField={key:'tratamientoProfesional',label:'Título profesional',options:titles,defaultValue:'ninguno'}
 const fields=[
  {key:'nombres',label:'Nombres',maxLength:100},{key:'apellidos',label:'Apellidos',maxLength:100},
  {key:'tipoDocumento',label:'Tipo de documento',options:[...docs,...(form?.item?.tipoDocumento&&!docs.some(d=>d.value===form.item.tipoDocumento)?[{value:form.item.tipoDocumento,label:form.item.tipoDocumento}]:[])]},{key:'nroDocumento',label:'Número de documento',maxLength:20},
  {key:'correo',label:'Correo electrónico',type:'email',maxLength:150},{key:'nroCelular',label:'Celular',required:false,maxLength:20,inputMode:'tel',help:'Celular peruano: 9 dígitos, comienza con 9.'},
  titleField,{key:'especialidad',label:'Especialidad',maxLength:100},{key:'nroColegiatura',label:'Colegiatura',maxLength:30},
  {key:'contrasena',label:'Contraseña',type:'password'},
 ]
 const linkFields=[{key:'idUsuario',label:'Cuenta veterinaria existente',wide:true,options:candidates.map(u=>({value:u.idUsuario,label:`${fullName(u)} · ${u.correo}`}))},titleField,{key:'especialidad',label:'Especialidad',maxLength:100},{key:'nroColegiatura',label:'Colegiatura',maxLength:30}]
 const visible=items.filter(v=>adminMatches(query,professionalName(v),v.especialidad,v.nroColegiatura)&&(!treatment||(v.tratamientoProfesional||'ninguno')===treatment))
 function openEdit(v){const u=users.find(u=>u.idUsuario===v.idUsuario);if(!u){setUsersError('No se encontró la cuenta de este profesional. Actualiza los datos antes de editar.');return}setForm({type:'edit',item:{...u,...v,tratamientoProfesional:v.tratamientoProfesional||'ninguno'}})}
 async function saveVet(value){const p={...value,tratamientoProfesional:value.tratamientoProfesional==='ninguno'?'':value.tratamientoProfesional};if(form.type==='edit'){const {especialidad,nroColegiatura,tratamientoProfesional,...datosUsuario}=p;return api.put(`/veterinarios/${form.item.idVeterinario}`,{especialidad,nroColegiatura,tratamientoProfesional,datosUsuario})}return api.post(form.type==='registro'?'/veterinarios/registro':'/veterinarios',p)}
 async function remove(){if(removeLock.current)return;removeLock.current=true;setDeleting(true);setDeleteError('');try{await api.delete(`/veterinarios/${form.item.idVeterinario}`);setForm(null);setMessage('Perfil veterinario eliminado. La cuenta de usuario se conserva.');await load()}catch(e){setDeleteError(e.response?.status===409?'No se puede eliminar este perfil porque tiene registros relacionados. Se conserva su información.':vetError(e))}finally{removeLock.current=false;setDeleting(false)}}
 const done=()=>{setForm(null);setMessage('Cambios guardados correctamente.');load()}
 return <section className="vets-page">
  <div className="vetcare-section-header"><div><h1>Veterinarios</h1><p>{admin?'Gestiona los perfiles y datos profesionales de tu equipo.':'Conoce a los profesionales para agendar tus citas.'}</p></div><div className="vets-actions"><button className="btn btn-ghost" disabled={loading} onClick={load}><RefreshCw size={17}/>Actualizar</button>{admin&&<><button className="btn btn-ghost vets-link" onClick={()=>setForm({type:'link'})}><Link2 size={16}/>Vincular usuario</button><button className="btn btn-primary" onClick={()=>setForm({type:'registro'})}><Plus size={17}/>Registrar veterinario</button></>}</div></div>
  <CitaToast message={message} onClose={()=>setMessage('')}/>
  <div className="vets-filters"><label><span>Buscar profesional</span><input className="input" aria-label="Buscar veterinarios" placeholder="Nombre, especialidad o colegiatura" value={query} onChange={e=>setQuery(e.target.value)}/></label>{admin&&<label><span>Título profesional</span><PrettySelect keyboardNavigation label="Título profesional" value={treatment} onChange={setTreatment} placeholder="Todos" options={titles}/></label>}</div>
  {error&&<p role="alert" className="vets-notice">{error} Los datos anteriores, si existen, pueden estar desactualizados.</p>}
  {admin&&usersError&&<p role="alert" className="vets-notice">No se pudieron cargar las cuentas para editar o vincular. {usersError}<button className="btn btn-ghost" disabled={loading} onClick={load}>Reintentar</button></p>}
  {loading&&<p role="status">Cargando profesionales…</p>}
  <div className="vets-table"><table aria-label="Veterinarios" aria-busy={loading}><thead><tr>{['Profesional','Especialidad','Colegiatura',admin?'Acciones':null].filter(Boolean).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
   {visible.map(v=><tr key={v.idVeterinario}><td><div className="vets-person"><VeterinarioAvatar key={`${v.idVeterinario}-${revision}`} vet={v} revision={revision}/><strong>{professionalName(v)}</strong></div></td><td>{v.especialidad||'No registrada'}</td><td>{v.nroColegiatura||'No registrada'}</td>{admin&&<td><div className="vets-actions"><button className="btn btn-ghost vets-edit" disabled={loading||usersLoading||!!usersError||!!error} onClick={()=>openEdit(v)}><Pencil size={15}/>Editar</button><button className="btn btn-ghost vets-delete" disabled={loading||!!error} onClick={()=>{setDeleteError('');setForm({type:'delete',item:v})}}><Trash2 size={15}/>Eliminar</button></div></td>}</tr>)}
   {!loading&&!visible.length&&<tr><td colSpan={admin?4:3}>{error?'No se pudo consultar el listado.':items.length?'No hay coincidencias con los filtros.':'No hay veterinarios registrados.'}</td></tr>}
  </tbody></table></div>
  {form?.type==='link'&&(loading||usersLoading||error||usersError||!candidates.length)?<ProfilePhotoDialog className="vets-refined-dialog" label="Vincular usuario existente" busy={loading||usersLoading} onClose={()=>setForm(null)}><div className="vets-modal-heading"><span className="vets-heading-icon"><Link2 size={22}/></span><h2>Vincular usuario existente</h2></div><p>Asocia un perfil profesional a una cuenta veterinaria que ya está registrada en VetCare.</p>{loading||usersLoading?<p role="status">Consultando cuentas…</p>:error||usersError?<p role="alert" className="vets-notice">No se pudieron consultar las cuentas elegibles. Intenta actualizar.</p>:<div className="vets-link-empty"><Info size={19}/><div><strong>Todos los usuarios veterinarios ya tienen un perfil asociado.</strong><p>Para incorporar a un nuevo profesional, utiliza Registrar veterinario.</p></div></div>}<div className="profile-dialog-actions"><button disabled={loading||usersLoading} onClick={()=>setForm(null)}>Cerrar</button>{error||usersError?<button className="profile-primary" disabled={loading} onClick={load}>Reintentar</button>:!loading&&<button className="profile-primary" onClick={()=>setForm({type:'registro'})}>Registrar veterinario</button>}</div></ProfilePhotoDialog>:form?.type==='link'&&<EditorForm compact variant="veterinarians" validateValues={vetFormErrors} fieldErrorsFromResponse={vetServerErrors} title="Vincular usuario existente" fields={linkFields} onSave={saveVet} initial={{tratamientoProfesional:'ninguno'}} onClose={()=>setForm(null)} onDone={done}><p className="vets-form-help">Esta opción se utiliza cuando la cuenta ya existe, pero todavía no tiene un perfil profesional asociado. Se conservan sus datos de acceso.</p></EditorForm>}
  {form?.type==='registro'&&<EditorForm compact variant="veterinarians" validateValues={vetFormErrors} fieldErrorsFromResponse={vetServerErrors} title="Registrar veterinario" submitLabel="Guardar veterinario" fields={fields} initial={{tipoDocumento:'DNI',tratamientoProfesional:'ninguno'}} onSave={saveVet} onClose={()=>setForm(null)} onDone={done}/>}
  {form?.type==='edit'&&<EditorForm compact variant="veterinarians" validateValues={vetFormErrors} fieldErrorsFromResponse={vetServerErrors} title="Actualizar veterinario" fields={fields.filter(f=>f.key!=='contrasena')} initial={form.item} onSave={saveVet} onClose={()=>setForm(null)} onDone={done}><p className="vets-form-help">Se actualizan los datos personales y profesionales. La contraseña y el rol se conservan.</p></EditorForm>}
  {form?.type==='delete'&&<ProfilePhotoDialog className="vets-refined-dialog vets-delete-dialog" label="Confirmar eliminación del perfil" busy={deleting} onClose={()=>setForm(null)}><div className="vets-modal-heading"><span className="vets-heading-icon"><Trash2 size={23}/></span><h2>¿Deseas eliminar este perfil veterinario?</h2></div><p>Estás a punto de eliminar el perfil profesional de <strong>{professionalName(form.item)}</strong>.</p><div className="vets-delete-warning"><AlertCircle size={19}/><p>La cuenta de acceso se conservará. Si el profesional tiene citas, atenciones, vacunas u otros registros relacionados, VetCare impedirá la eliminación para proteger la información clínica.</p></div><p className="vets-form-help">Esta acción no se puede deshacer.</p>{deleteError&&<p role="alert" className="vets-notice">{deleteError}</p>}<div className="profile-dialog-actions"><button disabled={deleting} onClick={()=>setForm(null)}>Cancelar</button><button className="modal-danger" disabled={deleting} onClick={remove}>{deleting?'Comprobando…':'Eliminar perfil'}</button></div></ProfilePhotoDialog>}
 </section>
}
