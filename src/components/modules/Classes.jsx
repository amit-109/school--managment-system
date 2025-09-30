import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox.jsx'
import { demoClasses } from '../../data/classes.js'

export default function Classes() {
  const [rows, setRows] = useState(demoClasses)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', section: '', teacher: '', capacity: '' })
  const [errors, setErrors] = useState({})
  const [nameFilter, setNameFilter] = useState('')

  const filteredRows = rows.filter(row =>
    nameFilter === '' || row.name.toLowerCase().includes(nameFilter.toLowerCase())
  )

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 100 },
    { field: 'name', headerName: 'Class Name' },
    { field: 'section', headerName: 'Section', maxWidth: 100 },
    { field: 'teacher', headerName: 'Class Teacher' },
    { field: 'capacity', headerName: 'Capacity', maxWidth: 120 },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.id.trim()) newErrors.id = "ID is required"
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.section.trim()) newErrors.section = "Section is required"
    if (!form.teacher.trim()) newErrors.teacher = "Teacher is required"
    if (!form.capacity || form.capacity < 1) newErrors.capacity = "Valid capacity is required"
    return newErrors
  }

  const addClass = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return;
    setRows(prev => [...prev, {
      id: form.id.trim(),
      name: form.name.trim(),
      section: form.section.trim(),
      teacher: form.teacher.trim(),
      capacity: parseInt(form.capacity)
    }])
    setShow(false)
    setForm({ id: '', name: '', section: '', teacher: '', capacity: '' })
    setErrors({})
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add Class</button>
      <input
        type="text"
        placeholder="Filter by Class Name"
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
      />
    </div>
  )

  return <>
    <AgGridBox title="Classes" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Class</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class ID *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., C1"
                value={form.id}
                onChange={(e) => setForm(f => ({...f, id: e.target.value}))}
              />
              {errors.id && <p className="text-red-500 text-xs">{errors.id}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., Class 1"
                value={form.name}
                onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Section *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.section ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., A, B, C"
                value={form.section}
                onChange={(e) => setForm(f => ({...f, section: e.target.value}))}
              />
              {errors.section && <p className="text-red-500 text-xs">{errors.section}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class Teacher *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.teacher ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., Ms. Sharma"
                value={form.teacher}
                onChange={(e) => setForm(f => ({...f, teacher: e.target.value}))}
              />
              {errors.teacher && <p className="text-red-500 text-xs">{errors.teacher}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Capacity *</label>
              <input
                type="number"
                min="1"
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.capacity ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="Maximum number of students"
                value={form.capacity}
                onChange={(e) => setForm(f => ({...f, capacity: e.target.value}))}
              />
              {errors.capacity && <p className="text-red-500 text-xs">{errors.capacity}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800" onClick={()=>setShow(false)}>Cancel</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800" onClick={addClass}>Save</button>
          </div>
        </div>
      </div>
    )}
  </>
}
