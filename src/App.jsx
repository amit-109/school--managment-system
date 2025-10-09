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
import LandingPage from './components/LandingPage.jsx'
import PricingPage from './components/PricingPage.jsx'

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [showPricing, setShowPricing] = useState(false)
  const [role, setRole] = useState('operator')
  const [tab, setTab] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  const handleNavigate = (tab) => {
    setTab(tab)
    setSidebarOpen(false) // Close sidebar on mobile when navigating
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'system')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      root.classList.add('system')
    } else {
      root.classList.add(theme)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en')
    localStorage.setItem('language', language === 'en' ? 'hi' : 'en')
  }

  const handleLogin = (username) => {
    // For demo, just authenticate
    setUser({ username })
    setAuthenticated(true)
    setShowLanding(false)
  }

  const handleRegister = (userData) => {
    setUser(userData)
    setAuthenticated(false)
    setShowPricing(true)
    setShowRegister(false)
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setUser(null)
    setShowRegister(false)
    setShowLanding(true)
    setShowPricing(false)
  }

  if (!authenticated) {
    if (showPricing) {
      return <PricingPage onContinue={() => { setAuthenticated(true); setShowPricing(false); }} />
    }
    if (showLanding) {
      return <LandingPage onSignIn={() => { setShowLanding(false); setShowRegister(false); }} onRegister={() => { setShowLanding(false); setShowRegister(true); }} />
    }
    return showRegister ? <Register onRegister={handleRegister} onSwitch={() => setShowRegister(false)} /> : <Login onLogin={handleLogin} onSwitch={() => setShowRegister(true)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-primary-50 dark:from-neutral-900 dark:to-primary-900/20 text-neutral-900 dark:text-neutral-100 font-inter">
      <TopBar role={role} setRole={setRole} user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} language={language} toggleLanguage={toggleLanguage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
