import React, { useState, useEffect } from 'react'
import TopBar from './components/layout/TopBar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Dashboard from './components/modules/Dashboard.jsx'
import Employees from './components/modules/Employees.jsx'
import Students from './components/modules/Students.jsx'
import Fees from './components/modules/Fees.jsx'
import Reports from './components/modules/Reports.jsx'
import Classes from './components/modules/Classes.jsx'
import Sessions from './components/modules/Sessions.jsx'
import Subjects from './components/modules/Subjects.jsx'
import FeeStructures from './components/modules/FeeStructures.jsx'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [role, setRole] = useState('operator')
  const [tab, setTab] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  const handleNavigate = (tab) => {
    setTab(tab)
    setSidebarOpen(false) // Close sidebar on mobile when navigating
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleLogin = (username) => {
    // For demo, just authenticate
    setUser({ username })
    setAuthenticated(true)
  }

  const handleRegister = (userData) => {
    // For demo, just authenticate
    setUser(userData)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setUser(null)
    setShowRegister(false)
  }

  if (!authenticated) {
    return showRegister ? <Register onRegister={handleRegister} onSwitch={() => setShowRegister(false)} /> : <Login onLogin={handleLogin} onSwitch={() => setShowRegister(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100">
      <TopBar role={role} setRole={setRole} user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-5">
        <div className="flex">
          <Sidebar current={tab} onNavigate={handleNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-3 sm:p-6 space-y-5">
            {tab === 'dashboard' && <Dashboard role={role} />}
            {tab === 'employees' && <Employees />}
            {tab === 'students' && <Students />}
            {tab === 'fees' && <Fees />}
            {tab === 'reports' && <Reports />}
            {tab === 'classes' && <Classes />}
            {tab === 'sessions' && <Sessions />}
            {tab === 'subjects' && <Subjects />}
            {tab === 'fee-structures' && <FeeStructures />}
            <section className="bg-white dark:bg-slate-800 border rounded-2xl p-4">
              <h3 className="font-semibold mb-1">Policy Questions (to finalize)</h3>
              <p className="text-sm text-slate-600">1) Allow one-time total fee payment?</p>
              <p className="text-sm text-slate-600">2) Minimum months per payment (e.g., 2 or 3)?</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
