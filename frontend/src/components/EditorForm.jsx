import {createPortal} from 'react-dom'
import {passwordError,passwordHelp} from '../lib/passwordPolicy'
import PrettySelect from './PrettySelect'
import VetDateTimePicker from './VetDateTimePicker'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Save, X } from 'lucide-react'
import { api, errorText } from '../lib/api'

function coerce(field, raw) {
  if (field.omit) return undefined
  const empty = raw === '' || raw == null
  if (empty) return field.required === false ? undefined : raw
  if (field.type === 'number') return Number(raw)
  if ((field.type === 'datetime-local' || field.key === 'fechaCita') && String(raw).length === 16) return `${raw}:00`
  return raw
}

export default function EditorForm({ title, description, fields, endpoint, method='post', initial={}, submitKeys, onDone, onClose, children, onSave, submitLabel='Guardar', canSubmit, transformValues, compact=false, variant='', confirmSubmit, validateValues, fieldErrorsFromResponse }) {
  const [values,setValues]=useState(()=>Object.fromEntries(fields.map(f=>[f.key, initial[f.key] ?? f.defaultValue ?? ''])))
  const sending = useRef(false)
  const panel=useRef(null)
  useEffect(()=>{if(!compact)return;const previous=document.activeElement;panel.current?.querySelector('button,input')?.focus();return()=>previous?.focus()},[compact])
  const [error,setError]=useState('')
  const [fieldErrors,setFieldErrors]=useState({})
  const refined=variant==='veterinarians',fieldFeedback=refined||variant==='users'||variant==='owners'
  const [busy,setBusy]=useState(false)
  const change=(key,value)=>{if(fieldFeedback){setError('');setFieldErrors(previous=>{const next={...previous};delete next[key];if(key==='tipoDocumento')delete next.nroDocumento;return next})}setValues(previous=>{const next={...previous,[key]:value};return transformValues?transformValues(next,previous):next})}
  async function submit(e){
    e.preventDefault(); if(sending.current||(canSubmit&&!canSubmit(values)))return; sending.current=true; setError(''); setBusy(true)
    try {
      const invalidFields=validateValues?.(values)||{};setFieldErrors(invalidFields);if(Object.keys(invalidFields).length)return
      const keys = submitKeys || fields.filter(f=>!f.omit&&!f.section).map(f=>f.key)
      const payload={}
      for (const f of fields) {
        if (!keys.includes(f.key)) continue
        const value = coerce(f, values[f.key])
        if (value !== undefined) payload[f.key] = value
      }
      for(const field of fields.filter(f=>f.type==='password')){const invalid=passwordError(values[field.key]);if(invalid)throw new Error(compact?invalid.replace(' Máximo 72 bytes.',''):invalid)}
      if(confirmSubmit && !await confirmSubmit(payload))return
      const result = onSave ? await onSave(payload) : await api({url:endpoint,method,data:payload}); onDone(result)
    } catch(err){const mapped=fieldErrorsFromResponse?.(err)||{};if(Object.keys(mapped).length)setFieldErrors(mapped);else setError(compact && !err.response ? (err.isAxiosError ? 'No se pudo conectar. Intenta nuevamente.' : err.message || 'No se pudo completar la operación.') : errorText(err))} finally {sending.current=false;setBusy(false);if(compact)requestAnimationFrame(()=>panel.current?.querySelector('button')?.focus())}
  }
  const content = <div className="fixed inset-0 z-50 bg-[#211431]/55 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div ref={panel} className={`bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 md:p-8 shadow-2xl ${compact?'vets-editor':''} ${variant==='users'?'users-editor':''} ${refined?'vets-refined-editor':''} ${variant==='owners'?'owners-editor':''}`} onKeyDown={event=>{if(!compact)return;if(event.key==='Escape'&&!sending.current)onClose();if(event.key==='Tab'){const nodes=[...panel.current.querySelectorAll('button:not(:disabled),input:not([type=hidden]):not(:disabled),textarea:not(:disabled)')].filter(n=>n.offsetParent!==null&&n.tabIndex!==-1);if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes.at(-1)?.focus()}else if(!event.shiftKey&&document.activeElement===nodes.at(-1)){event.preventDefault();nodes[0]?.focus()}}}}>
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-vetcare-text">{title}</h2><button className="btn btn-ghost" disabled={compact&&busy} onClick={onClose} aria-label="Cerrar"><X size={18}/></button></div>
      {description&&<p className="editor-description">{description}</p>}
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <fieldset disabled={compact&&busy} className={compact?'vets-editor-body':'contents'}>
        {fields.map(f=>f.section ? <h3 key={f.key} className="users-form-section sm:col-span-2">{f.label}</h3> : f.hidden ? <input key={f.key} type="hidden" value={values[f.key] ?? ''}/> : <label key={f.key} className={`block ${f.wide?'sm:col-span-2':''}`}><span className="block text-sm font-semibold mb-2">{f.label}</span>{f.render?f.render({values,onChange:v=>change(f.key,v),busy}):f.type==='datetime-local'?<VetDateTimePicker label={f.label} required={f.required!==false} value={values[f.key]} onChange={v=>change(f.key,v)}/>:f.options?<PrettySelect keyboardNavigation={compact} required={f.required!==false} label={f.label} value={values[f.key]} onChange={v=>change(f.key,v)} options={f.options}/>:f.multiline?<textarea className="input min-h-24" maxLength={f.maxLength} required={f.required!==false} value={values[f.key]} onChange={e=>{if(compact)setError('');change(f.key,e.target.value)}}/>:<input className="input" aria-invalid={!!fieldErrors[f.key]} aria-describedby={fieldFeedback&&(fieldErrors[f.key]||f.help||f.type==='password')?`vet-field-${f.key}`:undefined} inputMode={f.inputMode} type={f.type||'text'} required={f.required!==false} min={f.type==='number'?(f.min??0):undefined} step={f.step} maxLength={f.maxLength} value={values[f.key]} onChange={e=>{if(compact)setError('');change(f.key,e.target.value)}}/>}{fieldErrors[f.key]&&<span id={`vet-field-${f.key}`} role="alert" className="vets-field-error"><AlertCircle size={15}/>{Array.isArray(fieldErrors[f.key])?<ul>{fieldErrors[f.key].map(message=><li key={message}>{message}</li>)}</ul>:fieldErrors[f.key]}</span>}{f.help&&!fieldErrors[f.key]&&<small id={`vet-field-${f.key}`} className="vets-field-help">{f.help}</small>}{f.notice?.(values)&&<small className="editor-field-notice">{f.notice(values)}</small>}{f.type==='password'&&!fieldErrors[f.key]&&<small id={fieldFeedback?`vet-field-${f.key}`:undefined} className="block text-xs text-vetcare-text-muted mt-2">{refined?'Usa al menos 8 caracteres e incluye mayúscula, minúscula, número y símbolo. Evita contraseñas comunes.':compact?passwordHelp.replace(' Máximo 72 bytes.',''):passwordHelp}</small>}</label>)}
        {children && <div className="sm:col-span-2">{children}</div>}
        {error&&<p role="alert" className="sm:col-span-2 bg-red-50 p-3 rounded-xl text-red-800 text-sm flex gap-2"><AlertCircle size={18}/>{error}</p>}
        </fieldset>
        <div className="sm:col-span-2 flex justify-end gap-3 pt-4 vets-editor-actions"><button type="button" className="btn btn-ghost" disabled={compact&&busy} onClick={onClose}>Cancelar</button><button disabled={busy||(canSubmit&&!canSubmit(values))} className="btn btn-primary"><Save size={17}/>{busy?'Guardando...':submitLabel}</button></div>
      </form>
    </div>
  </div>
  return compact?createPortal(content,document.body):content
}
