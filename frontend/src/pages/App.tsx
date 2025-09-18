import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function App() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('role'); navigate(0) }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-[10px]">[KERALA_GOVT_LOGO_PLACEHOLDER]</div>
          <h1 className="text-lg font-semibold text-primary-700">{t('title')}</h1>
          <div className="w-10 h-10 bg-gray-200 ml-2 flex items-center justify-center text-[10px]">[GOVT_OF_INDIA_LOGO_PLACEHOLDER]</div>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="language" className="border p-2" value={i18n.language} onChange={(e)=> i18n.changeLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="ml">മലയാളം</option>
          </select>
          {token ? (
            <button className="border px-3 py-2" onClick={logout}>Logout</button>
          ) : (
            <Link className="border px-3 py-2" to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="flex-1 p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/enroll" className="p-6 bg-white border rounded shadow hover:shadow-md">{t('enroll')}</Link>
        <Link to="/clinician" className="p-6 bg-white border rounded shadow hover:shadow-md">{t('clinicianPortal')}</Link>
        <Link to="/kiosk" className="p-6 bg-white border rounded shadow hover:shadow-md">{t('kioskMode')}</Link>
        <Link to="/dashboard" className="p-6 bg-white border rounded shadow hover:shadow-md">{t('dashboard')}</Link>
        <Link to="/admin" className="p-6 bg-white border rounded shadow hover:shadow-md">{t('admin')}</Link>
        <a className="p-6 bg-white border rounded shadow" href="#about">About pilot — Kerala Govt & Health Dept</a>
      </main>
    </div>
  )
}