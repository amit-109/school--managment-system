import React, { useMemo, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AgGridBox from '../shared/AgGridBox'
import CircularIndeterminate from '../Auth/CircularIndeterminate'
import {
  fetchClassesAsync,
  fetchSessionsAsync,
  fetchFeeStructuresAsync,
  createFeeStructureAsync,
  updateFeeStructureAsync,
  deleteFeeStructureAsync
} from '../Services/adminStore'

export default function FeeStructures() {
  const dispatch = useDispatch()
  const {
    classes,
    sessions,
    feeStructures: rows,
    classesLoading,
    sessionsLoading,
    feeStructuresLoading,
    creatingFeeStructure
  } = useSelector(state => state.admin)

  const [show, setShow] = useState(false)
  const [sessionFilter, setSessionFilter] = useState('')
  const [form, setForm] = useState({
    feeStructureId: 0,
    classId: 0,
    sessionId: 0,
    stream: 'All',
    feeComponents: [{ name: '', amount: 0, frequency: 'Monthly', description: '' }],
    description: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    dispatch(fetchClassesAsync())
    dispatch(fetchSessionsAsync())
    dispatch(fetchFeeStructuresAsync())
  }, [dispatch])

  const calculateTotal = (feeComponents) => {
    return feeComponents.reduce((total, fee) => {
      switch (fee.frequency) {
        case 'Annual':
          return total + fee.amount
        case 'Half-Yearly':
          return total + (fee.amount * 2)
        case 'Quarterly':
          return total + (fee.amount * 4)
        case 'Monthly':
          return total + (fee.amount * 12)
        default:
          return total
      }
    }, 0)
  }

  const filteredRows = rows.map(row => ({
    id: row.feeStructureId,
    className: row.className,
    sessionName: row.sessionName,
    stream: row.stream,
    feeComponents: row.feeComponents,
    displayFees: row.feeComponents && row.feeComponents.length > 0 ? row.feeComponents.map(f => `${f.name}: ₹${f.amount}/${f.frequency}`).join(', ') : 'No fees',
    totalAnnual: row.totalAnnualAmount,
    description: row.description,
    isActive: row.isActive
  })).filter(row =>
    sessionFilter === '' || (row.sessionName && row.sessionName.includes(sessionFilter)) || row.id.toString().includes(sessionFilter)
  )

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 100 },
    { field: 'className', headerName: 'Class' },
    { field: 'sessionName', headerName: 'Session' },
    { field: 'stream', headerName: 'Stream', maxWidth: 100 },
    { field: 'displayFees', headerName: 'Fee Components' },
    { field: 'totalAnnual', headerName: 'Total Annual (₹)', maxWidth: 150 },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.feeStructureId) newErrors.feeStructureId = "ID is required"
    if (!form.classId) newErrors.classId = "Class is required"
    if (!form.sessionId) newErrors.sessionId = "Session is required"
    if (!form.feeComponents || form.feeComponents.length === 0) {
      newErrors.feeComponents = "At least one fee is required"
    } else {
      form.feeComponents.forEach((fee, index) => {
        if (!fee.name.trim()) newErrors[`fee${index}name`] = "Fee name is required"
        if (!fee.amount || fee.amount <= 0) newErrors[`fee${index}amount`] = "Valid amount is required"
      })
    }
    if (!form.description.trim()) newErrors.description = "Description is required"
    return newErrors
  }

  const resetForm = () => {
    setForm({
      feeStructureId: 0,
      classId: 0,
      sessionId: 0,
      stream: 'All',
      feeComponents: [{ name: '', amount: 0, frequency: 'Monthly', description: '' }],
      description: '',
      isActive: true
    })
    setErrors({})
  }

  const addFee = () => {
    setForm(prev => ({
      ...prev,
      feeComponents: [...prev.feeComponents, { name: '', amount: 0, frequency: 'Monthly', description: '' }]
    }))
  }

  const removeFee = (index) => {
    setForm(prev => ({
      ...prev,
      feeComponents: prev.feeComponents.filter((_, i) => i !== index)
    }))
  }

  const updateFee = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      feeComponents: prev.feeComponents.map((fee, i) =>
        i === index ? { ...fee, [field]: value } : fee
      )
    }))
  }

  const addFeeStructure = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    try {
      const feeStructureData = {
        feeStructureId: form.feeStructureId,
        classId: form.classId,
        sessionId: form.sessionId,
        stream: form.stream,
        feeComponents: form.feeComponents.map(fee => ({
          feeComponentId: 0, // Will be auto-generated
          name: fee.name,
          amount: fee.amount,
          frequency: fee.frequency,
          description: fee.description || ''
        })),
        description: form.description.trim(),
        isActive: form.isActive
      }

      await dispatch(createFeeStructureAsync(feeStructureData)).unwrap()
      setShow(false)
      resetForm()
    } catch (error) {
      console.error('Error creating fee structure:', error)
    }
  }

  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={()=>setShow(true)} className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg">+ Add Fee Structure</button>
      <select
        value={sessionFilter}
        onChange={(e) => setSessionFilter(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
      >
        <option value="">All Sessions</option>
        {sessions.map(session => (
          <option key={session.sessionId} value={session.sessionName}>{session.sessionName}</option>
        ))}
      </select>
    </div>
  )

  if (classesLoading || sessionsLoading || feeStructuresLoading) {
    return <CircularIndeterminate />
  }

  return <>
    <AgGridBox title="Fee Structures" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Fee Structure</div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fee Structure ID *</label>
            <input
              type="number"
              className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.feeStructureId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              placeholder="e.g., 1001"
              value={form.feeStructureId}
              onChange={(e) => setForm(f => ({...f, feeStructureId: parseInt(e.target.value) || 0}))}
            />
            {errors.feeStructureId && <p className="text-red-500 text-xs">{errors.feeStructureId}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class *</label>
              <select
                value={form.classId}
                onChange={(e) => setForm(f => ({...f, classId: parseInt(e.target.value) || 0}))}
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.classId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              >
                <option value={0}>Select Class</option>
                {classes.map(cls => (
                  <option key={cls.classId} value={cls.classId}>{cls.className}</option>
                ))}
              </select>
              {errors.classId && <p className="text-red-500 text-xs">{errors.classId}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Stream</label>
              <select
                value={form.stream}
                onChange={(e) => setForm(f => ({...f, stream: e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              >
                <option value="All">All</option>
                <option value="Science">Science</option>
                <option value="Commerce">Commerce</option>
                <option value="Arts">Arts</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Session *</label>
              <select
                value={form.sessionId}
                onChange={(e) => setForm(f => ({...f, sessionId: parseInt(e.target.value) || 0}))}
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.sessionId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              >
                <option value={0}>Select Session</option>
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>{session.sessionName}</option>
                ))}
              </select>
              {errors.sessionId && <p className="text-red-500 text-xs">{errors.sessionId}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
            <input
              className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.description ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              placeholder="Fee structure description"
              value={form.description}
              onChange={(e) => setForm(f => ({...f, description: e.target.value}))}
            />
            {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fee Components *</label>
              <button
                onClick={addFee}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Add Fee
              </button>
            </div>

            {form.feeComponents.map((fee, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <input
                    placeholder="Fee Name"
                    className={`w-full border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 ${errors[`fee${index}name`] ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                    value={fee.name}
                    onChange={(e) => updateFee(index, 'name', e.target.value)}
                  />
                  {errors[`fee${index}name`] && <p className="text-red-500 text-xs">{errors[`fee${index}name`]}</p>}
                </div>
                <div className="w-20 space-y-1">
                  <input
                    type="number"
                    placeholder="₹"
                    className={`w-full border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 ${errors[`fee${index}amount`] ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                    value={fee.amount}
                    onChange={(e) => updateFee(index, 'amount', parseInt(e.target.value) || 0)}
                  />
                  {errors[`fee${index}amount`] && <p className="text-red-500 text-xs">{errors[`fee${index}amount`]}</p>}
                </div>
                <div className="w-28 space-y-1">
                  <select
                    className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    value={fee.frequency}
                    onChange={(e) => updateFee(index, 'frequency', e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <button
                  onClick={() => removeFee(index)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={form.feeComponents.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}

            {errors.feeComponents && <p className="text-red-500 text-xs">{errors.feeComponents}</p>}

            <div className="text-right text-sm text-slate-700 dark:text-slate-300">
              Total Annual: ₹{calculateTotal(form.feeComponents).toLocaleString()}
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
              onClick={addFeeStructure}
              disabled={creatingFeeStructure}
            >
              {creatingFeeStructure ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
}
