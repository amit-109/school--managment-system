import React, { useMemo, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import CircularIndeterminate from '../Auth/CircularIndeterminate'
import TokenManager from '../Auth/tokenManager'
import { fetchSessionsAsync, createSessionAsync, updateSessionAsync, deleteSessionAsync } from '../Services/adminStore'

export default function Sessions() {
  const dispatch = useDispatch()
  const {
    sessions: rows,
    sessionsLoading,
    creatingSession,
    updatingSession,
    deletingSession
  } = useSelector(state => state.admin)
  const { accessToken, organizationId } = useSelector(state => state.auth)

  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    sessionName: '',
    startDate: '',
    endDate: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    dispatch(fetchSessionsAsync())
  }, [dispatch])

  const filteredRows = rows.filter(row => {
    const searchableData = `${row.sessionId} ${row.sessionName} ${row.academicYear}`.toLowerCase()
    const classMatch = statusFilter === '' || row.status === statusFilter
    return classMatch
  }).map(row => ({
    id: row.sessionId,
    name: row.sessionName,
    startDate: new Date(row.startDate).toLocaleDateString(),
    endDate: new Date(row.endDate).toLocaleDateString(),
    status: row.status,
    academicYear: row.academicYear,
    description: row.description,
    isActive: row.isActive
  }))

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 100 },
    { field: 'name', headerName: 'Session Name' },
    { field: 'academicYear', headerName: 'Academic Year', maxWidth: 120 },
    { field: 'startDate', headerName: 'Start Date', maxWidth: 120 },
    { field: 'endDate', headerName: 'End Date', maxWidth: 120 },
    { field: 'status', headerName: 'Status', maxWidth: 100 },
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
      sessionName: '',
      startDate: '',
      endDate: '',
      isActive: true
    })
    setErrors({})
  }

  const addSession = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      const token = accessToken || TokenManager.getInstance().getAccessToken()
      
      console.log('=== SESSION API DEBUG ===')
      console.log('Access Token from Redux:', !!accessToken)
      console.log('Access Token from TokenManager:', !!TokenManager.getInstance().getAccessToken())
      console.log('Final token being used:', !!token)
      const payload = {
        sessionId: 0,
        organizationId: organizationId || 19,
        sessionName: form.sessionName.trim(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
        isDeleted: false,
        createdOn: new Date().toISOString()
      }

      console.log('=== SESSION API DEBUG ===')
      console.log('Payload being sent:', JSON.stringify(payload, null, 2))
      console.log('Organization ID from Redux:', organizationId)
      console.log('Access Token available:', !!token)
      console.log('API Endpoint:', 'https://sfms-api.abhiworld.in/api/admin/feemasters/session')

      const response = await fetch('https://sfms-api.abhiworld.in/api/admin/feemasters/session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const result = await response.json()
        console.log('Success response:', result)
        if (result.success) {
          toast.success('Session created successfully')
          setShow(false)
          resetForm()
          dispatch(fetchSessionsAsync())
        } else {
          console.error('API returned success=false:', result)
          toast.error(result.message || 'Failed to save session')
        }
      } else {
        const errorText = await response.text()
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        toast.error(`Failed to save session: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Network/Parse Error:', error)
      toast.error(`Network error: ${error.message}`)
    }
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add Session</button>
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

  if (sessionsLoading) {
    return <CircularIndeterminate />
  }

  return <>
    <AgGridBox title="Academic Sessions" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-4 space-y-3 max-h-[90vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Session</div>
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
              onClick={addSession}
              disabled={creatingSession}
            >
              {creatingSession ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )}
    <Toaster position="top-right" />
  </>
}
