import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox'
import { demoSubjects } from '../../data/subjects.js'

export default function Subjects() {
  const [rows, setRows] = useState(demoSubjects)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', code: '', type: 'Core', streams: ['Science'], maxMarks: 100 })
  const [errors, setErrors] = useState({})
  const [typeFilter, setTypeFilter] = useState('')

  const filteredRows = rows.filter(row =>
    typeFilter === '' || row.type === typeFilter
  )

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 100 },
    { field: 'name', headerName: 'Subject Name' },
    { field: 'code', headerName: 'Code', maxWidth: 100 },
    { field: 'type', headerName: 'Type', maxWidth: 100 },
    { field: 'streams', headerName: 'Streams', maxWidth: 150 },
    { field: 'maxMarks', headerName: 'Max Marks', maxWidth: 120 },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.id.trim()) newErrors.id = "ID is required"
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.code.trim()) newErrors.code = "Code is required"
    if (!form.streams || form.streams.length === 0) newErrors.streams = "At least one stream is required"
    if (!form.maxMarks || form.maxMarks < 1) newErrors.maxMarks = "Valid max marks is required"
    return newErrors
  }

  const handleStreamChange = (stream) => {
    setForm(prev => ({
      ...prev,
      streams: prev.streams.includes(stream)
        ? prev.streams.filter(s => s !== stream)
        : [...prev.streams, stream]
    }))
  }

  const addSubject = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return;
    setRows(prev => [...prev, {
      id: form.id.trim(),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      streams: form.streams,
      maxMarks: parseInt(form.maxMarks)
    }])
    setShow(false)
    setForm({ id: '', name: '', code: '', type: 'Core', streams: ['Science'], maxMarks: 100 })
    setErrors({})
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add Subject</button>
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
      >
        <option value="">All Types</option>
        <option value="Core">Core</option>
        <option value="Elective">Elective</option>
      </select>
    </div>
  )

  return <>
    <AgGridBox title="Subjects" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Subject</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject ID *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., SUB01"
                value={form.id}
                onChange={(e) => setForm(f => ({...f, id: e.target.value}))}
              />
              {errors.id && <p className="text-red-500 text-xs">{errors.id}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject Code *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.code ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., MATH"
                value={form.code}
                onChange={(e) => setForm(f => ({...f, code: e.target.value}))}
              />
              {errors.code && <p className="text-red-500 text-xs">{errors.code}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., Mathematics"
                value={form.name}
                onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({...f, type: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              >
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Max Marks *</label>
              <input
                type="number"
                min="1"
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.maxMarks ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="Maximum marks"
                value={form.maxMarks}
                onChange={(e) => setForm(f => ({...f, maxMarks: e.target.value}))}
              />
              {errors.maxMarks && <p className="text-red-500 text-xs">{errors.maxMarks}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Applicable Streams *</label>
              <div className="flex flex-wrap gap-2">
                {['Science', 'Arts', 'Commerce'].map(stream => (
                  <label key={stream} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={form.streams.includes(stream)}
                      onChange={() => handleStreamChange(stream)}
                      className="rounded"
                    />
                    {stream}
                  </label>
                ))}
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={form.streams.includes('All')}
                    onChange={() => setForm(f => ({...f, streams: ['All']}))}
                    className="rounded"
                  />
                  All
                </label>
              </div>
              {errors.streams && <p className="text-red-500 text-xs">{errors.streams}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800" onClick={()=>setShow(false)}>Cancel</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800" onClick={addSubject}>Save</button>
          </div>
        </div>
      </div>
    )}
  </>
}
