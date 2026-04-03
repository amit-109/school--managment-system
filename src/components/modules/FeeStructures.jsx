import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function FeeStructures() {
  const { organizationId } = useSelector((state) => state.auth)
  const [feeStructures, setFeeStructures] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  
  // Dropdown data
  const [classes, setClasses] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [terms, setTerms] = useState([])
  const [sessions, setSessions] = useState([])
  
  const [form, setForm] = useState({
    classFeeId: 0,
    classId: '',
    section: 'A',
    feeTypeId: '',
    termId: '',
    sessionId: '',
    amount: '',
    dueDate: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadFeeStructures()
    loadDropdownData()
  }, [])

  const loadFeeStructures = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/fees/class-fees?page=1&size=1000')
      if (response.data.success) {
        setFeeStructures(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load fee structures:', error)
      toast.error('Failed to load fee structures')
    } finally {
      setLoading(false)
    }
  }

  const loadDropdownData = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        const data = response.data.data
        setFeeTypes(data.feeTypes || [])
        setTerms(data.terms || [])
        setSessions(data.sessions || [])
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error)
    }
  }

  // Classes now loaded from dropdowns API

  const cols = useMemo(() => [
    { field: 'ClassName', headerName: 'Class' },
    { field: 'Section', headerName: 'Section' },
    { field: 'FeeTypeName', headerName: 'Fee Type' },
    { field: 'Amount', headerName: 'Amount', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'DueDate', headerName: 'Due Date', valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'TermName', headerName: 'Term' },
    { field: 'SessionName', headerName: 'Session' },
    { 
      field: 'IsActive', 
      headerName: 'Status',
      cellRenderer: (params) => {
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {params.value ? 'Active' : 'Inactive'}
          </span>
        )
      }
    }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.classId) newErrors.classId = 'Class is required'
    if (!form.feeTypeId) newErrors.feeTypeId = 'Fee type is required'
    // if (!form.amount || form.amount <= 0) newErrors.amount = 'Valid amount is required'
    if (!form.dueDate) newErrors.dueDate = 'Due date is required'
    if (!form.termId) newErrors.termId = 'Term is required'
    if (!form.sessionId) newErrors.sessionId = 'Session is required'
    return newErrors
  }

  const resetForm = () => {
    setForm({
      classFeeId: 0,
      classId: '',
      section: 'A',
      feeTypeId: '',
      termId: '',
      sessionId: '',
      amount: '',
      dueDate: '',
      isActive: true
    })
    setErrors({})
    setEditMode(false)
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    if (!organizationId) {
      toast.error('Organization ID is required. Please login again.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        classFeeId: editMode ? form.classFeeId : 0,
        organizationId: organizationId,
        classId: form.classId,
        section: form.section,
        feeTypeId: form.feeTypeId,
        termId: form.termId,
        sessionId: form.sessionId,
        amount: parseFloat(form.amount) || 0,
        dueDate: form.dueDate,
        isActive: form.isActive
      }

      const response = await apiClient.post('/admin/fees/class-fees', payload)

      if (response.data.success) {
        toast.success(editMode ? 'Fee structure updated successfully' : 'Fee structure created successfully')
        setShowModal(false)
        resetForm()
        loadFeeStructures()
      } else {
        toast.error(response.data.message || 'Failed to save fee structure')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (data) => {
    setForm({
      classFeeId: data.ClassFeeId,
      classId: data.ClassId,
      section: data.Section || 'A',
      feeTypeId: data.FeeTypeId,
      termId: data.TermId,
      sessionId: data.SessionId,
      amount: data.Amount,
      dueDate: data.DueDate ? new Date(data.DueDate).toISOString().split('T')[0] : '',
      isActive: data.IsActive
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete this fee structure?`)) {
      setLoading(true)
      try {
        const response = await apiClient.delete(`/admin/fees/class-fees/${data.ClassFeeId}`)

        if (response.data.success) {
          toast.success('Fee structure deleted successfully')
          loadFeeStructures()
        } else {
          toast.error(response.data.message || 'Failed to delete fee structure')
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
      Add Fee Structure
    </button>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Fee Structure Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage fee structures for different classes and terms</p>
        </div>

        <AgGridBox
          title="Fee Structures"
          columnDefs={cols}
          rowData={feeStructures}
          toolbar={toolbar}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Fee Structure' : 'Add New Fee Structure'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm(f => ({...f, classId: parseInt(e.target.value) || 0}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.classId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                  {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
                </div>

                {/* Fee Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Fee Type *</label>
                  <select
                    value={form.feeTypeId}
                    onChange={(e) => setForm(f => ({...f, feeTypeId: parseInt(e.target.value) || 0}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.feeTypeId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Fee Type</option>
                    {feeTypes.map(feeType => (
                      <option key={feeType.feeTypeId} value={feeType.feeTypeId}>
                        {feeType.feeTypeName}
                      </option>
                    ))}
                  </select>
                  {errors.feeTypeId && <p className="text-red-500 text-xs mt-1">{errors.feeTypeId}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({...f, amount: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.amount ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter amount"
                  />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm(f => ({...f, dueDate: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.dueDate ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>

                {/* Term Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Term *</label>
                  <select
                    value={form.termId}
                    onChange={(e) => setForm(f => ({...f, termId: parseInt(e.target.value) || 0}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.termId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Term</option>
                    {terms.map(term => (
                      <option key={term.termId} value={term.termId}>
                        {term.termName}
                      </option>
                    ))}
                  </select>
                  {errors.termId && <p className="text-red-500 text-xs mt-1">{errors.termId}</p>}
                </div>

                {/* Session Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Session *</label>
                  <select
                    value={form.sessionId}
                    onChange={(e) => setForm(f => ({...f, sessionId: parseInt(e.target.value) || 0}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.sessionId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Session</option>
                    {sessions.map(session => (
                      <option key={session.sessionId} value={session.sessionId}>
                        {session.sessionName}
                      </option>
                    ))}
                  </select>
                  {errors.sessionId && <p className="text-red-500 text-xs mt-1">{errors.sessionId}</p>}
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-medium mb-2">Section</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm(f => ({...f, section: e.target.value}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                {/* Active Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={form.isActive}
                    onChange={(e) => setForm(f => ({...f, isActive: e.target.value === 'true'}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
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