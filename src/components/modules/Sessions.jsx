import React, { useMemo, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function Sessions() {
  const dispatch = useDispatch()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const { accessToken, organizationId } = useSelector(state => state.auth)

  const [show, setShow] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    sessionId: 0,
    sessionName: '',
    startDate: '',
    endDate: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/feemasters/session')
      if (response.data.success) {
        setRows(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const filteredRows = rows.filter(row => {
    const statusMatch = statusFilter === '' || (statusFilter === 'Active' ? row.isActive : !row.isActive)
    return statusMatch
  }).map(row => ({
    ...row,
    startDate: new Date(row.startDate).toLocaleDateString(),
    endDate: new Date(row.endDate).toLocaleDateString(),
    status: row.isActive ? 'Active' : 'Inactive'
  }))

  const cols = useMemo(() => [
    { field: 'sessionId', headerName: 'ID', maxWidth: 100 },
    { field: 'sessionName', headerName: 'Session Name' },
    { field: 'startDate', headerName: 'Start Date', maxWidth: 120 },
    { field: 'endDate', headerName: 'End Date', maxWidth: 120 },
    { 
      field: 'status', 
      headerName: 'Status',
      maxWidth: 100,
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value}
        </span>
      )
    },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.sessionName.trim()) newErrors.sessionName = "Session name is required"
    if (!form.startDate) newErrors.startDate = "Start date is required"
    if (!form.endDate) newErrors.endDate = "End date is required"
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }
    return newErrors
  }

  const resetForm = () => {
    setForm({
      sessionId: 0,
      sessionName: '',
      startDate: '',
      endDate: '',
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
        sessionId: editMode ? form.sessionId : 0,
        organizationId: organizationId,
        sessionName: form.sessionName.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
        isDeleted: false,
        createdOn: new Date().toISOString()
      }

      console.log('Session payload:', payload)

      const response = await apiClient.post('/admin/feemasters/session', payload)

      if (response.data.success) {
        toast.success(editMode ? 'Session updated successfully' : 'Session created successfully')
        setShow(false)
        resetForm()
        loadSessions()
      } else {
        toast.error(response.data.message || 'Failed to save session')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={() => { resetForm(); setShow(true) }} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add Session</button>
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

  const handleEdit = (data) => {
    // Find original data from rows (not filteredRows) to get original date format
    const originalData = rows.find(row => row.sessionId === data.sessionId) || data
    
    setForm({
      sessionId: originalData.sessionId,
      sessionName: originalData.sessionName,
      startDate: new Date(originalData.startDate).toISOString().split('T')[0],
      endDate: new Date(originalData.endDate).toISOString().split('T')[0],
      isActive: originalData.isActive
    })
    setEditMode(true)
    setShow(true)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete session "${data.sessionName}"?`)) {
      setLoading(true)
      try {
        const response = await apiClient.delete(`/admin/feemasters/session/${data.sessionId}`)

        if (response.data.success) {
          toast.success('Session deleted successfully')
          loadSessions()
        } else {
          toast.error(response.data.message || 'Failed to delete session')
        }
      } catch (error) {
        toast.error(`Network error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  return <>
    <LoadingOverlay isLoading={loading}>
      <AgGridBox 
        title="Academic Sessions" 
        columnDefs={cols} 
        rowData={filteredRows} 
        toolbar={toolbar}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </LoadingOverlay>
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 space-y-3 max-h-[90vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">{editMode ? 'Edit Session' : 'Add New Session'}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Session Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.sessionName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., 2024-25"
                value={form.sessionName}
                onChange={(e) => setForm(f => ({...f, sessionName: e.target.value}))}
              />
              {errors.sessionName && <p className="text-red-500 text-xs">{errors.sessionName}</p>}
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
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({...f, isActive: e.target.checked}))}
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active Session</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800"
              onClick={()=>setShow(false)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
            </button>
          </div>
        </div>
      </div>
    )}
    <Toaster position="top-right" />
  </>
}
