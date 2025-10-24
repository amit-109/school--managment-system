import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox'
import { demoStudents } from '../../data/students.js'
import { usePermissions } from '../Auth/usePermissions'

export default function Students() {
  const { canCreate, canUpdate, canDelete, canRead } = usePermissions()
  const [rows, setRows] = useState(demoStudents)
  const [show, setShow] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', cls: '', stream: '', guardian: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [classFilter, setClassFilter] = useState('')
  const [streamFilter, setStreamFilter] = useState('')
  const [viewData, setViewData] = useState(null)

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
    if (!editMode && rows.some(student => student.id === form.id.trim())) newErrors.id = "ID already exists"
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.cls.trim()) newErrors.cls = "Class is required"
    if (!form.guardian.trim()) newErrors.guardian = "Guardian is required"
    if (!form.phone.trim()) newErrors.phone = "Phone is required"
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) newErrors.phone = "Phone must be 10 digits"
    return newErrors
  }

  const resetForm = () => {
    setForm({ id: '', name: '', cls: '', stream: '', guardian: '', phone: '' })
    setErrors({})
    setEditMode(false)
  }

  const addStudent = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    if (editMode) {
      setRows(prev => prev.map(student =>
        student.id === form.originalId ? {...form, id: form.id.trim(), name: form.name.trim(), guardian: form.guardian.trim(), phone: form.phone.trim(), cls: form.cls.trim(), stream: form.stream.trim()} : student
      ))
    } else {
      setRows(prev => [{...form, id: form.id.trim(), name: form.name.trim(), guardian: form.guardian.trim(), phone: form.phone.trim(), cls: form.cls.trim(), stream: form.stream.trim()}, ...prev])
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
    if (window.confirm(`Are you sure you want to delete student ${data.name}?`)) {
      setRows(prev => prev.filter(student => student.id !== data.id))
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
        Add Student
      </button>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by Class"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input-primary text-sm min-w-[140px]"
        />
        <input
          type="text"
          placeholder="Filter by Stream"
          value={streamFilter}
          onChange={(e) => setStreamFilter(e.target.value)}
          className="input-primary text-sm min-w-[140px]"
        />
      </div>
    </div>
  )

  return <>
    <AgGridBox
      title="Students"
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
        <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {editMode ? 'Edit Student' : 'Add New Student'}
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
            <form onSubmit={(e) => { e.preventDefault(); addStudent(); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Student ID *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.id ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., S001"
                    value={form.id}
                    onChange={(e) => setForm(f => ({...f, id: e.target.value}))}
                    disabled={editMode}
                  />
                  {errors.id && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.id}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., John Doe"
                    value={form.name}
                    onChange={(e) => setForm(f => ({...f, name: e.target.value}))}
                  />
                  {errors.name && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Class *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.cls ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., 10-A"
                    value={form.cls}
                    onChange={(e) => setForm(f => ({...f, cls: e.target.value}))}
                  />
                  {errors.cls && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.cls}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Stream</label>
                  <select
                    className="input-primary"
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
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Guardian Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.guardian ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., Mr. Doe"
                    value={form.guardian}
                    onChange={(e) => setForm(f => ({...f, guardian: e.target.value}))}
                  />
                  {errors.guardian && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.guardian}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="tel"
                    className={`input-primary ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., 9000000000"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({...f, phone: e.target.value}))}
                    maxLength={10}
                  />
                  {errors.phone && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
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
                  {editMode ? 'Update Student' : 'Save Student'}
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Details</h2>
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
                  <div className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">Student ID</div>
                  <div className="text-lg font-semibold text-primary-900 dark:text-primary-100">{viewData.id}</div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Full Name</div>
                  <div className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{viewData.name}</div>
                </div>
                <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">Class</div>
                  <div className="text-lg font-semibold text-accent-900 dark:text-accent-100">{viewData.cls}</div>
                </div>
                <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-success-700 dark:text-success-300 mb-1">Stream</div>
                  <div className="text-lg font-semibold text-success-900 dark:text-success-100">{viewData.stream || 'Not Applicable'}</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl col-span-2">
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Guardian Name</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{viewData.guardian}</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl col-span-2">
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone Number</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{viewData.phone}</div>
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
                  Edit Student
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
