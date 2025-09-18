import { useLocation } from 'react-router-dom'

export function SmartCard() {
  const { state } = useLocation() as any
  const { patientId, qrDataUrl, firstName, lastName } = state || {}
  return (
    <div className="p-4">
      <div className="print:w-[210mm] print:h-[297mm] bg-white border mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">[KERALA_GOVT_LOGO_PLACEHOLDER]</div>
          <div className="font-semibold">Kerala Digital Health Smart Card</div>
          <div className="text-sm">[GOVT_OF_INDIA_LOGO_PLACEHOLDER]</div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="text-lg font-semibold">{firstName} {lastName}</div>
            <div className="text-sm text-gray-600">ID: {patientId}</div>
          </div>
          <div className="flex items-center justify-center">
            {qrDataUrl && <img src={qrDataUrl} className="w-40 h-40" />}
          </div>
        </div>
        <div className="mt-6 text-xs text-gray-600">
          This is a prototype card. Logos are placeholders until permissions.
        </div>
      </div>
      <button className="mt-4 border px-4 py-2" onClick={()=> window.print()}>Print / Save PDF</button>
    </div>
  )
}