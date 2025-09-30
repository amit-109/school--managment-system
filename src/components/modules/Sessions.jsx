import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox.jsx'
import { demoSessions } from '../../data/sessions.js'

export default function Sessions() {
  const [rows, setRows] = useState(demoSessions)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', startDate: '', endDate: '', status: 'Active' })
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('')

  const filteredRows = rows.filter(row =>
    statusFilter === '' || row.status === statusFilter
  )

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 100 },
    { field: 'name', headerName: 'Session Name' },
    { field: 'startDate', headerName: 'Start Date', maxWidth: 120 },
    { field: 'endDate', headerName: 'End Date', maxWidth: 120 },
    { field: 'status', headerName: 'Status', maxWidth: 100 },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.id.trim()) newErrors.id = "ID is required"
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.startDate) newErrors.startDate = "Start date is required"
    if (!form.endDate) newErrors.endDate = "End date is required"
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }
    return newErrors
  }

  const addSession = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return;
    setRows(prev => [...prev, {
      id: form.id.trim(),
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status
    }])
    setShow(false)
    setForm({ id: '', name: '', startDate: '', endDate: '', status: 'Active' })
    setErrors({})
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add Session</button>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Closed">Closed</option>
      </select>
    </div>
  )

  return <>
    <AgGridBox title="Academic Sessions" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Session</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Session ID *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., S2024"
                value={form.id}
                onChange={(e) => setForm(f => ({...f, id: e.target.value}))}
              />
              {errors.id && <p className="text-red-500 text-xs">{errors.id}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Session Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., Academic Year 2024-25"
                value={form.name}
                onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date *</label>
              <input
                type="date"
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.startDate ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                value={form.startDate}
                onChange={(e) => setForm(f => ({...f, startDate: e.target.value}))}
              />
              {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Date *</label>
              <input
                type="date"
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.endDate ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                value={form.endDate}
                onChange={(e) => setForm(f => ({...f, endDate: e.target.value}))}
              />
              {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({...f, status: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800" onClick={()=>setShow(false)}>Cancel</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800" onClick={addSession}>Save</button>
          </div>
        </div>
      </div>
    )}
  </>
}
