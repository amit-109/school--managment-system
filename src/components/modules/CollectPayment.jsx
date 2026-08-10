import React, { useState, useEffect, useMemo, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'
import { getSections } from '../Services/adminService'
import { printPaymentById } from '../utils/printFeeReceipt'
import { pickLatestSessionId } from '../utils/sessionUtils'

const emptyFilters = {
  classId: '',
  sectionId: '',
  paymentMode: '',
  fromDate: '',
  toDate: ''
}

const emptyCollectForm = {
  studentId: 0,
  studentName: '',
  admissionNo: '',
  paymentTarget: 'TermFee',
  sessionId: '',
  paymentMode: 'Cash',
  referenceNo: '',
  notes: '',
  totalPaidAmount: '',
  yearlyTotal: 0,
  termFeeLeft: 0,
  oldFeeLeft: 0
}

export default function CollectPayment() {
  const [payments, setPayments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [classes, setClasses] = useState([])
  const [filterSections, setFilterSections] = useState([])
  const [sessions, setSessions] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const searchDebounceRef = useRef(null)

  // Collect modal
  const [showModal, setShowModal] = useState(false)
  const [modalClassId, setModalClassId] = useState('')
  const [modalSectionId, setModalSectionId] = useState('')
  const [modalSessionId, setModalSessionId] = useState('')
  const [modalSections, setModalSections] = useState([])
  const [studentBalances, setStudentBalances] = useState([])
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [form, setForm] = useState(emptyCollectForm)
  const [errors, setErrors] = useState({})
  const studentDropdownRef = useRef(null)

  useEffect(() => {
    loadDropdowns()
    loadPaymentMethods()
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(paymentSearchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(searchDebounceRef.current)
  }, [paymentSearchTerm])

  useEffect(() => {
    loadPayments(currentPage, pageSize, debouncedSearch, filters)
  }, [currentPage, pageSize, debouncedSearch, filters])

  useEffect(() => {
    if (!showModal || !modalClassId) {
      setStudentBalances([])
      return
    }
    if (modalSections.length > 0 && !modalSectionId) {
      setStudentBalances([])
      return
    }
    loadBalances()
  }, [showModal, modalClassId, modalSectionId, modalSessionId, modalSections.length])

  useEffect(() => {
    const onDocClick = (e) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target)) {
        setStudentDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const loadDropdowns = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        setClasses((response.data.data?.classes || []).filter((c) => c.isActive !== false))
        const sess = (response.data.data?.sessions || []).filter((s) => s.isActive !== false)
        setSessions(sess)
        const latestId = pickLatestSessionId(sess)
        if (latestId) setModalSessionId(latestId)
      }
    } catch {
      // ignore
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const response = await apiClient.get('/PaymentMethods/methods')
      const list = response.data?.data || response.data || []
      setPaymentMethods(Array.isArray(list) ? list.filter((m) => m.isActive !== false) : [])
    } catch {
      setPaymentMethods([])
    }
  }

  const loadSections = async (classId, forModal) => {
    if (!classId) {
      if (forModal) setModalSections([])
      else setFilterSections([])
      return
    }
    try {
      const res = await getSections(classId)
      const list = res.success ? (res.data || []) : []
      if (forModal) setModalSections(list)
      else setFilterSections(list)
    } catch {
      if (forModal) setModalSections([])
      else setFilterSections([])
    }
  }

  const loadPayments = async (page = 1, size = 10, search = '', activeFilters = emptyFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('size', String(size))
      if (search) params.append('search', search)
      if (activeFilters.classId) params.append('classId', activeFilters.classId)
      if (activeFilters.sectionId) params.append('sectionId', activeFilters.sectionId)
      if (activeFilters.paymentMode) params.append('paymentMode', activeFilters.paymentMode)
      if (activeFilters.fromDate) params.append('fromDate', activeFilters.fromDate)
      if (activeFilters.toDate) params.append('toDate', activeFilters.toDate)
      const response = await apiClient.get(`/admin/fees/payments?${params}`)
      if (response.data.success) {
        const data = response.data.data
        setPayments(data?.payments || data || [])
        setTotalCount(data?.totalCount || data?.payments?.length || 0)
      } else {
        setPayments([])
        setTotalCount(0)
      }
    } catch {
      toast.error('Failed to load payments')
      setPayments([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const loadBalances = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('classId', modalClassId)
      if (modalSectionId) params.append('sectionId', modalSectionId)
      if (modalSessionId) params.append('sessionId', modalSessionId)
      const response = await apiClient.get(`/admin/fees/balances?${params}`)
      if (response.data.success) setStudentBalances(response.data.data || [])
      else setStudentBalances([])
    } catch {
      toast.error('Failed to load students')
      setStudentBalances([])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setPaymentSearchTerm('')
    setDebouncedSearch('')
    setFilters(emptyFilters)
    setFilterSections([])
    setCurrentPage(1)
  }

  const openCollectModal = () => {
    const latestId = pickLatestSessionId(sessions) || modalSessionId
    if (latestId) setModalSessionId(latestId)
    setForm({ ...emptyCollectForm, sessionId: latestId, paymentMode: 'Cash' })
    setErrors({})
    setModalClassId('')
    setModalSectionId('')
    setModalSections([])
    setStudentBalances([])
    setStudentQuery('')
    setStudentDropdownOpen(false)
    setShowModal(true)
  }

  const studentLabel = (row) => {
    const name = row.studentName || row.StudentName || ''
    const adm = row.admissionNo || row.AdmissionNo || ''
    return adm ? `${name} (${adm})` : name
  }

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return studentBalances
    return studentBalances.filter((row) => {
      const name = String(row.studentName || row.StudentName || '').toLowerCase()
      const adm = String(row.admissionNo || row.AdmissionNo || '').toLowerCase()
      return name.includes(q) || adm.includes(q) || studentLabel(row).toLowerCase().includes(q)
    })
  }, [studentBalances, studentQuery])

  const selectStudent = (row) => {
    const hasOld = Number(row.oldFeeLeft || row.OldFeeLeft || 0) > 0
    const name = row.studentName || row.StudentName || ''
    const adm = row.admissionNo || row.AdmissionNo || ''
    setForm({
      studentId: row.studentId || row.StudentId,
      studentName: name,
      admissionNo: adm,
      paymentTarget: hasOld ? '' : 'TermFee',
      sessionId: modalSessionId,
      paymentMode: 'Cash',
      referenceNo: '',
      notes: '',
      totalPaidAmount: '',
      yearlyTotal: Number(row.yearlyTotal || row.YearlyTotal || 0),
      termFeeLeft: Number(row.termFeeLeft || row.TermFeeLeft || 0),
      oldFeeLeft: Number(row.oldFeeLeft || row.OldFeeLeft || 0)
    })
    setStudentQuery(studentLabel(row))
    setStudentDropdownOpen(false)
    setErrors({})
  }

  const clearSelectedStudent = () => {
    setForm({ ...emptyCollectForm, sessionId: modalSessionId, paymentMode: 'Cash' })
    setStudentQuery('')
    setStudentDropdownOpen(false)
    setErrors({})
  }

  const maxPayable = () => {
    if (form.paymentTarget === 'OldFee') return form.oldFeeLeft
    if (form.paymentTarget === 'TermFee') return form.termFeeLeft
    return 0
  }

  const handleCollectSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.paymentTarget) next.paymentTarget = 'Select what to pay'
    if (!form.totalPaidAmount || Number(form.totalPaidAmount) <= 0) next.totalPaidAmount = 'Enter amount'
    if (Number(form.totalPaidAmount) > maxPayable()) next.totalPaidAmount = `Max ${maxPayable().toFixed(2)}`
    if (!form.paymentMode) next.paymentMode = 'Required'
    const modeNorm = String(form.paymentMode || '').toLowerCase().replace(/\s+/g, '')
    if ((modeNorm === 'qr' || modeNorm === 'qrcode' || modeNorm === 'upi') && !String(form.referenceNo || '').trim()) {
      next.referenceNo = 'Transaction reference required'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    try {
      const payload = {
        studentId: form.studentId,
        sessionId: form.sessionId ? parseInt(form.sessionId, 10) : null,
        paymentTarget: form.paymentTarget,
        paymentDate: new Date().toISOString(),
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo || null,
        notes: form.notes || null,
        totalPaidAmount: parseFloat(form.totalPaidAmount)
      }
      const response = await apiClient.post('/admin/fees/payments', payload)
      if (response.data.success) {
        toast.success(response.data.message || 'Payment recorded')
        setShowModal(false)
        loadPayments(currentPage, pageSize, debouncedSearch, filters)
      } else {
        toast.error(response.data.message || 'Payment failed')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async (row) => {
    const paymentId = row.paymentId || row.PaymentId
    setLoading(true)
    try {
      await printPaymentById(paymentId)
    } catch (error) {
      toast.error(error.message || 'Print failed')
    } finally {
      setLoading(false)
    }
  }

  const paymentCols = useMemo(() => [
    { headerName: 'Receipt No', field: 'receiptNo', valueGetter: (p) => p.data?.receiptNo || p.data?.ReceiptNo },
    { headerName: 'Student', field: 'studentName', valueGetter: (p) => p.data?.studentName || p.data?.StudentName || p.data?.fullName },
    {
      headerName: 'Class',
      field: 'className',
      valueGetter: (p) => {
        const cls = p.data?.className || p.data?.ClassName || ''
        const sec = p.data?.sectionName || p.data?.SectionName || ''
        return sec ? `${cls}(${sec})` : (cls || '—')
      }
    },
    {
      headerName: 'Amount',
      field: 'totalPaidAmount',
      valueGetter: (p) => `₹ ${Number(p.data?.totalPaidAmount ?? p.data?.TotalPaidAmount ?? 0).toFixed(2)}`
    },
    { headerName: 'Payment Mode', field: 'paymentMode', valueGetter: (p) => p.data?.paymentMode || p.data?.PaymentMode },
    {
      headerName: 'Payment Date',
      field: 'paymentDate',
      valueGetter: (p) => {
        const d = p.data?.paymentDate || p.data?.PaymentDate
        return d ? new Date(d).toLocaleDateString() : ''
      }
    },
    { headerName: 'Reference No', field: 'referenceNo', valueGetter: (p) => p.data?.referenceNo || p.data?.ReferenceNo || '' }
  ], [])

  const modeOptions = ['Cash', 'UPI', 'QR']

  const normalizeMode = (m) => String(m || '').toLowerCase().replace(/\s+/g, '')
  const selectedMode = normalizeMode(form.paymentMode)
  const qrMethod = paymentMethods.find((m) => {
    const t = normalizeMode(m.methodType || m.MethodType)
    return t === 'qr' || t === 'qrcode'
  })
  const upiMethod = paymentMethods.find((m) => normalizeMode(m.methodType || m.MethodType) === 'upi')
  const qrImageUrl = qrMethod?.qrImageUrl || qrMethod?.QrImageUrl || ''
  const upiIdValue = upiMethod?.upiId || upiMethod?.UpiId || ''
  const showQrPanel = selectedMode === 'qr' || selectedMode === 'qrcode'
  const showUpiPanel = selectedMode === 'upi'

  const canPickStudent = modalClassId && (modalSections.length === 0 || modalSectionId)
  const studentSelected = form.studentId > 0

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Collect Payment</h1>
          <p className="text-sm text-slate-600">All received payments — collect new payments from the button</p>
        </div>

        <AgGridBox
          title="Payments"
          columnDefs={paymentCols}
          rowData={payments}
          onPrint={handlePrint}
          serverPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
          toolbar={(
            <div className="flex flex-wrap gap-2 items-center w-full">
              <input
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
                placeholder="Search receipt / student / ref..."
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700 w-full sm:w-auto sm:min-w-[180px] flex-1"
              />
              <select
                value={filters.classId}
                onChange={async (e) => {
                  const classId = e.target.value
                  setFilters((f) => ({ ...f, classId, sectionId: '' }))
                  setCurrentPage(1)
                  await loadSections(classId, false)
                }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700 w-full sm:w-auto"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
              </select>
              {filterSections.length > 0 && (
                <select
                  value={filters.sectionId}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, sectionId: e.target.value }))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700 w-full sm:w-auto"
                >
                  <option value="">All Sections</option>
                  {filterSections.map((s) => (
                    <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                  ))}
                </select>
              )}
              <select
                value={filters.paymentMode}
                onChange={(e) => { setFilters((f) => ({ ...f, paymentMode: e.target.value })); setCurrentPage(1) }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700 w-full sm:w-auto"
              >
                <option value="">All Modes</option>
                {modeOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => { setFilters((f) => ({ ...f, fromDate: e.target.value })); setCurrentPage(1) }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700 w-full sm:w-auto"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => { setFilters((f) => ({ ...f, toDate: e.target.value })); setCurrentPage(1) }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700 w-full sm:w-auto"
              />
              <button type="button" onClick={clearFilters} className="px-3 py-1.5 border rounded-lg text-sm w-full sm:w-auto">
                Clear
              </button>
              <button
                type="button"
                onClick={openCollectModal}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm w-full sm:w-auto"
              >
                + Collect Payment
              </button>
            </div>
          )}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50" onClick={() => setStudentDropdownOpen(false)}>
            <div
              className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Collect Payment</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800 text-xl leading-none">&times;</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Class *</label>
                  <select
                    value={modalClassId}
                    onChange={async (e) => {
                      const id = e.target.value
                      setModalClassId(id)
                      setModalSectionId('')
                      clearSelectedStudent()
                      await loadSections(id, true)
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
                  </select>
                </div>
                {modalSections.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Section *</label>
                    <select
                      value={modalSectionId}
                      onChange={(e) => {
                        setModalSectionId(e.target.value)
                        clearSelectedStudent()
                      }}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                    >
                      <option value="">Select Section</option>
                      {modalSections.map((s) => (
                        <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Session</label>
                  <select
                    value={modalSessionId}
                    onChange={(e) => {
                      setModalSessionId(e.target.value)
                      clearSelectedStudent()
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                  >
                    <option value="">Select</option>
                    {sessions.map((s) => <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>)}
                  </select>
                </div>
              </div>

              <div className="relative" ref={studentDropdownRef}>
                <label className="block text-sm font-medium mb-1">Student *</label>
                {!canPickStudent ? (
                  <p className="text-sm text-slate-500 px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-700/40">
                    Select class{modalSections.length > 0 ? ' and section' : ''} first
                  </p>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        value={studentSelected
                          ? `${form.studentName} (${form.admissionNo || '-'})`
                          : studentQuery}
                        onChange={(e) => {
                          if (studentSelected) clearSelectedStudent()
                          setStudentQuery(e.target.value)
                          setStudentDropdownOpen(true)
                        }}
                        onFocus={() => setStudentDropdownOpen(true)}
                        placeholder="Search by name or admission no."
                        className="w-full px-3 py-2 pr-9 border rounded-lg dark:bg-slate-700"
                        autoComplete="off"
                      />
                      {(studentQuery || studentSelected) && (
                        <button
                          type="button"
                          onClick={clearSelectedStudent}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg leading-none"
                          title="Clear"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                    {studentDropdownOpen && !studentSelected && (
                      <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto border rounded-lg bg-white dark:bg-slate-800 shadow-lg">
                        {filteredStudents.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-slate-500">
                            {studentBalances.length === 0 ? 'No students found' : 'No match'}
                          </li>
                        ) : (
                          filteredStudents.map((s) => {
                            const id = s.studentId || s.StudentId
                            return (
                              <li key={id}>
                                <button
                                  type="button"
                                  onClick={() => selectStudent(s)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  {studentLabel(s)}
                                </button>
                              </li>
                            )
                          })
                        )}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {studentSelected && (
                <form onSubmit={handleCollectSubmit} className="space-y-3 border-t pt-4">
                  <p className="text-sm text-slate-600">
                    Yearly: {form.yearlyTotal.toFixed(2)} | Term left: {form.termFeeLeft.toFixed(2)} | Old left: {form.oldFeeLeft.toFixed(2)}
                  </p>
                  {form.oldFeeLeft > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Pay for *</label>
                      <select
                        value={form.paymentTarget}
                        onChange={(e) => setForm((f) => ({ ...f, paymentTarget: e.target.value, totalPaidAmount: '' }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                      >
                        <option value="">Select</option>
                        <option value="TermFee">Term Fee</option>
                        <option value="OldFee">Old Fee</option>
                      </select>
                      {errors.paymentTarget && <p className="text-red-500 text-xs">{errors.paymentTarget}</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Mode</label>
                      <select
                        value={form.paymentMode}
                        onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                      >
                        {modeOptions.map((m) => <option key={m} value={m}>{m === 'QR' ? 'QR Code' : m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount * (max {maxPayable().toFixed(2)})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.totalPaidAmount}
                        onChange={(e) => setForm((f) => ({ ...f, totalPaidAmount: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                        placeholder="Enter payment amount"
                      />
                      {errors.totalPaidAmount && <p className="text-red-500 text-xs">{errors.totalPaidAmount}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {showQrPanel || showUpiPanel ? 'Transaction Reference No *' : 'Reference No'}
                      </label>
                      <input
                        value={form.referenceNo}
                        onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                        placeholder={showQrPanel || showUpiPanel ? 'Enter transaction reference number' : 'Enter reference number'}
                      />
                      {errors.referenceNo && <p className="text-red-500 text-xs">{errors.referenceNo}</p>}
                    </div>
                  </div>

                  {showQrPanel && (
                    <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-700/40 text-center space-y-2">
                      <p className="text-sm font-medium">QR Code</p>
                      {qrImageUrl ? (
                        <>
                          <img
                            src={qrImageUrl}
                            alt="QR Code"
                            className="mx-auto max-h-56 max-w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white"
                          />
                          <p className="text-sm text-slate-600 dark:text-slate-300">Scan this QR code to make payment</p>
                        </>
                      ) : (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          No QR image configured. Add one under Payment Methods.
                        </p>
                      )}
                    </div>
                  )}

                  {showUpiPanel && (
                    <div>
                      <label className="block text-sm font-medium mb-1">UPI ID</label>
                      <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-sky-50 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-medium">
                        {upiIdValue || 'No UPI ID configured — add one under Payment Methods'}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                      rows={2}
                      placeholder="Enter any notes for this payment"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-lg">Collect Payment</button>
                  </div>
                </form>
              )}

              {!studentSelected && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}
