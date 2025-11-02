import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function Terms() {
  const { accessToken, organizationId } = useSelector((state) => state.auth)
  const [terms, setTerms] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    termId: 0,
    termName: '',
    startMonth: 1,
    endMonth: 2,
    isActive: true
  })
  const [errors, setErrors] = useState({})

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  useEffect(() => {
    loadTerms()
  }, [])

  const loadTerms = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/feemasters/term')
      if (response.data.success) {
        setTerms(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load terms:', error)
    } finally {
      setLoading(false)
    }
  }

  const cols = useMemo(() => [
    { field: 'termName', headerName: 'Term Name' },
    { 
      field: 'startMonth', 
      headerName: 'Start Month',
      valueFormatter: (params) => months.find(m => m.value === params.value)?.label || params.value
    },
    { 
      field: 'endMonth', 
      headerName: 'End Month',
      valueFormatter: (params) => months.find(m => m.value === params.value)?.label || params.value
    },
    { 
      field: 'isActive', 
      headerName: 'Status',
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.termName.trim()) newErrors.termName = 'Term name is required'
    if (form.startMonth >= form.endMonth) newErrors.endMonth = 'End month must be after start month'
    return newErrors
  }

  const resetForm = () => {
    setForm({
      termId: 0,
      termName: '',
      startMonth: 1,
      endMonth: 2,
      isActive: true
    })
    setErrors({})
    setEditMode(false)
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const payload = {
        termId: editMode ? form.termId : 0,
        organizationId: organizationId,
        termName: form.termName.trim(),
        startMonth: form.startMonth,
        endMonth: form.endMonth,
        isActive: form.isActive,
        isDeleted: false,
        createdOn: new Date().toISOString()
      }

      const response = await apiClient.post('/admin/feemasters/term', payload)
      
      if (response.data.success) {
        toast.success(editMode ? 'Term updated successfully' : 'Term created successfully')
        setShowModal(false)
        resetForm()
        loadTerms()
      } else {
        toast.error(response.data.message || 'Failed to save term')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (data) => {
    setForm({
      termId: data.termId,
      termName: data.termName,
      startMonth: data.startMonth,
      endMonth: data.endMonth,
      isActive: data.isActive
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete term "${data.termName}"?`)) {
      setLoading(true)
      try {
        const response = await apiClient.delete(`/admin/feemasters/term/${data.termId}`)

        if (response.data.success) {
          toast.success('Term deleted successfully')
          loadTerms()
        } else {
          toast.error(response.data.message || 'Failed to delete term')
        }
      } catch (error) {
        toast.error(`Network error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const toolbar = (
    <button
      onClick={() => { resetForm(); setShowModal(true) }}
      className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Term
    </button>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Term Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage academic terms and their duration</p>
        </div>

        <AgGridBox
          title="Academic Terms"
          columnDefs={cols}
          rowData={terms}
          toolbar={toolbar}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Term' : 'Add New Term'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Term Name *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.termName ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="e.g., First Term, Second Term"
                    value={form.termName}
                    onChange={(e) => setForm(f => ({...f, termName: e.target.value}))}
                  />
                  {errors.termName && <p className="text-red-500 text-xs mt-1">{errors.termName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Month *</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                      value={form.startMonth}
                      onChange={(e) => setForm(f => ({...f, startMonth: parseInt(e.target.value)}))}
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">End Month *</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                        errors.endMonth ? 'border-red-500' : 'border-slate-300'
                      }`}
                      value={form.endMonth}
                      onChange={(e) => setForm(f => ({...f, endMonth: parseInt(e.target.value)}))}
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                    {errors.endMonth && <p className="text-red-500 text-xs mt-1">{errors.endMonth}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={form.isActive}
                    onChange={(e) => setForm(f => ({...f, isActive: e.target.checked}))}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Active Term</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
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