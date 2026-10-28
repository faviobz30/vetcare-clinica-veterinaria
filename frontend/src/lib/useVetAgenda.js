import { useCallback, useEffect, useRef, useState } from 'react'
import { readVetAgenda } from './vetAgenda'
import { api } from './api'

export default function useVetAgenda() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now)
  const flight = useRef(null)
  const alive = useRef(false)
  const last = useRef(0)
  const refresh = useCallback(async (force = true) => {
    if (flight.current) {
      if (!force) return
      flight.current.abort()
    }
    const controller = new AbortController()
    flight.current = controller
    try {
      const result = await readVetAgenda(api, controller.signal)
      if (alive.current && !controller.signal.aborted) { setData(result); setLoading(false); setNow(Date.now()); last.current = Date.now() }
    } finally { if (flight.current === controller) flight.current = null }
  }, [])
  useEffect(() => {
    alive.current = true
    void refresh(false)
    const visibleRefresh = () => { if (document.visibilityState === 'visible' && Date.now() - last.current > 10000) void refresh(false) }
    const timer = window.setInterval(() => { setNow(Date.now()); visibleRefresh() }, 60000)
    window.addEventListener('focus', visibleRefresh)
    document.addEventListener('visibilitychange', visibleRefresh)
    return () => { alive.current = false; flight.current?.abort(); flight.current = null; window.clearInterval(timer); window.removeEventListener('focus', visibleRefresh); document.removeEventListener('visibilitychange', visibleRefresh) }
  }, [refresh])
  return { data, loading, now, refresh }
}
