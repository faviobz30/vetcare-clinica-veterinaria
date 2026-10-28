import { useEffect, useRef } from 'react'
import EditorForm from './EditorForm'
import { api } from '../lib/api'
import { attentionError } from '../lib/attentions'
import { antecedentGroups, antecedentLimits, saveAntecedentGroup } from '../lib/antecedents'
import './VeterinaryHistory.css'
const labels = { estadoAlergias: 'Evaluación de alergias *', alergiasSustancias: 'Sustancias o medicamentos', alergiasReacciones: 'Reacciones conocidas', alergiasObservaciones: 'Observaciones de alergias', enfermedadesRelevantes: 'Enfermedades previas o crónicas y seguimiento', cirugiasPrevias: 'Cirugías y procedimientos anteriores', notasMedicas: 'Cuidados y observaciones importantes', alertasMedicas: 'Alertas médicas registradas' }
export default function AntecedentsEditor({ group, history, pet, onDone, onClose, initialFocusHeading = false, idAtencion }) {
  const sending = useRef(false), wrapper = useRef(null), close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = wrapper.current.querySelector('[role="dialog"]')
    const initial = dialog.querySelector(initialFocusHeading ? 'h2' : 'button')
    if (initialFocusHeading && initial) { initial.tabIndex = -1; initial.style.outline = 'none' }
    initial?.focus()
    const handle = event => {
      if (event.key === 'Escape') { event.preventDefault(); if (!sending.current) close.current() }
      if (event.key === 'Tab') {
        const nodes = [...dialog.querySelectorAll('button:not([disabled]),input:not([type=hidden]),textarea,[tabindex="0"]')].filter(node => node.getClientRects().length)
        if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus() }
        else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus() }
      }
    }
    document.addEventListener('keydown', handle)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handle); if (previous?.isConnected) previous.focus() }
  }, [initialFocusHeading])
  const definition = antecedentGroups[group]
  const fields = definition.keys.map(key => ({ key, label: labels[key], wide: true, required: key === 'estadoAlergias', ...(key === 'estadoAlergias' ? { options: [{ value: 'NO_EVALUADAS', label: 'Pendiente de evaluación' }, { value: 'SIN_ALERGIAS_CONOCIDAS', label: 'Sin alergias conocidas, según evaluación' }, { value: 'ALERGIAS_REGISTRADAS', label: 'Alergias registradas' }] } : { multiline: true, maxLength: antecedentLimits[key] }) }))
  fields.push({key:'motivo',label:'Motivo de la corrección',wide:true,multiline:true,required:false,maxLength:500})
  async function save(values) {
    sending.current = true
    try { return await saveAntecedentGroup(api, history, group, values, idAtencion) }
    catch (error) { const message = error.response ? attentionError(error) : error.message; throw Object.assign(new Error(message), { response: { data: { error: message } } }) }
    finally { sending.current = false }
  }
  return <div ref={wrapper} className="vet-antecedent-editor"><EditorForm title={definition.title} submitLabel="Guardar cambios" fields={fields} initial={history.antecedentes || { estadoAlergias: 'NO_EVALUADAS' }} onSave={save} onDone={({ data }) => onDone(data)} onClose={() => { if (!sending.current) close.current() }}><p className="text-sm text-vetcare-text-muted">Paciente: {pet.nombre}. Se actualiza únicamente esta sección del expediente. Los cambios quedarán registrados. Si reemplazas o retiras información, indica el motivo; no se borrará el historial.</p></EditorForm></div>
}
