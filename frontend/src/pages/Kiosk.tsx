import { useState } from 'react'

export function Kiosk() {
  const [step, setStep] = useState<'start'|'biometric'|'otp'|'done'>('start')
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      {step === 'start' && (
        <div className="grid gap-4">
          <button className="text-2xl bg-primary-600 text-white p-6 rounded" onClick={()=> setStep('biometric')}>Start Biometric</button>
          <button className="text-2xl bg-green-600 text-white p-6 rounded" onClick={()=> setStep('otp')}>Use OTP</button>
        </div>
      )}
      {step === 'biometric' && (
        <div className="text-center">
          <div className="text-xl mb-4">Place finger on scanner (mock)</div>
          <button className="bg-primary-600 text-white px-6 py-3 rounded" onClick={()=> setStep('done')}>Simulate Match</button>
        </div>
      )}
      {step === 'otp' && (
        <div className="text-center">
          <input className="border p-3 text-2xl" placeholder="Enter OTP" />
          <button className="ml-2 bg-green-600 text-white px-6 py-3 rounded" onClick={()=> setStep('done')}>Verify</button>
        </div>
      )}
      {step === 'done' && (
        <div className="text-center text-2xl">Verified. Print QR...</div>
      )}
    </div>
  )
}