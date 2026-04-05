import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'
import Swal from 'sweetalert2'

const getLastDayOfMonth = (month, year = new Date().getFullYear()) => {
  const date = new Date(year, month, 0)
  // Format date as YYYY-MM-DD in local timezone to avoid off-by-one day issues
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

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

  // Add mode: shared fields
  const [addForm, setAddForm] = useState({ classId: '', section: 'A', sessionId: '' })
  // Matrix rows: map of termId -> rows[], each row = { feeTypeId, amount, dueDate }
  const [termRows, setTermRows] = useState({})
  // Track expanded terms
  const [expandedTerms, setExpandedTerms] = useState(new Set())
  const [addErrors, setAddErrors] = useState({})

  // Edit mode: matrix
  const [editFilter, setEditFilter] = useState({ classId: '', termId: '' })
  const [editRows, setEditRows] = useState([])
  const [editErrors, setEditErrors] = useState({})
  const [form, setForm] = useState({
    classFeeId: 0, classId: '', section: 'A', feeTypeId: '', termId: '',
    sessionId: '', amount: '', dueDate: '', isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadFeeStructures()
    loadDropdownData()
  }, [])

  const loadFeeStructures = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/fees/class-fees?page=1&size=100000')
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
        setSessions((data.sessions || []).filter(s => s.isActive))
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error)
    }
  }

  // Classes now loaded from dropdowns API

  const cols = useMemo(() => [
    { field: 'ClassName', headerName: 'Class', sort: 'asc', sortIndex: 0 },
    { field: 'Section', headerName: 'Section' },
    { field: 'TermName', headerName: 'Term', sort: 'asc', sortIndex: 1 },
    { field: 'DueDate', headerName: 'Due Date', sort: 'asc', sortIndex: 2, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'FeeTypeName', headerName: 'Fee Type' },
    { field: 'Amount', headerName: 'Amount', valueFormatter: (params) => `₹ ${params.value}` },
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
    setForm({ classFeeId: 0, classId: '', section: 'A', feeTypeId: '', termId: '', sessionId: '', amount: '', dueDate: '', isActive: true })
    setErrors({})
    setAddForm({ classId: '', section: 'A', sessionId: '' })
    setTermRows({})
    setExpandedTerms(new Set())
    setAddErrors({})
    setEditFilter({ classId: '', termId: '' })
    setEditRows([])
    setEditErrors({})
    setEditMode(false)
  }

  // Load matching rows into edit matrix when class+term selected
  const handleEditFilterChange = (field, value) => {
    const newFilter = { ...editFilter, [field]: value }
    setEditFilter(newFilter)
    if (newFilter.classId && newFilter.termId) {
      const matched = feeStructures.filter(
        r => String(r.ClassId) === String(newFilter.classId) && String(r.TermId) === String(newFilter.termId)
      )
      setEditRows(matched.map(r => ({
        classFeeId: r.ClassFeeId,
        feeTypeId: r.FeeTypeId,
        feeTypeName: r.FeeTypeName,
        amount: r.Amount,
        dueDate: r.DueDate ? r.DueDate.split('T')[0] : '',
        section: r.Section || 'A',
        sessionId: r.SessionId,
        isActive: r.IsActive,
        className: r.ClassName,
        termName: r.TermName,
        sessionName: r.SessionName
      })))
      setEditErrors({})
    } else {
      setEditRows([])
    }
  }

  const updateEditRow = (index, field, value) => {
    setEditRows(rows => rows.map((r, i) => i === index ? { ...r, [field]: value } : r))
    if (field === 'amount') setEditErrors(e => { const n = {...e}; delete n[`amount_${index}`]; return n })
    if (field === 'dueDate') setEditErrors(e => { const n = {...e}; delete n[`dueDate_${index}`]; return n })
  }

  const validateEditRows = () => {
    const errs = {}
    editRows.forEach((row, i) => {
      if (row.amount === '' || row.amount === null || row.amount === undefined) errs[`amount_${i}`] = 'Required'
      if (!row.dueDate) errs[`dueDate_${i}`] = 'Required'
    })
    return errs
  }

  const handleEditSubmit = async () => {
    if (!editRows.length) { toast.error('No rows to update'); return }
    const errs = validateEditRows()
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (!organizationId) { toast.error('Organization ID is required. Please login again.'); return }

    setLoading(true)
    let successCount = 0, failCount = 0

    for (const row of editRows) {
      try {
        const payload = {
          classFeeId: row.classFeeId,
          organizationId,
          classId: parseInt(editFilter.classId),
          section: row.section,
          feeTypeId: row.feeTypeId,
          termId: parseInt(editFilter.termId),
          sessionId: row.sessionId,
          amount: parseFloat(row.amount),
          dueDate: row.dueDate,
          isActive: row.isActive
        }
        const response = await apiClient.post('/admin/fees/class-fees', payload)
        if (response.data.success) successCount++
        else failCount++
      } catch { failCount++ }
    }

    setLoading(false)
    if (successCount > 0) toast.success(`${successCount} fee structure(s) updated successfully`)
    if (failCount > 0) toast.error(`${failCount} fee structure(s) failed`)
    if (successCount > 0) { setShowModal(false); resetForm(); loadFeeStructures() }
  }

  // Auto-calculate due date from selected term's startMonth
  const getDueDateFromTerm = (termId) => {
    const term = terms.find(t => t.termId === parseInt(termId))
    if (!term?.startMonth) return ''
    return getLastDayOfMonth(term.startMonth)
  }

  // Get existing term IDs for current class+session
  const existingTermIds = useMemo(() => {
    if (!addForm.classId || !addForm.sessionId) return new Set()
    return new Set(
      feeStructures
        .filter(r =>
          String(r.ClassId) === String(addForm.classId) &&
          String(r.SessionId) === String(addForm.sessionId)
        )
        .map(r => String(r.TermId))
    )
  }, [feeStructures, addForm.classId, addForm.sessionId])

  // Get existing fee type IDs for a specific term
  const getExistingFeeTypeIds = (termId) => {
    if (!addForm.classId || !addForm.sessionId || !termId) return new Set()
    return new Set(
      feeStructures
        .filter(r =>
          String(r.ClassId) === String(addForm.classId) &&
          String(r.TermId) === String(termId) &&
          String(r.SessionId) === String(addForm.sessionId)
        )
        .map(r => String(r.FeeTypeId))
    )
  }

  // Toggle term expansion
  const toggleTermExpand = (termId) => {
    setExpandedTerms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(termId)) {
        newSet.delete(termId)
      } else {
        newSet.add(termId)
        // Initialize rows for this term if not exists
        if (!termRows[termId]) {
          const dueDate = getDueDateFromTerm(termId)
          setTermRows(prev => ({
            ...prev,
            [termId]: [{ feeTypeId: '', amount: '', dueDate }]
          }))
        }
      }
      return newSet
    })
  }

  // Add a fee type row to a specific term
  const addTermRow = (termId) => {
    const dueDate = getDueDateFromTerm(termId)
    setTermRows(prev => ({
      ...prev,
      [termId]: [...(prev[termId] || []), { feeTypeId: '', amount: '', dueDate }]
    }))
  }

  // Remove a fee type row from a specific term
  const removeTermRow = (termId, index) => {
    setTermRows(prev => ({
      ...prev,
      [termId]: prev[termId].filter((_, i) => i !== index)
    }))
  }

  // Update a fee type row in a specific term
  const updateTermRow = (termId, index, field, value) => {
    setTermRows(prev => ({
      ...prev,
      [termId]: prev[termId].map((r, i) => i === index ? { ...r, [field]: value } : r)
    }))
    // Clear error for this field
    if (field === 'amount') setAddErrors(e => { const n = {...e}; delete n[`amount_${termId}_${index}`]; return n })
    if (field === 'feeTypeId') setAddErrors(e => { const n = {...e}; delete n[`feeTypeId_${termId}_${index}`]; return n })
    if (field === 'dueDate') setAddErrors(e => { const n = {...e}; delete n[`dueDate_${termId}_${index}`]; return n })
  }

  // Get available fee types for a term (excluding already used ones)
  const getAvailableFeeTypes = (termId) => {
    const existingIds = getExistingFeeTypeIds(termId)
    const usedInCurrentTerm = new Set((termRows[termId] || []).map(r => r.feeTypeId))
    return feeTypes.filter(ft => !existingIds.has(String(ft.feeTypeId)) && !usedInCurrentTerm.has(String(ft.feeTypeId)))
  }

  // Validate all term rows
  const validateAdd = () => {
    const errs = {}
    if (!addForm.classId) errs.classId = 'Class is required'
    if (!addForm.sessionId) errs.sessionId = 'Session is required'
    
    // Check if at least one term has rows
    let hasAnyRows = false
    Object.entries(termRows).forEach(([termId, rows]) => {
      if (rows.length > 0) {
        hasAnyRows = true
        rows.forEach((row, i) => {
          if (!row.feeTypeId) errs[`feeTypeId_${termId}_${i}`] = 'Required'
          if (row.amount === '' || row.amount === null || row.amount === undefined) errs[`amount_${termId}_${i}`] = 'Required'
          if (!row.dueDate) errs[`dueDate_${termId}_${i}`] = 'Required'
        })
      }
    })
    
    if (!hasAnyRows) errs.noRows = 'Please add at least one fee type for any term'
    return errs
  }

  // Count total rows across all terms
  const getTotalRowCount = () => {
    return Object.values(termRows).reduce((sum, rows) => sum + rows.length, 0)
  }

  const handleAddSubmit = async () => {
    const errs = validateAdd()
    setAddErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill all required fields')
      return
    }
    if (!organizationId) { toast.error('Organization ID is required. Please login again.'); return }

    setLoading(true)
    let successCount = 0
    let failCount = 0

    // Iterate over all terms and their rows
    for (const [termId, rows] of Object.entries(termRows)) {
      for (const row of rows) {
        try {
          const payload = {
            classFeeId: 0,
            organizationId,
            classId: parseInt(addForm.classId),
            section: addForm.section,
            feeTypeId: parseInt(row.feeTypeId),
            termId: parseInt(termId),
            sessionId: parseInt(addForm.sessionId),
            amount: parseFloat(row.amount),
            dueDate: row.dueDate,
            isActive: true
          }
          const response = await apiClient.post('/admin/fees/class-fees', payload)
          if (response.data.success) successCount++
          else failCount++
        } catch { failCount++ }
      }
    }

    setLoading(false)
    if (successCount > 0) toast.success(`${successCount} fee structure(s) created successfully`)
    if (failCount > 0) toast.error(`${failCount} fee structure(s) failed`)
    if (successCount > 0) { setShowModal(false); resetForm(); loadFeeStructures() }
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

  const handleEdit = () => {
    setEditFilter({ classId: '', termId: '' })
    setEditRows([])
    setEditErrors({})
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (data) => {
    const result = await Swal.fire({
      title: 'Delete Fee Structure?',
      text: `Are you sure you want to delete "${data.FeeTypeName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    })
    if (!result.isConfirmed) return
    setLoading(true)
    try {
      const response = await apiClient.delete(`/admin/fees/class-fees/${data.ClassFeeId}`)
      if (response.data.success) {
        toast.success('Fee structure deleted successfully')
        setEditRows(rows => rows.filter(r => r.classFeeId !== data.ClassFeeId))
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

  const toolbar = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => { resetForm(); setShowModal(true) }}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Fee Structure
      </button>
      <button
        onClick={handleEdit}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Fee Structure
      </button>
    </div>
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
        />

        {/* Add Modal - Term-based expandable panels */}
        {showModal && !editMode && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Add Fee Structure</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select class and session, then expand terms to add fee types</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Shared Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <div>
                  <label className="block text-sm font-medium mb-1">Class *</label>
                  <select
                    value={addForm.classId}
                    onChange={(e) => {
                      setAddForm(f => ({ ...f, classId: e.target.value }))
                      setTermRows({})
                      setExpandedTerms(new Set())
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      addErrors.classId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => <option key={cls.classId} value={cls.classId}>{cls.className}</option>)}
                  </select>
                  {addErrors.classId && <p className="text-red-500 text-xs mt-1">{addErrors.classId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select
                    value={addForm.section}
                    onChange={(e) => setAddForm(f => ({ ...f, section: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Session *</label>
                  <select
                    value={addForm.sessionId}
                    onChange={(e) => {
                      setAddForm(f => ({ ...f, sessionId: e.target.value }))
                      setTermRows({})
                      setExpandedTerms(new Set())
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      addErrors.sessionId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Session</option>
                    {sessions.map(s => <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>)}
                  </select>
                  {addErrors.sessionId && <p className="text-red-500 text-xs mt-1">{addErrors.sessionId}</p>}
                </div>
              </div>

              {/* Error message for no rows */}
              {addErrors.noRows && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{addErrors.noRows}</p>
                </div>
              )}

              {/* Terms List - All terms shown as expandable cards */}
              <div className="space-y-3">
                {terms.map((term) => {
                  const isExpanded = expandedTerms.has(String(term.termId))
                  const isAlreadyExists = existingTermIds.has(String(term.termId))
                  const rows = termRows[String(term.termId)] || []
                  const availableFeeTypes = getAvailableFeeTypes(String(term.termId))

                  return (
                    <div 
                      key={term.termId} 
                      className={`border rounded-xl transition-all ${
                        isExpanded 
                          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Term Header - Clickable to expand/collapse */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => !isAlreadyExists && toggleTermExpand(String(term.termId))}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isAlreadyExists 
                              ? 'bg-gray-100 dark:bg-gray-700' 
                              : isExpanded 
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                          }`}>
                            {isAlreadyExists ? (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : isExpanded ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800 dark:text-slate-200">{term.termName}</h4>
                            {isAlreadyExists ? (
                              <p className="text-xs text-gray-500">Already configured for this class & session</p>
                            ) : rows.length > 0 ? (
                              <p className="text-xs text-blue-600 dark:text-blue-400">{rows.length} fee type(s) added</p>
                            ) : (
                              <p className="text-xs text-slate-500">Click to add fee types</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isAlreadyExists && rows.length > 0 && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                              {rows.length} row(s)
                            </span>
                          )}
                          {!isAlreadyExists && (
                            <svg 
                              className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Expanded Content - Fee Type Rows */}
                      {isExpanded && !isAlreadyExists && (
                        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                          {/* Fee Type Rows Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-100 dark:bg-slate-700/50">
                                  <th className="px-3 py-2 text-left font-medium rounded-tl-lg">#</th>
                                  <th className="px-3 py-2 text-left font-medium">Fee Type *</th>
                                  <th className="px-3 py-2 text-left font-medium">Amount (₹) *</th>
                                  <th className="px-3 py-2 text-left font-medium">Due Date *</th>
                                  <th className="px-3 py-2 text-center font-medium rounded-tr-lg">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((row, i) => {
                                  // Get available fee types for this specific row (include current selection)
                                  const rowAvailableFeeTypes = getAvailableFeeTypes(String(term.termId))
                                  const currentSelection = feeTypes.find(ft => String(ft.feeTypeId) === String(row.feeTypeId))
                                  const displayFeeTypes = currentSelection && !rowAvailableFeeTypes.find(ft => String(ft.feeTypeId) === String(row.feeTypeId))
                                    ? [...rowAvailableFeeTypes, currentSelection]
                                    : rowAvailableFeeTypes

                                  return (
                                  <tr key={i} className="border-b border-slate-200 dark:border-slate-600">
                                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                                    <td className="px-3 py-2">
                                      <select
                                        value={row.feeTypeId}
                                        onChange={(e) => updateTermRow(String(term.termId), i, 'feeTypeId', e.target.value)}
                                        className={`w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                                          addErrors[`feeTypeId_${term.termId}_${i}`] ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                      >
                                        <option value="">Select Fee Type</option>
                                        {displayFeeTypes.map(ft => (
                                          <option key={ft.feeTypeId} value={ft.feeTypeId}>{ft.feeTypeName}</option>
                                        ))}
                                      </select>
                                      {addErrors[`feeTypeId_${term.termId}_${i}`] && <p className="text-red-500 text-xs mt-0.5">{addErrors[`feeTypeId_${term.termId}_${i}`]}</p>}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.amount}
                                        onChange={(e) => updateTermRow(String(term.termId), i, 'amount', e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                                          addErrors[`amount_${term.termId}_${i}`] ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                      />
                                      {addErrors[`amount_${term.termId}_${i}`] && <p className="text-red-500 text-xs mt-0.5">{addErrors[`amount_${term.termId}_${i}`]}</p>}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="date"
                                        value={row.dueDate}
                                        onChange={(e) => updateTermRow(String(term.termId), i, 'dueDate', e.target.value)}
                                        className={`w-full px-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                                          addErrors[`dueDate_${term.termId}_${i}`] ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                      />
                                      {addErrors[`dueDate_${term.termId}_${i}`] && <p className="text-red-500 text-xs mt-0.5">{addErrors[`dueDate_${term.termId}_${i}`]}</p>}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {rows.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeTermRow(String(term.termId), i)}
                                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                  )})}
                              </tbody>
                            </table>
                          </div>

                          {/* Add Row Button */}
                          <button
                            type="button"
                            onClick={() => addTermRow(String(term.termId))}
                            disabled={availableFeeTypes.length === 0}
                            className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm border border-dashed border-slate-400 dark:border-slate-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Fee Type
                          </button>
                        </div>
                      )}

                      {/* Expanded Content - Already Exists Message */}
                      {isExpanded && isAlreadyExists && (
                        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">This term is already configured</p>
                              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Use the Edit mode to modify fee structures for this term</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Summary and Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total fee structures to create: <span className="font-semibold text-slate-800 dark:text-slate-200">{getTotalRowCount()}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubmit}
                    disabled={loading || getTotalRowCount() === 0}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-60"
                  >
                    {loading ? `Creating ${getTotalRowCount()} record(s)...` : `Create ${getTotalRowCount()} Fee Structure(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Matrix by Class + Term */}
        {showModal && editMode && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Edit Fee Structures</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Select class &amp; term to load and edit fee rows</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1.5">Select Class</label>
                  <select
                    value={editFilter.classId}
                    onChange={(e) => handleEditFilterChange('classId', e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 dark:border-blue-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 bg-white font-medium"
                  >
                    <option value="">— Select Class —</option>
                    {classes.map(cls => <option key={cls.classId} value={cls.classId}>{cls.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1.5">Select Term</label>
                  <select
                    value={editFilter.termId}
                    onChange={(e) => handleEditFilterChange('termId', e.target.value)}
                    className="w-full px-3 py-2.5 border border-blue-300 dark:border-blue-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 bg-white font-medium"
                  >
                    <option value="">— Select Term —</option>
                    {terms.map(t => <option key={t.termId} value={t.termId}>{t.termName}</option>)}
                  </select>
                </div>
              </div>

              {/* Empty State */}
              {!editFilter.classId || !editFilter.termId ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                  <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium">Select a Class and Term above to load fee structures</p>
                </div>
              ) : editRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                  <svg className="w-16 h-16 mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-medium">No fee structures found for this Class &amp; Term combination</p>
                </div>
              ) : (
                <>
                  {/* Summary Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                      {editRows.length} record(s) loaded
                    </span>
                    <span className="text-xs text-slate-500">{editRows[0]?.className} &bull; {editRows[0]?.termName} &bull; {editRows[0]?.sessionName}</span>
                  </div>

                  {/* Editable Matrix */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <th className="px-4 py-3 text-left font-semibold">#</th>
                          <th className="px-4 py-3 text-left font-semibold">Fee Type</th>
                          <th className="px-4 py-3 text-left font-semibold">Section</th>
                          <th className="px-4 py-3 text-left font-semibold">Amount (₹)</th>
                          <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                          <th className="px-4 py-3 text-center font-semibold">Status</th>
                          <th className="px-4 py-3 text-center font-semibold">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editRows.map((row, i) => (
                          <tr key={i} className={`border-t border-slate-200 dark:border-slate-600 transition-colors ${
                            i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/30'
                          }`}>
                            <td className="px-4 py-3">
                              <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-slate-700 dark:text-slate-200">{row.feeTypeName}</span>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={row.section}
                                onChange={(e) => updateEditRow(i, 'section', e.target.value)}
                                className="px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                              >
                                {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <span className="absolute left-2.5 top-2 text-slate-400 text-sm">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.amount}
                                  onChange={(e) => updateEditRow(i, 'amount', e.target.value)}
                                  className={`w-32 pl-6 pr-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                                    editErrors[`amount_${i}`] ? 'border-red-500' : 'border-slate-300'
                                  }`}
                                />
                              </div>
                              {editErrors[`amount_${i}`] && <p className="text-red-500 text-xs mt-0.5">{editErrors[`amount_${i}`]}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={row.dueDate}
                                onChange={(e) => updateEditRow(i, 'dueDate', e.target.value)}
                                className={`px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                                  editErrors[`dueDate_${i}`] ? 'border-red-500' : 'border-slate-300'
                                }`}
                              />
                              {editErrors[`dueDate_${i}`] && <p className="text-red-500 text-xs mt-0.5">{editErrors[`dueDate_${i}`]}</p>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => updateEditRow(i, 'isActive', !row.isActive)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  row.isActive
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400'
                                }`}
                              >
                                {row.isActive ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDelete({ ClassFeeId: row.classFeeId, FeeTypeName: row.feeTypeName })}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/40 dark:hover:bg-red-800/50 dark:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={loading || editRows.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {loading ? `Updating ${editRows.length} record(s)...` : `Update ${editRows.length} Fee Structure(s)`}
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