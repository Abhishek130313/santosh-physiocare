import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useState } from 'react'
import QRCode from 'qrcode'
import { enqueue } from '../services/offlineQueue'
import { useNavigate } from 'react-router-dom'

export function Enrollment() {
  const { t } = useTranslation()
  const { register, handleSubmit } = useForm()
  const [qr, setQr] = useState<string|undefined>()
  const [offline, setOffline] = useState(!navigator.onLine)
  const navigate = useNavigate()

  window.addEventListener('online', () => setOffline(false))
  window.addEventListener('offline', () => setOffline(true))

  const onSubmit = async (data: any) => {
    if (offline) {
      await enqueue({ type: 'enroll', payload: data })
      alert('Saved offline. Will sync later.')
      return
    }
    const token = localStorage.getItem('token')
    const res = await axios.post('/api/v1/enroll', data, { baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000', headers: { Authorization: `Bearer ${token}` } })
    const payloadB64 = btoa(JSON.stringify(res.data.qr))
    const url = await QRCode.toDataURL(payloadB64)
    setQr(url)
    navigate('/smart-card', { state: { patientId: res.data.patientId, qrDataUrl: url, firstName: data.firstName, lastName: data.lastName } })
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="mb-2 text-sm">Status: {offline ? 'Offline' : 'Online'}</div>
      <h2 className="text-xl font-semibold mb-4">{t('enroll')}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
        <input className="border p-2" placeholder="First name" {...register('firstName')} />
        <input className="border p-2" placeholder="Last name" {...register('lastName')} />
        <select className="border p-2" {...register('gender')}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input className="border p-2" type="date" {...register('dob')} />
        <input className="border p-2" placeholder="Phone" {...register('phone')} />
        <input className="border p-2" placeholder="District" {...register('district')} />
        <input className="border p-2" placeholder="Taluk" {...register('taluk')} />
        <select className="border p-2" {...register('language')}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
          <option value="ml">മലയാളം</option>
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" defaultChecked {...register('allowClinical')} />{t('consent')}</label>
        <button className="bg-primary-600 text-white py-2 rounded" type="submit">Submit</button>
      </form>
      {qr && (
        <div className="mt-4">
          <img src={qr} alt="QR" className="w-40 h-40" />
          <button className="mt-2 underline" onClick={()=> window.print()}>{t('printQR')}</button>
        </div>
      )}
    </div>
  )
}