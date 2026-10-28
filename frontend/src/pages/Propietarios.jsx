import {Link} from 'react-router-dom'
import {useCallback,useEffect,useRef,useState} from 'react'
import {AlertCircle,Eye,Pencil,Plus,RefreshCw,Search,Trash2,Info} from 'lucide-react'
import {api} from '../lib/api'
import {fullName,dateDisplay} from '../lib/display'
import {filterOwners,ownerCandidates,ownerContactErrors,ownerError,ownerFieldErrors,ownerState,ownerPetSpecies} from '../lib/owners'
import {useProfilePhotoRefresh} from '../lib/profilePhoto'
import useUserPhotos from '../lib/useUserPhotos'
import {useCitaToast} from '../lib/useCitaToast'
import CitaToast from '../components/CitaToast'
import VetcareModal from '../components/VetcareModal'
import UserAvatar from '../components/UserAvatar'
import PetAvatar from '../components/PetAvatar'
import EditorForm from '../components/EditorForm'
import './UnifiedHeadings.css'
import './Veterinarios.css'
import './Usuarios.css'
import './Propietarios.css'

export default function Propietarios(){
 const [items,setItems]=useState([]),[users,setUsers]=useState([]),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[usersLoading,setUsersLoading]=useState(true),[error,setError]=useState(''),[usersError,setUsersError]=useState('')
 const [form,setForm]=useState(null),[pending,setPending]=useState(false),[modalError,setModalError]=useState(''),[message,setMessage]=useCitaToast(),cache=useUserPhotos()
 const alive=useRef(true),listRequest=useRef(null),usersRequest=useRef(null),openVersion=useRef(0),deleteLock=useRef(false),clearPhotos=cache.clear
 const loadOwners=useCallback(()=>{
  if(listRequest.current)return listRequest.current
  setLoading(true);setError('')
  const task=api.get('/propietarios').then(({data})=>{if(!Array.isArray(data))throw Error('Formato inesperado');if(data.some(p=>typeof p.correo!=='string'))throw Error('El servidor necesita actualizarse para mostrar los datos de contacto completos.');if(!alive.current)return;setItems(data);clearPhotos();setForm(current=>current?.type==='view'&&!current.loading?{...current,item:data.find(p=>p.idPropietario===current.item.idPropietario)||current.item}:current)}).catch(e=>{if(alive.current)setError(ownerError(e))}).finally(()=>{listRequest.current=null;if(alive.current)setLoading(false)})
  listRequest.current=task;return task
 },[clearPhotos])
 const loadUsers=useCallback(()=>{
  if(usersRequest.current)return usersRequest.current
  setUsersLoading(true);setUsersError('')
  const task=api.get('/usuarios').then(({data})=>{if(!Array.isArray(data))throw Error('Formato inesperado');if(alive.current)setUsers(data)}).catch(()=>{if(alive.current){setUsers([]);setUsersError('No se pudieron consultar las cuentas disponibles para crear un perfil.')}}).finally(()=>{usersRequest.current=null;if(alive.current)setUsersLoading(false)})
  usersRequest.current=task;return task
 },[])
 const load=useCallback(()=>Promise.all([loadOwners(),loadUsers()]),[loadOwners,loadUsers])
 const invalidate=useCallback(()=>{alive.current=false;openVersion.current++},[])
 useEffect(()=>{alive.current=true;let active=true;Promise.resolve().then(()=>{if(active)load()});return()=>{active=false;invalidate()}},[load,invalidate])
 useProfilePhotoRefresh(loadOwners)
 function close(){if(pending||deleteLock.current)return;openVersion.current++;setForm(null);setModalError('')}
 async function open(type,item){const version=++openVersion.current;setModalError('');setForm({type,item,loading:true});try{
  const [owner,pets]=await Promise.allSettled([api.get(`/propietarios/${item.idPropietario}`),type==='view'?api.get('/mascotas'):Promise.resolve({data:[]})]);if(version!==openVersion.current||!alive.current)return
  if(owner.status==='rejected')throw owner.reason
  if(owner.value.data?.idPropietario!==item.idPropietario||typeof owner.value.data?.correo!=='string')throw Error('El servidor necesita actualizarse para mostrar los datos de contacto completos.')
  setForm({type,item:owner.value.data,loading:false,pets:pets.status==='fulfilled'&&Array.isArray(pets.value.data)?pets.value.data.filter(p=>p.idPropietario===item.idPropietario):[],petsError:pets.status==='rejected'||!Array.isArray(pets.value?.data)?'No se pudieron consultar las mascotas. Intenta nuevamente.':''})
 }catch(e){if(version===openVersion.current&&alive.current){setModalError(ownerError(e));setForm({type,item,failed:true})}}}
 async function remove(){if(deleteLock.current)return;deleteLock.current=true;setPending(true);setModalError('');try{await api.delete(`/propietarios/${form.item.idPropietario}`);setForm(null);setMessage('Perfil eliminado. La cuenta de acceso se conserva.');await load()}catch(e){setModalError(ownerError(e))}finally{deleteLock.current=false;setPending(false)}}
 async function save(values){if(form.type==='create')return api.post('/propietarios',{idUsuario:Number(values.idUsuario),direccion:values.direccion??''});const payload={idUsuario:form.item.idUsuario,nroCelular:values.nroCelular??'',direccion:values.direccion??''};const result=await api.put(`/propietarios/${form.item.idPropietario}`,payload);if(result.data?.nroCelular!==payload.nroCelular||result.data?.direccion!==payload.direccion)throw Error('No se pudo confirmar el contacto completo. Actualiza el servidor antes de continuar.');return result}
 async function done(){setForm(null);setMessage('Datos guardados correctamente.');await load()}
 const candidates=ownerCandidates(users,items),visible=filterOwners(items,query)
 const contact=[{key:'nroCelular',label:'Celular',required:false,maxLength:20,inputMode:'tel',help:'Opcional: 9 dígitos, comienza con 9.'},{key:'direccion',label:'Dirección',required:false,maxLength:200}]
 const create=[{key:'idUsuario',label:'Cuenta del propietario',wide:true,options:candidates.map(u=>({value:u.idUsuario,label:`${fullName(u)} · ${u.correo}`}))},contact[1]]
 return <section className="owners-page">
  <div className="vetcare-section-header"><div><h1>Propietarios</h1><p>Gestiona los datos de contacto y consulta sus mascotas.</p></div><div className="owners-actions"><button className="owners-button" disabled={loading} onClick={load}><RefreshCw size={16}/>{loading?'Actualizando…':'Actualizar'}</button><button className="owners-button owners-primary" disabled={loading||usersLoading} onClick={()=>{setModalError('');setForm({type:'create'})}}><Plus size={17}/>Nuevo propietario</button></div></div>
  <CitaToast message={message} onClose={()=>setMessage('')}/>
  <label className="owners-search"><Search size={18}/><input aria-label="Buscar propietarios" placeholder="Buscar por nombre, documento, correo o celular" value={query} onChange={e=>setQuery(e.target.value)}/></label>
  {error&&<div role="alert" className="owners-notice"><p>{error}</p><button className="owners-button" onClick={loadOwners} disabled={loading}>Reintentar</button></div>}
  {usersError&&<div role="alert" className="owners-notice"><p>{usersError}</p><button className="owners-button" onClick={loadUsers} disabled={usersLoading}>Reintentar cuentas</button></div>}
  {loading&&<p role="status" className="owners-help">Consultando propietarios…</p>}
  <div className="owners-table"><table aria-label="Propietarios" aria-busy={loading}><thead><tr>{['Propietario','Celular','Dirección','Estado','Registro','Acciones'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>
   {visible.map(p=><tr key={p.idPropietario}><td><div className="owners-identity"><UserAvatar user={p} cache={cache}/><div><strong>{fullName(p)}</strong><span>{p.correo||'Correo no registrado'}</span></div></div></td><td>{p.nroCelular||'No registrado'}</td><td><span className="owners-address" title={p.direccion||''}>{p.direccion||'No registrada'}</span></td><td><span className={`owners-state ${p.estadoCliente==='ACTIVO'?'owners-state-active':''}`}>{ownerState(p.estadoCliente)}</span></td><td>{p.fechaRegistroClinica?dateDisplay(p.fechaRegistroClinica):'No registrada'}</td><td><div className="owners-actions"><button className="owners-button" onClick={()=>open('view',p)}><Eye size={15}/>Ver</button><button className="owners-button owners-edit" onClick={()=>open('edit',p)}><Pencil size={15}/>Editar</button><button className="owners-button owners-delete" onClick={()=>{setModalError('');setForm({type:'delete',item:p})}}><Trash2 size={15}/>Eliminar</button></div></td></tr>)}
   {!loading&&!visible.length&&<tr><td colSpan={6}>{error?'No se pudo consultar el listado.':items.length?'No se encontraron coincidencias.':'No existen propietarios registrados.'}</td></tr>}
  </tbody></table></div>
  {form&&(form.loading||form.failed)&&<VetcareModal className="owners-modal" label="Consultar propietario" onClose={close}><h2>Consultar propietario</h2>{form.loading?<p role="status">Cargando información…</p>:<><p role="alert" className="owners-notice">{modalError}</p><div className="profile-dialog-actions"><button onClick={close}>Cerrar</button><button className="owners-button owners-primary" onClick={()=>open(form.type,form.item)}>Reintentar</button></div></>}</VetcareModal>}
  {form?.type==='view'&&!form.loading&&!form.failed&&<VetcareModal className="owners-modal owners-detail" label="Detalle del propietario" onClose={close}>
   <div className="owners-detail-header"><UserAvatar user={form.item} cache={cache} large/><div><h2>{fullName(form.item)}</h2><p>Propietario de VetCare</p></div></div>
   <section className="owners-detail-section"><h3>Información personal</h3><dl>{[['Tipo de documento',form.item.tipoDocumento],['Número de documento',form.item.nroDocumento],['Correo electrónico',form.item.correo],['Celular',form.item.nroCelular],['Dirección',form.item.direccion],['Estado',ownerState(form.item.estadoCliente)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'No registrado'}</dd></div>)}</dl></section>
   <section className="owners-pets"><h3>Mascotas</h3>{form.petsError?<p role="alert" className="owners-notice">{form.petsError}<button className="owners-button" onClick={()=>open('view',form.item)}>Reintentar</button></p>:form.pets.length?form.pets.map(p=><article key={p.idMascota}><PetAvatar pet={p} size={42}/><div><strong>{p.nombre}</strong><p><span>{ownerPetSpecies(p.especie)}</span>{p.raza&&<span>{p.raza}</span>}</p></div><Link className="owners-button" to={`/panel/historias?paciente=${encodeURIComponent(p.idMascota)}&consultar=1`}>Ver historial clínico</Link></article>):<p>Este propietario todavía no tiene mascotas registradas.</p>}</section>
   <div className="profile-dialog-actions"><button onClick={close}>Cerrar</button><button className="owners-button owners-edit" onClick={()=>open('edit',form.item)}><Pencil size={15}/>Editar contacto</button></div>
  </VetcareModal>}
  {form?.type==='edit'&&!form.loading&&!form.failed&&<EditorForm key={form.item.idPropietario} compact variant="owners" title="Editar datos de contacto" description={fullName(form.item)} fields={contact} initial={form.item} validateValues={ownerContactErrors} fieldErrorsFromResponse={ownerFieldErrors} onSave={save} onDone={done} onClose={close}/>}
  {form?.type==='create'&&(usersError||!candidates.length)?<VetcareModal className="owners-modal" label="Nuevo propietario" onClose={close}><h2>Nuevo propietario</h2><div className="owners-notice"><Info size={18}/><p>{usersError||'No hay cuentas de propietario pendientes de vincular.'}</p></div><p>Esta opción crea el perfil de una cuenta ya registrada. Puedes crear la cuenta desde Usuarios y volver para asociarla.</p><div className="profile-dialog-actions"><button onClick={close}>Cerrar</button>{usersError?<button className="owners-button" onClick={loadUsers}>Reintentar cuentas</button>:<Link className="owners-button owners-primary" to="/panel/usuarios">Ir a Usuarios</Link>}</div></VetcareModal>:form?.type==='create'&&<EditorForm compact variant="owners" title="Nuevo propietario" fields={create} onSave={save} onDone={done} onClose={close}><p className="owners-help">Selecciona una cuenta de propietario sin perfil asociado. Su identidad y datos de acceso se conservan.</p></EditorForm>}
  {form?.type==='delete'&&<VetcareModal className="owners-modal owners-delete-dialog" label="Confirmar eliminación de propietario" busy={pending} onClose={close}><h2>¿Deseas eliminar este propietario?</h2><p>Estás a punto de eliminar el perfil de <strong>{fullName(form.item)}</strong>.</p><div className="owners-delete-warning"><AlertCircle size={19}/><p>La cuenta de acceso se conserva. Si tiene mascotas o registros relacionados, VetCare bloqueará la eliminación para proteger su información clínica.</p></div>{modalError&&<p role="alert" className="owners-notice">{modalError}</p>}<div className="profile-dialog-actions"><button disabled={pending} onClick={close}>Cancelar</button><button className="owners-button owners-delete" disabled={pending} onClick={remove}><Trash2 size={15}/>{pending?'Comprobando…':'Eliminar perfil'}</button></div></VetcareModal>}
 </section>
}
