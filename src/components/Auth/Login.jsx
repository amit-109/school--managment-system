import React, { useState } from 'react'

export default function Login({ onLogin, onSwitch }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (username && password) {
      onLogin(username) // For demo, just pass username
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">UpNext School Suite</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Login to your account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Login
          </button>
        </form>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300">Don't have an account? <button onClick={onSwitch} className="text-slate-900 dark:text-slate-100 font-medium hover:underline">Register</button></p>
        </div>
      </div>
    </div>
  )
}
