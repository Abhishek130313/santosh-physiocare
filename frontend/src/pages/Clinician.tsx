import axios from 'axios'
import { useState } from 'react'

export function Clinician() {
  const [patientId, setPatientId] = useState('')
  const [patient, setPatient] = useState<any>()
  const [notes, setNotes] = useState('')

  const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000' })
  api.interceptors.request.use(config => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; })

  const fetchPatient = async () => {
    const res = await api.get(`/api/v1/patient/${patientId}`)
    setPatient(res.data)
  }
  const addEncounter = async () => {
    await api.post(`/api/v1/encounter/${patientId}`, { type: 'OPD', notes, observations: [{ code: 'fever', value: '38', unit: 'C', district: patient?.district, taluk: patient?.taluk }] })
    alert('Encounter added')
  }
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex gap-2">
        <input className="border p-2 flex-1" placeholder="Patient ID" value={patientId} onChange={(e)=> setPatientId(e.target.value)} />
        <button className="bg-primary-600 text-white px-4" onClick={fetchPatient}>Fetch</button>
      </div>
      {patient && (
        <div className="mt-4 bg-white border p-4 rounded">
          <div className="font-semibold">{patient.firstName} {patient.lastName}</div>
          <div className="text-sm">{patient.district} / {patient.taluk}</div>
          <textarea className="border w-full p-2 mt-2" placeholder="Notes" value={notes} onChange={(e)=> setNotes(e.target.value)} />
          <button className="mt-2 bg-green-600 text-white px-4 py-1" onClick={addEncounter}>Add Encounter</button>
        </div>
      )}
    </div>
  )
}