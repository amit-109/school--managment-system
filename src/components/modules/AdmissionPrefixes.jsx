import React, { useState, useEffect, useMemo } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import Swal from 'sweetalert2'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import {
  getClasses,
  getAdmissionPrefixes,
  upsertAdmissionPrefix,
  deleteAdmissionPrefix
} from '../Services/adminService'

export default function AdmissionPrefixes() {
  const [rows, setRows] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    prefixId: 0,
    classId: '',
    prefix: '',
    padLength: 2,
    isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [prefixRes, classRes] = await Promise.all([
        getAdmissionPrefixes(),
        getClasses()
      ])
      if (prefixRes.success) setRows(prefixRes.data || [])
      if (classRes.success) setClasses(classRes.data || [])
    } catch (error) {
      toast.error('Failed to load admission prefixes')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ prefixId: 0, classId: '', prefix: '', padLength: 2, isActive: true })
    setErrors({})
    setEditMode(false)
  }

  const validate = () => {
    const next = {}
    if (!form.classId) next.classId = 'Class is required'
    if (!String(form.prefix || '').trim()) next.prefix = 'Prefix is required'
    if (!form.padLength || form.padLength < 1 || form.padLength > 6) next.padLength = 'Pad length must be 1–6'
    return next
  }

  const handleSubmit = async () => {
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const payload = {
        prefixId: form.prefixId || 0,
        classId: parseInt(form.classId, 10),
        prefix: String(form.prefix).trim(),
        padLength: parseInt(form.padLength, 10) || 2,
        isActive: !!form.isActive
      }
      const response = await upsertAdmissionPrefix(payload)
      if (response.success) {
        toast.success(response.message || 'Saved')
        setShowModal(false)
        resetForm()
        loadData()
      } else {
        toast.error(response.message || 'Save failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row) => {
    setForm({
      prefixId: row.prefixId,
      classId: String(row.classId),
      prefix: row.prefix,
      padLength: row.padLength || 2,
      isActive: row.isActive !== false
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: 'Delete prefix?',
      text: `Remove prefix "${row.prefix}" for ${row.className}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete'
    })
    if (!result.isConfirmed) return

    setLoading(true)
    try {
      const response = await deleteAdmissionPrefix(row.prefixId)
      if (response.success) {
        toast.success('Deleted')
        loadData()
      } else {
        toast.error(response.message || 'Delete failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const cols = useMemo(() => [
    { field: 'className', headerName: 'Class' },
    { field: 'prefix', headerName: 'Prefix' },
    { field: 'nextSequence', headerName: 'Next Seq' },
    { field: 'padLength', headerName: 'Pad' },
    {
      field: 'isActive',
      headerName: 'Status',
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      headerName: 'Example',
      valueGetter: (p) => {
        const prefix = p.data?.prefix || ''
        const pad = p.data?.padLength || 2
        const seq = p.data?.nextSequence || 1
        return `${prefix}${String(seq).padStart(pad, '0')}`
      }
    }
  ], [])

  const toolbar = (
    <button
      type="button"
      onClick={() => { resetForm(); setShowModal(true) }}
      className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
    >
      Add Prefix
    </button>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Admission Number Prefix</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Map one unique prefix per class (e.g. class 6th → 60 → admission 6001)
          </p>
        </div>

        <AgGridBox
          title="Prefixes"
          columnDefs={cols}
          rowData={rows}
          toolbar={toolbar}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-semibold">{editMode ? 'Edit Prefix' : 'Add Prefix'}</h3>

              <div>
                <label className="block text-sm font-medium mb-1">Class *</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                  disabled={editMode}
                >
                  <option value="">Select Class</option>
                  {classes
                    .filter((cls) => cls.isActive !== false || (editMode && String(form.classId) === String(cls.classId)))
                    .map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className}{cls.isActive === false ? ' (Inactive)' : ''}
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prefix *</label>
                <input
                  type="text"
                  value={form.prefix}
                  onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value.replace(/\s/g, '') }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                  placeholder="e.g. 60"
                />
                {errors.prefix && <p className="text-red-500 text-xs mt-1">{errors.prefix}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pad Length</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={form.padLength}
                  onChange={(e) => setForm((f) => ({ ...f, padLength: parseInt(e.target.value, 10) || 2 }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"
                />
                {errors.padLength && <p className="text-red-500 text-xs mt-1">{errors.padLength}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  Example next: {form.prefix || '60'}{String(1).padStart(form.padLength || 2, '0')}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleSubmit} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg">
                  {editMode ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}
