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
    feeId: 0,
    classId: 0,
    feeType: '',
    amount: 0,
    dueDate: '',
    term: '',
    session: '',
    status: 'Pending'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadFeeStructures()
    loadDropdownData()
    loadClasses()
  }, [])

  const loadFeeStructures = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/fees')
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
      const response = await apiClient.get('/admin/feemasters/dropdowns')
      if (response.data.success) {
        const data = response.data.data
        setFeeTypes(data.feeTypes || [])
        setTerms(data.terms || [])
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error)
    }
  }

  const loadClasses = async () => {
    try {
      const response = await apiClient.get('/admin/classes')
      if (response.data.success) {
        setClasses(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  const cols = useMemo(() => [
    { field: 'className', headerName: 'Class' },
    { field: 'feeType', headerName: 'Fee Type' },
    { field: 'amount', headerName: 'Amount', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'dueDate', headerName: 'Due Date', valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'term', headerName: 'Term' },
    { field: 'session', headerName: 'Session' },
    { 
      field: 'status', 
      headerName: 'Status',
      cellRenderer: (params) => {
        const statusColors = {
          'Pending': 'bg-yellow-100 text-yellow-800',
          'Paid': 'bg-green-100 text-green-800',
          'Overdue': 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[params.value] || 'bg-gray-100 text-gray-800'}`}>
            {params.value}
          </span>
        )
      }
    }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.classId) newErrors.classId = 'Class is required'
    if (!form.feeType.trim()) newErrors.feeType = 'Fee type is required'
    if (!form.amount || form.amount <= 0) newErrors.amount = 'Valid amount is required'
    if (!form.dueDate) newErrors.dueDate = 'Due date is required'
    if (!form.term.trim()) newErrors.term = 'Term is required'
    if (!form.session.trim()) newErrors.session = 'Session is required'
    return newErrors
  }

  const resetForm = () => {
    setForm({
      feeId: 0,
      classId: 0,
      feeType: '',
      amount: 0,
      dueDate: '',
      term: '',
      session: '',
      status: 'Pending'
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
        feeId: editMode ? form.feeId : 0,
        organizationId: organizationId,
        classId: form.classId,
        feeType: form.feeType.trim(),
        amount: form.amount,
        dueDate: new Date(form.dueDate).toISOString(),
        term: form.term.trim(),
        session: form.session.trim(),
        status: form.status
      }

      const response = await apiClient.post('/admin/fees', payload)

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
      feeId: data.feeId,
      classId: data.classId,
      feeType: data.feeType,
      amount: data.amount,
      dueDate: new Date(data.dueDate).toISOString().split('T')[0],
      term: data.term,
      session: data.session,
      status: data.status
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete this fee structure?`)) {
      setLoading(true)
      try {
        const response = await apiClient.delete(`/admin/fees/${data.feeId}`)

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
                    value={form.feeType}
                    onChange={(e) => setForm(f => ({...f, feeType: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.feeType ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Fee Type</option>
                    {feeTypes.map(feeType => (
                      <option key={feeType.feeTypeId} value={feeType.feeTypeName}>
                        {feeType.feeTypeName}
                      </option>
                    ))}
                  </select>
                  {errors.feeType && <p className="text-red-500 text-xs mt-1">{errors.feeType}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({...f, amount: parseFloat(e.target.value) || 0}))}
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
                    value={form.term}
                    onChange={(e) => setForm(f => ({...f, term: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.term ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Term</option>
                    {terms.map(term => (
                      <option key={term.termId} value={term.termName}>
                        {term.termName}
                      </option>
                    ))}
                  </select>
                  {errors.term && <p className="text-red-500 text-xs mt-1">{errors.term}</p>}
                </div>

                {/* Session Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">Session *</label>
                  <select
                    value={form.session}
                    onChange={(e) => setForm(f => ({...f, session: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.session ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Session</option>
                    {sessions.map(session => (
                      <option key={session.sessionId} value={session.sessionName}>
                        {session.sessionName}
                      </option>
                    ))}
                  </select>
                  {errors.session && <p className="text-red-500 text-xs mt-1">{errors.session}</p>}
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
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