import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox.jsx'
import { demoClasses } from '../../data/classes.js'

export default function Classes() {
  const [rows, setRows] = useState(demoClasses)
  const [show, setShow] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', section: '', teacher: '', capacity: '' })
  const [errors, setErrors] = useState({})
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [viewData, setViewData] = useState(null)

  const filteredRows = rows.filter(row =>
    (classFilter === '' || row.name.toLowerCase().includes(classFilter.toLowerCase())) &&
    (sectionFilter === '' || row.section.toLowerCase().includes(sectionFilter.toLowerCase()))
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
    if (!editMode && rows.some(cls => cls.id === form.id.trim())) newErrors.id = "ID already exists"
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.section.trim()) newErrors.section = "Section is required"
    if (!form.teacher.trim()) newErrors.teacher = "Teacher is required"
    if (!form.capacity || form.capacity < 1) newErrors.capacity = "Valid capacity is required"
    return newErrors
  }

  const resetForm = () => {
    setForm({ id: '', name: '', section: '', teacher: '', capacity: '' })
    setErrors({})
    setEditMode(false)
  }

  const addClass = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    if (editMode) {
      setRows(prev => prev.map(cls =>
        cls.id === form.originalId ? {...form, id: form.id.trim(), name: form.name.trim(), section: form.section.trim(), teacher: form.teacher.trim(), capacity: parseInt(form.capacity)} : cls
      ))
    } else {
      setRows(prev => [...prev, {
        id: form.id.trim(),
        name: form.name.trim(),
        section: form.section.trim(),
        teacher: form.teacher.trim(),
        capacity: parseInt(form.capacity)
      }])
    }
    setShow(false)
    resetForm()
  }

  const handleEdit = (data) => {
    setForm({...data, originalId: data.id})
    setEditMode(true)
    setShow(true)
  }

  const handleView = (data) => {
    setViewData(data)
  }

  const handleDelete = (data) => {
    if (window.confirm(`Are you sure you want to delete class ${data.name} - ${data.section}?`)) {
      setRows(prev => prev.filter(cls => cls.id !== data.id))
    }
  }

  const toolbar = (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => { resetForm(); setShow(true) }}
        className="px-5 py-2.5 btn-primary flex items-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Class
      </button>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by Class Name"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input-primary text-sm min-w-[140px]"
        />
        <input
          type="text"
          placeholder="Filter by Section"
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="input-primary text-sm min-w-[140px]"
        />
      </div>
    </div>
  )

  return <>
    <AgGridBox
      title="Classes"
      columnDefs={cols}
      rowData={filteredRows}
      toolbar={toolbar}
      onEdit={handleEdit}
      onView={handleView}
      onDelete={handleDelete}
    />

    {/* Add/Edit Modal */}
    {show && (
      <div className="modal-backdrop">
        <div className="modal-content w-full max-w-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {editMode ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button
                onClick={() => setShow(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addClass(); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Class ID *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.id ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., C1"
                    value={form.id}
                    onChange={(e) => setForm(f => ({...f, id: e.target.value}))}
                    disabled={editMode}
                  />
                  {errors.id && <p className="text-danger-600 dark:text-danger-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.id}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Class Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.name ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., Class 1"
                    value={form.name}
                    onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
                  />
                  {errors.name && <p className="text-danger-600 dark:text-danger-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Section *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.section ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., A, B, C"
                    value={form.section}
                    onChange={(e) => setForm(f => ({...f, section: e.target.value}))}
                  />
                  {errors.section && <p className="text-danger-600 dark:text-danger-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.section}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Class Teacher *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.teacher ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="e.g., Ms. Sharma"
                    value={form.teacher}
                    onChange={(e) => setForm(f => ({...f, teacher: e.target.value}))}
                  />
                  {errors.teacher && <p className="text-danger-600 dark:text-danger-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.teacher}
                  </p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    className={`input-primary ${errors.capacity ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Maximum number of students"
                    value={form.capacity}
                    onChange={(e) => setForm(f => ({...f, capacity: e.target.value}))}
                  />
                  {errors.capacity && <p className="text-danger-600 dark:text-danger-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.capacity}
                  </p>}
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  className="px-6 py-3 btn-secondary"
                  onClick={() => setShow(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 btn-primary"
                >
                  {editMode ? 'Update Class' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* View Modal */}
    {viewData && (
      <div className="modal-backdrop">
        <div className="modal-content w-full max-w-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Class Details</h2>
              <button
                onClick={() => setViewData(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">Class ID</div>
                  <div className="text-lg font-semibold text-primary-900 dark:text-primary-100">{viewData.id}</div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Class Name</div>
                  <div className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{viewData.name}</div>
                </div>
                <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">Section</div>
                  <div className="text-lg font-semibold text-accent-900 dark:text-accent-100">{viewData.section}</div>
                </div>
                <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-success-700 dark:text-success-300 mb-1">Capacity</div>
                  <div className="text-lg font-semibold text-success-900 dark:text-success-100">{viewData.capacity} students</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl col-span-2">
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Class Teacher</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{viewData.teacher}</div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setViewData(null);
                    handleEdit(viewData);
                  }}
                  className="px-6 py-3 btn-primary"
                >
                  Edit Class
                </button>
                <button
                  onClick={() => setViewData(null)}
                  className="px-6 py-3 btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
}
