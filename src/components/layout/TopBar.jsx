import React from 'react'

export default function TopBar({ role, setRole, user, onLogout, theme, toggleTheme, sidebarOpen, setSidebarOpen }) {
  return (
    <div className="sticky top-0 z-40 flex h-14 items-center border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 sm:px-4">
      <div className="md:hidden mr-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-16 6h16"} />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-semibold tracking-tight">UpNext School Suite</div>
        <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 border rounded px-2 py-0.5">Beta</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-slate-700 dark:text-slate-300">Welcome, {user?.username || user?.email}</span>
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="border rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-800">
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin (Principal)</option>
          <option value="operator">Operator</option>
        </select>
        <button className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Profile</button>
        <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}
