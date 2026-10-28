import { Info, Weight } from 'lucide-react'
import { attentionDate } from '../lib/attentions'
import { appointmentTime } from '../lib/vetAgenda'

export default function OwnerWeightChart({ evolution }) {
  const { measurements, available } = evolution
  if (!available) return <p className="owner-history-empty">No se pudieron consultar las mediciones de peso.</p>
  if (!measurements.length) return <p className="owner-history-empty">Todavía no hay mediciones de peso registradas.</p>
  const latest = evolution.latest || measurements.at(-1)
  const latestBlock = <div className="owner-weight-latest"><div><span>Último peso registrado</span><strong>{latest.weight} <small>kg</small></strong><small>{attentionDate(latest.date)}</small>{evolution.delta != null && <small>{evolution.delta > 0 ? '+' : ''}{evolution.delta} kg respecto al anterior</small>}</div><span className="owner-weight-neutral"><Weight size={32}/></span></div>
  if (measurements.length === 1) return <div className="owner-history-single-weight">{latestBlock}<p className="owner-weight-note"><Info size={19}/>Con las próximas mediciones podrás seguir la evolución de su peso.</p></div>
  const weights = measurements.map(m => m.weight), dates = measurements.map(m => appointmentTime(m.date))
  const min = Math.min(...weights), max = Math.max(...weights), padding = Math.max((max - min) * .2, .2)
  const bottom = Math.max(0, min - padding), top = max + padding
  const start = Math.min(...dates), end = Math.max(...dates)
  const x = date => 55 + (end === start ? .5 : (date - start) / (end - start)) * 370
  const y = weight => 165 - (weight - bottom) / (top - bottom) * 130
  return <>{latestBlock}<svg viewBox="0 0 480 220" className="owner-weight-chart" role="img" aria-labelledby="owner-weight-title owner-weight-desc"><title id="owner-weight-title">Evolución del peso registrado</title><desc id="owner-weight-desc">{measurements.map(m => `${attentionDate(m.date)}: ${m.weight} kg`).join('; ')}. Cada punto es una medición real. No se estiman pesos entre consultas.</desc>{[bottom, (bottom + top) / 2, top].map(value => <g key={value}><line x1="52" x2="437" y1={y(value)} y2={y(value)} stroke="#eeeaf5"/><text x="45" y={y(value) + 4} textAnchor="end" fontSize="11" fill="#6B7280">{value.toFixed(1)}</text></g>)}<text x="12" y="19" fontSize="11" fill="#6B7280">kg</text>{measurements.map((m, i) => <g key={m.id}><circle cx={x(dates[i])} cy={y(m.weight)} r="5" fill="#10B981" stroke="white" strokeWidth="2"><title>{attentionDate(m.date)} · {m.weight} kg</title></circle><text x={x(dates[i])} y={y(m.weight) - 11} textAnchor="middle" fontSize="11" fill="#3B2382">{m.weight}</text>{(measurements.length <= 5 || i === 0 || i === measurements.length - 1) && <text x={x(dates[i])} y="195" textAnchor="middle" fontSize="10" fill="#6B7280">{attentionDate(m.date)}</text>}</g>)}</svg><p className="owner-history-caption">Solo mediciones registradas; sin estimar pesos entre consultas.</p><details className="owner-weight-records"><summary>Ver mediciones y variaciones</summary><div className="overflow-x-auto"><table><thead><tr><th>Fecha de atención</th><th>Peso</th><th>Variación</th></tr></thead><tbody>{measurements.map((m, i) => <tr key={m.id}><td>{attentionDate(m.date)} · {attentionDate(m.date, 'time')}</td><td>{m.weight} kg</td><td>{i ? `${Math.round((m.weight - measurements[i - 1].weight) * 1000) / 1000} kg` : 'Sin medición anterior'}</td></tr>)}</tbody></table></div></details></>
}
