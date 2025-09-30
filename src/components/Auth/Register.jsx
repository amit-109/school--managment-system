import React, { useState } from 'react'

export default function Register({ onRegister, onSwitch }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  })

  const handleRegister = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (form.username && form.email && form.password) {
      onRegister(form)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">UpNext School Suite</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">Create your account</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm(f => ({...f, username: e.target.value}))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({...f, email: e.target.value}))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Enter email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({...f, role: e.target.value}))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({...f, password: e.target.value}))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Enter password"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm(f => ({...f, confirmPassword: e.target.value}))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Confirm password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Register
          </button>
        </form>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300">Already have an account? <button onClick={onSwitch} className="text-slate-900 dark:text-slate-100 font-medium hover:underline">Login</button></p>
        </div>
      </div>
    </div>
  )
}
