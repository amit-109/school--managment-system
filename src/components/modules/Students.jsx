import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox.jsx'
import { demoStudents } from '../../data/students.js'

export default function Students() {
  const [rows, setRows] = useState(demoStudents)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', cls: '', stream: '', guardian: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [classFilter, setClassFilter] = useState('')
  const [streamFilter, setStreamFilter] = useState('')

  const filteredRows = rows.filter(row => 
    (classFilter === '' || row.cls.includes(classFilter)) &&
    (streamFilter === '' || row.stream.includes(streamFilter))
  )

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 120 },
    { field: 'name', headerName: 'Name' },
    { field: 'cls', headerName: 'Class', maxWidth: 140 },
    { field: 'stream', headerName: 'Stream', maxWidth: 140 },
    { field: 'guardian', headerName: 'Guardian' },
    { field: 'phone', headerName: 'Phone', maxWidth: 160 },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.id.trim()) newErrors.id = "ID is required"
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.cls.trim()) newErrors.cls = "Class is required"
    if (!form.guardian.trim()) newErrors.guardian = "Guardian is required"
    if (!form.phone.trim()) newErrors.phone = "Phone is required"
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) newErrors.phone = "Phone must be 10 digits"
    return newErrors
  }

  const addStudent = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return;
    setRows(prev => [{...form, id: form.id.trim(), name: form.name.trim(), guardian: form.guardian.trim(), phone: form.phone.trim(), cls: form.cls.trim(), stream: form.stream.trim()}, ...prev]);
    setShow(false);
    setForm({ id: '', name: '', cls: '', stream: '', guardian: '', phone: '' });
    setErrors({})
  }

  const toolbar = (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={()=>setShow(true)}
        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
      >
        <span className="text-lg">➕</span>
        Add Student
      </button>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Filter by Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
        />
        <input
          type="text"
          placeholder="Filter by Stream"
          value={streamFilter}
          onChange={(e) => setStreamFilter(e.target.value)}
          className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
        />
      </div>
    </div>
  )

  return <>
    <AgGridBox title="Students" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Student</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Student ID *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 ${errors.id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400`}
                placeholder="e.g., S001"
                value={form.id}
                onChange={(e) => setForm(f => ({...f, id: e.target.value}))}
              />
              {errors.id && <p className="text-red-500 text-xs">{errors.id}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400`}
                placeholder="e.g., John Doe"
                value={form.name}
                onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 ${errors.cls ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400`}
                placeholder="e.g., 10-A"
                value={form.cls}
                onChange={(e) => setForm(f => ({...f, cls: e.target.value}))}
              />
              {errors.cls && <p className="text-red-500 text-xs">{errors.cls}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Stream</label>
              <select
                className="w-full border rounded-lg px-3 py-2 bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
                value={form.stream}
                onChange={(e) => setForm(f => ({...f, stream: e.target.value}))}
              >
                <option value="">Select Stream</option>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
                <option value="Commerce">Commerce</option>
                <option value="-">Not Applicable</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Guardian Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 ${errors.guardian ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400`}
                placeholder="e.g., Mr. Doe"
                value={form.guardian}
                onChange={(e) => setForm(f => ({...f, guardian: e.target.value}))}
              />
              {errors.guardian && <p className="text-red-500 text-xs">{errors.guardian}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100 ${errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400`}
                placeholder="e.g., 9000000000"
                value={form.phone}
                onChange={(e) => setForm(f => ({...f, phone: e.target.value}))}
                maxLength={10}
              />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
            <button
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium"
              onClick={()=>setShow(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              onClick={addStudent}
            >
              Save Student
            </button>
          </div>
        </div>
      </div>
    )}
  </>
}
