import React from 'react'

export default function StatCard({ title, value, sub, icon, color = 'slate' }) {
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    slate: 'from-slate-500 to-slate-600'
  }

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${gradients[color]} text-white shadow-xl p-4 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden`}>
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      {icon && <div className="text-2xl mb-2">{icon}</div>}
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-3xl font-bold leading-none mt-1">{value}</div>
      {sub && <div className="text-xs opacity-75 mt-1">{sub}</div>}
    </div>
  )
}
