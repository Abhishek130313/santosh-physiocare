import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string|undefined>()
  const navigate = useNavigate()

  const submit = async () => {
    setError(undefined)
    try {
      const res = await axios.post('/api/v1/auth/login', { email, password }, { baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000' })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('role', res.data.role)
      navigate('/')
    } catch (e: any) {
      setError('Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white border rounded p-6 w-full max-w-sm">
        <div className="text-lg font-semibold mb-4">Login</div>
        <input className="border p-2 w-full mb-2" value={email} onChange={e=> setEmail(e.target.value)} placeholder="Email" />
        <input className="border p-2 w-full mb-2" type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Password" />
        {error && <div className="text-danger text-sm mb-2">{error}</div>}
        <button className="bg-primary-600 text-white w-full py-2 rounded" onClick={submit}>Sign In</button>
      </div>
    </div>
  )
}