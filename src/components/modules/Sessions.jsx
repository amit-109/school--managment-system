import React, { useMemo, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AgGridBox from '../shared/AgGridBox'
import CircularIndeterminate from '../Auth/CircularIndeterminate'
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

  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    sessionId: 0,
    sessionName: '',
    academicYear: '',
    startDate: '',
    endDate: '',
    status: 'Active',
    description: '',
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
    if (!form.sessionId) newErrors.sessionId = "ID is required"
    if (!form.sessionName.trim()) newErrors.sessionName = "Name is required"
    if (!form.academicYear.trim()) newErrors.academicYear = "Academic year is required"
    if (!form.startDate) newErrors.startDate = "Start date is required"
    if (!form.endDate) newErrors.endDate = "End date is required"
    if (!form.description.trim()) newErrors.description = "Description is required"
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }
    return newErrors
  }

  const resetForm = () => {
    setForm({
      sessionId: 0,
      sessionName: '',
      academicYear: '',
      startDate: '',
      endDate: '',
      status: 'Active',
      description: '',
      isActive: true
    })
    setErrors({})
  }

  const addSession = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      const sessionData = {
        sessionId: form.sessionId,
        sessionName: form.sessionName.trim(),
        academicYear: form.academicYear.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        description: form.description.trim(),
        isActive: form.isActive
      }

      await dispatch(createSessionAsync(sessionData)).unwrap()
      setShow(false)
      resetForm()
    } catch (error) {
      console.error('Error creating session:', error)
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
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Session ID *</label>
              <input
                type="number"
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.sessionId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., 2024"
                value={form.sessionId}
                onChange={(e) => setForm(f => ({...f, sessionId: parseInt(e.target.value) || 0}))}
              />
              {errors.sessionId && <p className="text-red-500 text-xs">{errors.sessionId}</p>}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Session Name *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.sessionName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., Academic Year 2024-25"
                value={form.sessionName}
                onChange={(e) => setForm(f => ({...f, sessionName: e.target.value}))}
              />
              {errors.sessionName && <p className="text-red-500 text-xs">{errors.sessionName}</p>}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Year *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.academicYear ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="e.g., 2024-25"
                value={form.academicYear}
                onChange={(e) => setForm(f => ({...f, academicYear: e.target.value}))}
              />
              {errors.academicYear && <p className="text-red-500 text-xs">{errors.academicYear}</p>}
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
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({...f, status: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
              <input
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.description ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder="Session description"
                value={form.description}
                onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
              />
              {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
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
  </>
}
