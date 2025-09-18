import axios from 'axios'
import { useEffect, useState } from 'react'

export function Dashboard() {
  const [alerts, setAlerts] = useState<any[]>([])
  useEffect(()=> {
    (async()=> {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/v1/alerts', { baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000', headers: token ? { Authorization: `Bearer ${token}` } : {} })
        setAlerts(res.data.alerts || [])
      } catch {}
    })()
  }, [])

  return (
    <div className="p-4 grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white border rounded p-4 min-h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Kerala Map placeholder. Alerts: {alerts.length}</div>
      </div>
      <div className="bg-white border rounded p-4">
        <div className="font-semibold mb-2">Alerts</div>
        <ul className="space-y-2">
          {alerts.map(a => (<li key={a.id} className="p-2 border rounded">
            <div className="text-sm">{a.message}</div>
            <div className="text-xs text-gray-500">{a.district} • count {a.count}</div>
          </li>))}
        </ul>
      </div>
    </div>
  )
}