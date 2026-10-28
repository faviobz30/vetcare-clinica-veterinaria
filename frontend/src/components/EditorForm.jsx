import {passwordError,passwordHelp} from '../lib/passwordPolicy'
import PrettySelect from './PrettySelect'
import VetDateTimePicker from './VetDateTimePicker'
import { useRef, useState } from 'react'
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

export default function EditorForm({ title, fields, endpoint, method='post', initial={}, submitKeys, onDone, onClose, children, onSave, submitLabel='Guardar', canSubmit, transformValues }) {
  const [values,setValues]=useState(()=>Object.fromEntries(fields.map(f=>[f.key, initial[f.key] ?? f.defaultValue ?? ''])))
  const sending = useRef(false)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const change=(key,value)=>setValues(previous=>{const next={...previous,[key]:value};return transformValues?transformValues(next,previous):next})
  async function submit(e){
    e.preventDefault(); if(sending.current||(canSubmit&&!canSubmit(values)))return; sending.current=true; setError(''); setBusy(true)
    try {
      const keys = submitKeys || fields.filter(f=>!f.omit).map(f=>f.key)
      const payload={}
      for (const f of fields) {
        if (!keys.includes(f.key)) continue
        const value = coerce(f, values[f.key])
        if (value !== undefined) payload[f.key] = value
      }
      for(const field of fields.filter(f=>f.type==='password')){const invalid=passwordError(values[field.key]);if(invalid)throw new Error(invalid)}
      const result = onSave ? await onSave(payload) : await api({url:endpoint,method,data:payload}); onDone(result)
    } catch(err){setError(errorText(err))} finally {sending.current=false;setBusy(false)}
  }
  return <div className="fixed inset-0 z-50 bg-[#211431]/55 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6 md:p-8 shadow-2xl">
      <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-vetcare-text">{title}</h2><button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar"><X size={18}/></button></div>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        {fields.map(f=>f.hidden ? <input key={f.key} type="hidden" value={values[f.key] ?? ''}/> : <label key={f.key} className={`block ${f.wide?'sm:col-span-2':''}`}><span className="block text-sm font-semibold mb-2">{f.label}</span>{f.render?f.render({values,onChange:v=>change(f.key,v),busy}):f.type==='datetime-local'?<VetDateTimePicker label={f.label} required={f.required!==false} value={values[f.key]} onChange={v=>change(f.key,v)}/>:f.options?<PrettySelect required={f.required!==false} label={f.label} value={values[f.key]} onChange={v=>change(f.key,v)} options={f.options}/>:f.multiline?<textarea className="input min-h-24" maxLength={f.maxLength} required={f.required!==false} value={values[f.key]} onChange={e=>change(f.key,e.target.value)}/>:<input className="input" type={f.type||'text'} required={f.required!==false} min={f.type==='number'?(f.min??0):undefined} step={f.step} maxLength={f.maxLength} value={values[f.key]} onChange={e=>change(f.key,e.target.value)}/>}{f.type==='password'&&<small className="block text-xs text-vetcare-text-muted mt-2">{passwordHelp}</small>}</label>)}
        {children && <div className="sm:col-span-2">{children}</div>}
        {error&&<p role="alert" className="sm:col-span-2 bg-red-50 p-3 rounded-xl text-red-800 text-sm flex gap-2"><AlertCircle size={18}/>{error}</p>}
        <div className="sm:col-span-2 flex justify-end gap-3 pt-4"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button><button disabled={busy||(canSubmit&&!canSubmit(values))} className="btn btn-primary"><Save size={17}/>{busy?'Guardando...':submitLabel}</button></div>
      </form>
    </div>
  </div>
}
