import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { App } from './pages/App'
import { Enrollment } from './pages/Enrollment'
import { Clinician } from './pages/Clinician'
import { Kiosk } from './pages/Kiosk'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'
import './services/i18n'
import { Login } from './pages/Login'
import { SmartCard } from './pages/SmartCard'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/login', element: <Login /> },
  { path: '/enroll', element: <Enrollment /> },
  { path: '/smart-card', element: <SmartCard /> },
  { path: '/clinician', element: <Clinician /> },
  { path: '/kiosk', element: <Kiosk /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/admin', element: <Admin /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)