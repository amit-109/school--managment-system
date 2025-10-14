import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import TopBar from './components/layout/TopBar.tsx'
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
import LoadingOverlay from './components/shared/LoadingOverlay.jsx'
import { useLoading } from './components/shared/LoadingContext.jsx'
import { registerUserAsync, loginUserAsync, logoutUserAsync, setTokens } from './components/Auth/store'
import { logoutUser } from './components/Auth/authService'
import TokenManager from './components/Auth/tokenManager'

export default function App() {
  const dispatch = useDispatch()
  const { registering, loggingIn, loggingOut, plans, isAuthenticated, accessToken } = useSelector((state) => state.auth)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [showPricing, setShowPricing] = useState(false)
  const [role, setRole] = useState('operator')
  const [tab, setTab] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const { isLoading, setIsLoading } = useLoading()

  const handleNavigate = (tab) => {
    setTab(tab)
    setSidebarOpen(false) // Close sidebar on mobile when navigating
  }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = TokenManager.getInstance().getRefreshToken()
      if (refreshToken) {
        await logoutUser(refreshToken)
      }
    } catch (error) {
      console.error('Logout API failed:', error)
      // Proceed with logout anyway
    } finally {
      TokenManager.getInstance().clearTokens()
      setAuthenticated(false)
      setUser(null)
      setShowRegister(false)
      setShowLanding(true)
      setShowPricing(false)
      toast.info('You have been logged out successfully.')
    }
  }, [])

  // Check authentication on app startup using Redux state
  useEffect(() => {
    // Initialize Redux state with token if exists
    const token = TokenManager.getInstance().getAccessToken();
    const refreshToken = TokenManager.getInstance().getRefreshToken();

    if (token && refreshToken) {
      dispatch(setTokens({
        accessToken: token,
        refreshToken: refreshToken,
        isAuthenticated: true
      }));

      // Load user data
      const username = localStorage.getItem('lastUser') || 'User';
      setUser({ username });
      setAuthenticated(true);
      setShowLanding(false);
    }
  }, [dispatch])

  // Sync authentication state
  useEffect(() => {
    setAuthenticated(isAuthenticated);
    if (isAuthenticated) {
      const username = localStorage.getItem('lastUser') || 'User';
      setUser({ username });
      setShowLanding(false);
    } else {
      setUser(null);
      setAuthenticated(false);
      setShowLanding(true);
    }
  }, [isAuthenticated])

  // Auto logout after inactivity
  useEffect(() => {
    if (!authenticated) return

    let logoutTimer
    let warningTimer
    const WARNING_TIME = 9 * 60 * 1000 // 9 minutes
    const LOGOUT_TIME = 10 * 60 * 1000 // 10 minutes

    const resetTimers = () => {
      clearTimeout(logoutTimer)
      clearTimeout(warningTimer)

      warningTimer = setTimeout(() => {
        Swal.fire({
          title: 'Inactivity Warning',
          text: 'You will be automatically logged out in 1 minute due to inactivity. Click "Continue" to extend your session.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Continue Session',
          cancelButtonText: 'Logout Now',
          timer: 60 * 1000,
          timerProgressBar: true,
        }).then((result) => {
          if (result.isConfirmed) {
            resetTimers()
          } else if (result.dismiss === Swal.DismissReason.timer) {
            handleLogout()
          } else {
            handleLogout()
          }
        }) || toast.warning('Session expiring soon!', { duration: 60000 })
      }, WARNING_TIME)

      logoutTimer = setTimeout(() => {
        handleLogout()
      }, LOGOUT_TIME)
    }

    const handleActivity = () => resetTimers()

    // Add activity listeners
    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('keypress', handleActivity)
    document.addEventListener('click', handleActivity)
    document.addEventListener('scroll', handleActivity)

    resetTimers()

    return () => {
      clearTimeout(logoutTimer)
      clearTimeout(warningTimer)
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('click', handleActivity)
      document.removeEventListener('scroll', handleActivity)
    }
  }, [authenticated, handleLogout])

  // Global loading management
  useEffect(() => {
    setIsLoading(registering || loggingIn || loggingOut)
  }, [registering, loggingIn, loggingOut, setIsLoading])

  const handleLogoutWrapper = async () => {
    dispatch(logoutUserAsync())
      .then(() => {
        // Clear tokens and reset state after successful logout
        TokenManager.getInstance().clearTokens()
        setAuthenticated(false)
        setUser(null)
        setShowRegister(false)
        setShowLanding(true)
        setShowPricing(false)
      })
      .catch((error) => {
        console.error('Logout failed:', error)
        // Still clear tokens and redirect even if API fails
        TokenManager.getInstance().clearTokens()
        setAuthenticated(false)
        setUser(null)
        setShowRegister(false)
        setShowLanding(true)
        setShowPricing(false)
      })
  }



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

  const handleLogin = async ({ username, password }) => {
    try {
      const response = await dispatch(loginUserAsync({ username, password })).unwrap()
      // Still set tokens in TokenManager for API requests
      if (response.access_token && response.refresh_token) {
        TokenManager.getInstance().setTokens(response)
      }
      setUser({ username })
      setAuthenticated(true)
      setShowLanding(false)
      localStorage.setItem('lastUser', username)
      toast.success('Login successful!')
    } catch (error) {
      toast.error(`Login Failed: ${error}`)
    }
  }

  const handleRegister = async (userData) => {
    try {
      await dispatch(registerUserAsync(userData)).unwrap()
      Swal.fire('Success!', 'Account created successfully! Please login now.', 'success').then(() => {
        setShowLanding(false)
        setShowRegister(false)
        setShowPricing(false)
        // Go to login, don't authenticate yet
      })
    } catch (error) {
      Swal.fire('Registration Failed', error, 'error')
    }
  }

  if (!authenticated) {
    return (
      <LoadingOverlay isLoading={isLoading}>
        {showPricing ? (
          <PricingPage onContinue={() => { setShowRegister(true); setShowPricing(false); }} />
        ) : showLanding ? (
          <LandingPage onSignIn={() => { setShowLanding(false); setShowRegister(false); }} onRegister={() => { setShowLanding(false); setShowPricing(true); }} />
        ) : showRegister ? (
          <Register onRegister={handleRegister} onSwitch={() => setShowRegister(false)} />
        ) : (
          <Login onLogin={handleLogin} onSwitch={() => setShowPricing(true)} />
        )}
      </LoadingOverlay>
    );
  }

  return (
    <LoadingOverlay isLoading={isLoading}>
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-primary-50 dark:from-neutral-900 dark:to-primary-900/20 text-neutral-900 dark:text-neutral-100 font-inter">
      <TopBar role={role} setRole={setRole} user={user} theme={theme} toggleTheme={toggleTheme} language={language} toggleLanguage={toggleLanguage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
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
    </LoadingOverlay>
  )
}
