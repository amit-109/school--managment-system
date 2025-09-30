import React, { useMemo, useState } from 'react'
import AgGridBox from '../shared/AgGridBox.jsx'
import { demoFeeStructures } from '../../data/feeStructures.js'
import { demoClasses } from '../../data/classes.js'
import { demoSessions } from '../../data/sessions.js'

export default function FeeStructures() {
  const [rows, setRows] = useState(demoFeeStructures.map(fs => ({
    ...fs,
    displayFees: fs.fees.map(f => `${f.name}: ₹${f.amount}/${f.frequency}`).join(', ')
  })))
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    className: 'Class 1',
    stream: 'All',
    sessionId: 'S2024',
    fees: [{ name: '', amount: 0, frequency: 'Monthly' }]
  })
  const [errors, setErrors] = useState({})
  const [sessionFilter, setSessionFilter] = useState('')

  const filteredRows = rows.filter(row =>
    sessionFilter === '' || row.sessionId === sessionFilter
  )

  const cols = useMemo(() => [
    { field: 'id', headerName: 'ID', maxWidth: 100 },
    { field: 'className', headerName: 'Class' },
    { field: 'stream', headerName: 'Stream', maxWidth: 100 },
    { field: 'displayFees', headerName: 'Fee Components' },
    { field: 'totalAnnual', headerName: 'Total Annual (₹)', maxWidth: 150 },
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.className.trim()) newErrors.className = "Class is required"
    if (!form.sessionId.trim()) newErrors.sessionId = "Session is required"
    if (!form.fees || form.fees.length === 0) {
      newErrors.fees = "At least one fee is required"
    } else {
      form.fees.forEach((fee, index) => {
        if (!fee.name.trim()) newErrors[`fee${index}name`] = "Fee name is required"
        if (!fee.amount || fee.amount <= 0) newErrors[`fee${index}amount`] = "Valid amount is required"
      })
    }
    return newErrors
  }

  const addFee = () => {
    setForm(prev => ({
      ...prev,
      fees: [...prev.fees, { name: '', amount: 0, frequency: 'Monthly' }]
    }))
  }

  const removeFee = (index) => {
    setForm(prev => ({
      ...prev,
      fees: prev.fees.filter((_, i) => i !== index)
    }))
  }

  const updateFee = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      fees: prev.fees.map((fee, i) =>
        i === index ? { ...fee, [field]: value } : fee
      )
    }))
  }

  const calculateTotal = (fees) => {
    return fees.reduce((total, fee) => {
      if (fee.frequency === 'Annual') return total + fee.amount
      if (fee.frequency === 'Monthly') return total + (fee.amount * 12)
      return total
    }, 0)
  }

  const addFeeStructure = () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return;

    const total = calculateTotal(form.fees)
    const id = `FS${Date.now().toString().slice(-3)}`

    setRows(prev => [...prev, {
      id,
      className: form.className,
      stream: form.stream,
      sessionId: form.sessionId,
      fees: form.fees,
      totalAnnual: total,
      displayFees: form.fees.map(f => `${f.name}: ₹${f.amount}/${f.frequency}`).join(', ')
    }])

    setShow(false)
    setForm({
      className: 'Class 1',
      stream: 'All',
      sessionId: 'S2024',
      fees: [{ name: '', amount: 0, frequency: 'Monthly' }]
    })
    setErrors({})
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
        {demoSessions.map(session => (
          <option key={session.id} value={session.id}>{session.name}</option>
        ))}
      </select>
    </div>
  )

  return <>
    <AgGridBox title="Fee Structures" columnDefs={cols} rowData={filteredRows} toolbar={toolbar} />
    {show && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl p-4 space-y-3 max-h-[90vh] overflow-y-auto">
          <div className="text-lg font-semibold mb-4">Add New Fee Structure</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Class *</label>
              <select
                value={form.className}
                onChange={(e) => setForm(f => ({...f, className: e.target.value}))}
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.className ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              >
                {demoClasses.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
              {errors.className && <p className="text-red-500 text-xs">{errors.className}</p>}
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
                onChange={(e) => setForm(f => ({...f, sessionId: e.target.value}))}
                className={`w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 ${errors.sessionId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
              >
                {demoSessions.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
              {errors.sessionId && <p className="text-red-500 text-xs">{errors.sessionId}</p>}
            </div>
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

            {form.fees.map((fee, index) => (
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
                <div className="w-24 space-y-1">
                  <select
                    className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    value={fee.frequency}
                    onChange={(e) => updateFee(index, 'frequency', e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <button
                  onClick={() => removeFee(index)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={form.fees.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}

            {errors.fees && <p className="text-red-500 text-xs">{errors.fees}</p>}

            <div className="text-right text-sm text-slate-700 dark:text-slate-300">
              Total Annual: ₹{calculateTotal(form.fees).toLocaleString()}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:bg-slate-800" onClick={()=>setShow(false)}>Cancel</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800" onClick={addFeeStructure}>Save</button>
          </div>
        </div>
      </div>
    )}
  </>
}
