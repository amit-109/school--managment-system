import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import TopBar from './components/layout/TopBar.tsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Dashboard from './components/modules/Dashboard.tsx'
import AdminDashboard from './components/modules/AdminDashboard.tsx'
import SuperAdminDashboard from './components/modules/SuperAdminDashboard.tsx'
import UserManagement from './components/modules/UserManagement.jsx'
import SubscriptionManagement from './components/modules/SubscriptionManagement.tsx'
import ModuleManagement from './components/modules/ModuleManagement.tsx'
import SubModuleManagement from './components/modules/SubModuleManagement.tsx'
import RoleManagement from './components/modules/RoleManagement.tsx'
import TenantManagement from './components/modules/TenantManagement.tsx'
import RoleScope from './components/modules/RoleScope.tsx'
import AuditLogs from './components/modules/AuditLogs.tsx'
import SubscriptionPlans from './components/modules/SubscriptionPlans.tsx'
import Employees from './components/modules/Employees.jsx'
import Students from './components/modules/Students.jsx'
import Teachers from './components/modules/Teachers.jsx'
import Parents from './components/modules/Parents.jsx'
import Fees from './components/modules/Fees.jsx'
import Reports from './components/modules/Reports.jsx'
import Classes from './components/modules/Classes.jsx'
import Sections from './components/modules/Sections.jsx'
import Sessions from './components/modules/Sessions.jsx'
import Subjects from './components/modules/Subjects.jsx'
import ClassSubjects from './components/modules/ClassSubjects.jsx'
import TeacherSubjects from './components/modules/TeacherSubjects.jsx'
import Terms from './components/modules/Terms.jsx'
import Feetype from './components/modules/Feetype.jsx'
import FeeStructures from './components/modules/FeeStructures.jsx'
import FeeManagement from './components/modules/FeeManagement.jsx'
import Concessions from './components/modules/Concessions.jsx'
import GenerateInvoice from './components/modules/GenerateInvoice.jsx'
import Invoices from './components/modules/Invoices.jsx'
import CollectPayment from './components/modules/CollectPayment.jsx'
import PaymentMethods from './components/modules/PaymentMethods.jsx'
import PermissionAssignment from './components/modules/PermissionAssignment.jsx'
import PermissionManagement from './components/modules/PermissionManagement.jsx'
import Login from './components/Auth/Login.jsx'
import Register from './components/Auth/Register.jsx'
import LandingPage from './components/LandingPage.jsx'
import PricingPage from './components/PricingPage.jsx'
import LoadingOverlay from './components/shared/LoadingOverlay.jsx'
import { useLoading } from './components/shared/LoadingContext.jsx'
import { registerUserAsync, loginUserAsync, logoutUserAsync, setTokens } from './components/Auth/store'
import { store } from './store'
import { logoutUser } from './components/Auth/authService'
import TokenManager from './components/Auth/tokenManager'

export default function App() {
  const dispatch = useDispatch()
  const { registering, loggingIn, loggingOut, plans, isAuthenticated, accessToken, userRole, userRoles } = useSelector((state) => state.auth)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [showPricing, setShowPricing] = useState(false)
  const [role, setRole] = useState('operator') // This will be updated based on userRole from auth state
  const [tab, setTab] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const { isLoading, setIsLoading } = useLoading()

  const handleNavigate = (tab, fromComponent = false) => {
    // Only redirect permission-assignment from sidebar to permission-management (user list)
    // Allow direct navigation when coming from PermissionManagement component
    if (tab === 'permission-assignment' && !fromComponent) {
      // Force clear any leftover data and go to user list
      localStorage.removeItem('selectedUserForPermissions');
      setTab('permission-management');
    } else if (tab === 'permission-management') {
      localStorage.removeItem('selectedUserForPermissions');
      setTab(tab);
    } else {
      setTab(tab);
    }
    
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
      setTab('dashboard'); // Set to dashboard on reload
    }
  }, [dispatch])

  // Sync authentication state and role
  useEffect(() => {
    setAuthenticated(isAuthenticated);
    if (isAuthenticated && userRole) {
      // Update local role state based on userRole from Redux
      if (userRole === 'SuperAdmin') {
        setRole('superadmin');
      } else if (userRole === 'Admin') {
        setRole('admin');
      } else if (userRole === 'Teacher' || userRole === 'Student' || userRole === 'Parent') {
        setRole('operator'); // Map other roles to operator permissions
      } else {
        setRole('operator'); // Default fallback
      }

      const username = localStorage.getItem('lastUser') || 'User';
      setUser({ username });
      setShowLanding(false);
    } else {
      setUser(null);
      setAuthenticated(false);
      setShowLanding(true);
      setRole('operator'); // Reset to default
    }
  }, [isAuthenticated, userRole])

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
        toast.error('Session expiring soon! You will be logged out in 1 minute.', { duration: 60000 })
        // Auto-logout after warning period
        setTimeout(() => {
          handleLogout()
        }, 60 * 1000)
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
      const response = await dispatch(loginUserAsync({ username, password })).unwrap();

      // Wait for Redux state to be updated and then set tokens
      setTimeout(() => {
        const authState = store.getState().auth;

        if (authState.accessToken && authState.refreshToken) {
          TokenManager.getInstance().setTokens({
            accessToken: authState.accessToken,
            refreshToken: authState.refreshToken,
          });
        } else if (response.access_token && response.refresh_token) {
          TokenManager.getInstance().setTokens({
            access_token: response.access_token,
            refresh_token: response.refresh_token,
          });
        }
      }, 100);

      setUser({ username });
      setAuthenticated(true);
      setShowLanding(false);
      localStorage.setItem('lastUser', username);
      setTab('dashboard'); // Ensure we start on dashboard
      toast.success('Login successful!');
    } catch (error) {
      toast.error(`Login Failed: ${error}`);
    }
  }

  const handleRegister = async (userData) => {
    try {
      await dispatch(registerUserAsync(userData)).unwrap()
      toast.success('Account created successfully! Please login now.')
      setShowLanding(false)
      setShowRegister(false)
      setShowPricing(false)
      // Go to login, don't authenticate yet
    } catch (error) {
      toast.error(`Registration Failed: ${error}`)
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
        <Toaster position="top-right" />
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
            {/* Show ALL components during development */}
            {tab === 'dashboard' && <Dashboard role={role} />}
            {tab === 'users' && <UserManagement />}
            {tab === 'subscriptions' && (role === 'superadmin' ? <SubscriptionPlans /> : <SubscriptionManagement />)}
            {tab === 'modules' && <ModuleManagement />}
            {tab === 'submodules' && <SubModuleManagement />}
            {tab === 'roles' && <RoleManagement />}
            {tab === 'tenants' && <TenantManagement />}
            {tab === 'role-scope' && <RoleScope />}
            {tab === 'analytics' && <Reports />}
            {tab === 'audit-logs' && <AuditLogs />}
            {tab === 'employees' && <Employees />}
            {tab === 'students' && <Students />}
            {tab === 'student' && <Students />}
            {tab === 'teachers' && <Teachers />}
            {tab === 'teacher' && <Teachers />}
            {tab === 'parents' && <Parents />}
            {tab === 'parent' && <Parents />}
            {tab === 'fees' && <Fees />}
            {tab === 'fee-management' && <FeeManagement />}
            {tab === 'reports' && <Reports />}
            {tab === 'classes' && <Classes />}
            {tab === 'sections' && <Sections />}
            {tab === 'sessions' && <Sessions />}
            {tab === 'subjects' && <Subjects />}
            {tab === 'class-subjects' && <ClassSubjects />}
            {tab === 'teacher-subjects' && <TeacherSubjects />}
            {tab === 'terms' && <Terms />}
            {tab === 'term' && <Terms />}
            {tab === 'feetype' && <Feetype />}
            {tab === 'fee-structures' && <FeeStructures />}
            {tab === 'concessions' && <Concessions />}
            {tab === 'generate-invoice' && <GenerateInvoice />}
            {tab === 'invoices' && <Invoices />}
            {tab === 'collect-payment' && <CollectPayment />}
            {tab === 'payment-methods' && <PaymentMethods />}
            {tab === 'permission-management' && <PermissionManagement onNavigate={handleNavigate} />}
            {tab === 'permission-assignment' && <PermissionAssignment onNavigate={handleNavigate} />}

            {/* Show specific dashboard overrides temporarily commented out */}
            {/* {tab === 'dashboard' && role === 'superadmin' && <SuperAdminDashboard />} */}
            {/* {tab === 'dashboard' && role === 'admin' && <AdminDashboard />} */}


          </main>
        </div>
      </div>
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}
