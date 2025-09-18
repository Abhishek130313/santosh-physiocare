import axios from 'axios'
import { listQueue, clearQueue } from '../services/offlineQueue'
import { useState } from 'react'

export function SyncButton() {
  const [status, setStatus] = useState<'idle'|'syncing'|'done'|'error'>('idle')

  const syncNow = async () => {
    try {
      setStatus('syncing')
      const items = await listQueue()
      if (items.length === 0) { setStatus('done'); setTimeout(()=> setStatus('idle'), 1500); return }
      const batch: any = { patients: [], encounters: [] }
      for (const it of items) {
        if (it.type === 'enroll') batch.patients.push(it.payload)
        if (it.type === 'encounter') batch.encounters.push(it.payload)
      }
      const token = localStorage.getItem('token')
      await axios.post('/api/v1/sync', batch, { baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      await clearQueue()
      setStatus('done')
      setTimeout(()=> setStatus('idle'), 1500)
    } catch (e) {
      setStatus('error')
      setTimeout(()=> setStatus('idle'), 2000)
    }
  }

  return (
    <button aria-label="sync" className="border px-3 py-2" onClick={syncNow}>
      {status === 'idle' && 'Sync'}
      {status === 'syncing' && 'Syncing...'}
      {status === 'done' && 'Done'}
      {status === 'error' && 'Error'}
    </button>
  )
}