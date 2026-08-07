import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'
import { getSections } from '../Services/adminService'

const emptySummary = {
  concessionTotal: 0,
  yearlyFeeTotal: 0,
  termFeePaid: 0,
  termFeeLeft: 0,
  oldFeeTotal: 0,
  oldFeePaid: 0,
  oldFeeLeft: 0,
  schoolFeeTotal: 0,
  schoolFeePaid: 0,
  schoolFeeLeft: 0
}

const pickCurrentSessionId = (sess) => {
  if (!sess?.length) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inRange = sess.find((s) => {
    const start = s.startDate || s.StartDate
    const end = s.endDate || s.EndDate
    if (!start || !end) return false
    const a = new Date(start)
    const b = new Date(end)
    a.setHours(0, 0, 0, 0)
    b.setHours(23, 59, 59, 999)
    return today >= a && today <= b
  })
  if (inRange) return String(inRange.sessionId || inRange.SessionId)
  const active = sess.find((s) => s.isActive === true || s.IsActive === true)
  if (active) return String(active.sessionId || active.SessionId)
  return String(sess[0].sessionId || sess[0].SessionId || '')
}

const money = (v) => Number(v ?? 0).toFixed(2)

const SummaryCard = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <p className="text-lg font-semibold tabular-nums">₹ {money(value)}</p>
  </div>
)

export default function StudentFeeDues() {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [sections, setSections] = useState([])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTitle, setDetailsTitle] = useState('')
  const [payments, setPayments] = useState([])
  const [ready, setReady] = useState(false)
  const [defaultSessionId, setDefaultSessionId] = useState('')
  const searchDebounceRef = useRef(null)

  useEffect(() => {
    loadDropdowns()
  }, [])

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(studentSearch.trim())
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(searchDebounceRef.current)
  }, [studentSearch])

  useEffect(() => {
    if (!ready) return
    loadDues()
  }, [ready, classId, sectionId, sessionId, fromDate, toDate, debouncedSearch, currentPage, pageSize])

  const loadDropdowns = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        setClasses((response.data.data?.classes || []).filter((c) => c.isActive !== false))
        const sess = (response.data.data?.sessions || []).filter((s) => s.isActive !== false)
        setSessions(sess)
        const current = pickCurrentSessionId(sess)
        setDefaultSessionId(current)
        setSessionId(current)
      }
    } catch {
      toast.error('Failed to load filters')
    } finally {
      setReady(true)
    }
  }

  const loadSectionsForClass = async (id) => {
    if (!id) {
      setSections([])
      return
    }
    try {
      const res = await getSections(id)
      setSections(res.success ? (res.data || []) : [])
    } catch {
      setSections([])
    }
  }

  const normalizeSummary = (raw) => {
    if (!raw) return { ...emptySummary }
    return {
      concessionTotal: Number(raw.concessionTotal ?? raw.ConcessionTotal ?? 0),
      yearlyFeeTotal: Number(raw.yearlyFeeTotal ?? raw.YearlyFeeTotal ?? 0),
      termFeePaid: Number(raw.termFeePaid ?? raw.TermFeePaid ?? 0),
      termFeeLeft: Number(raw.termFeeLeft ?? raw.TermFeeLeft ?? 0),
      oldFeeTotal: Number(raw.oldFeeTotal ?? raw.OldFeeTotal ?? 0),
      oldFeePaid: Number(raw.oldFeePaid ?? raw.OldFeePaid ?? 0),
      oldFeeLeft: Number(raw.oldFeeLeft ?? raw.OldFeeLeft ?? 0),
      schoolFeeTotal: Number(raw.schoolFeeTotal ?? raw.SchoolFeeTotal ?? 0),
      schoolFeePaid: Number(raw.schoolFeePaid ?? raw.SchoolFeePaid ?? 0),
      schoolFeeLeft: Number(raw.schoolFeeLeft ?? raw.SchoolFeeLeft ?? 0)
    }
  }

  const loadDues = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(currentPage))
      params.append('size', String(pageSize))
      if (classId) params.append('classId', classId)
      if (sectionId) params.append('sectionId', sectionId)
      if (sessionId) params.append('sessionId', sessionId)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      if (debouncedSearch) params.append('search', debouncedSearch)
      const response = await apiClient.get(`/admin/reports/fees/student-fee-dues?${params}`)
      if (response.data.success) {
        const data = response.data.data
        setRows(data?.dues || data || [])
        setTotalCount(data?.totalCount || data?.dues?.length || 0)
        setSummary(normalizeSummary(data?.summary))
      } else {
        setRows([])
        setTotalCount(0)
        setSummary({ ...emptySummary })
      }
    } catch {
      toast.error('Failed to load dues')
      setRows([])
      setTotalCount(0)
      setSummary({ ...emptySummary })
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setClassId('')
    setSectionId('')
    setSections([])
    setFromDate('')
    setToDate('')
    setStudentSearch('')
    setDebouncedSearch('')
    setSessionId(defaultSessionId || pickCurrentSessionId(sessions))
    setCurrentPage(1)
  }

  const openPaymentDetails = async (row) => {
    const studentId = row.studentId || row.StudentId
    const name = row.studentName || row.StudentName
    setDetailsTitle(name)
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('studentId', studentId)
      if (sessionId) params.append('sessionId', sessionId)
      const response = await apiClient.get(`/admin/reports/fees/student-payment-details?${params}`)
      if (response.data.success) {
        setPayments(response.data.data || [])
        setDetailsOpen(true)
      } else {
        toast.error('No payment details')
      }
    } catch {
      toast.error('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const cols = useMemo(() => [
    { headerName: 'Student', field: 'studentName', valueGetter: (p) => p.data?.studentName || p.data?.StudentName },
    { headerName: 'Admission No', field: 'admissionNo', valueGetter: (p) => p.data?.admissionNo || p.data?.AdmissionNo },
    { headerName: 'Class', field: 'className', valueGetter: (p) => p.data?.className || p.data?.ClassName || '—' },
    { headerName: 'Section', field: 'sectionName', valueGetter: (p) => p.data?.sectionName || p.data?.SectionName || '—' },
    { headerName: 'Yearly Fee', field: 'yearlyFeeTotal', valueGetter: (p) => money(p.data?.yearlyFeeTotal ?? p.data?.YearlyFeeTotal) },
    { headerName: 'Concession', field: 'concessionAmount', valueGetter: (p) => money(p.data?.concessionAmount ?? p.data?.ConcessionAmount) },
    { headerName: 'Fee Left', field: 'termFeeLeft', valueGetter: (p) => money(p.data?.termFeeLeft ?? p.data?.TermFeeLeft) },
    { headerName: 'Old Fee Total', field: 'oldFeeTotal', valueGetter: (p) => money(p.data?.oldFeeTotal ?? p.data?.OldFeeTotal) },
    { headerName: 'Old Fee Left', field: 'oldFeeLeft', valueGetter: (p) => money(p.data?.oldFeeLeft ?? p.data?.OldFeeLeft) },
    {
      headerName: 'Payments',
      field: 'payments',
      cellRenderer: (params) => (
        <button
          type="button"
          className="px-2 py-1 text-xs bg-slate-900 text-white rounded"
          onClick={() => openPaymentDetails(params.data)}
        >
          Payment Details
        </button>
      )
    }
  ], [sessionId])

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Student Fee Dues</h1>
          <p className="text-sm text-slate-600">Current session by default — filter by class, dates, or student</p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Class</label>
            <select
              value={classId}
              onChange={async (e) => {
                const id = e.target.value
                setClassId(id)
                setSectionId('')
                setCurrentPage(1)
                await loadSectionsForClass(id)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            >
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
            </select>
          </div>
          {sections.length > 0 && (
            <div>
              <label className="block text-xs font-medium mb-1">Section</label>
              <select
                value={sectionId}
                onChange={(e) => {
                  setSectionId(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
              >
                <option value="">All</option>
                {sections.map((s) => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1">Session</label>
            <select
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            >
              <option value="">All Sessions</option>
              {sessions.map((s) => <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Student search</label>
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Name / admission no."
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 min-w-[180px]"
            />
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <SummaryCard label="School Total Fee" value={summary.schoolFeeTotal} />
          <SummaryCard label="School Total Paid" value={summary.schoolFeePaid} />
          <SummaryCard label="School Total Left" value={summary.schoolFeeLeft} />
          <SummaryCard label="Concession Total" value={summary.concessionTotal} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Yearly Fee</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard label="Total Amount" value={summary.yearlyFeeTotal} />
            <SummaryCard label="Total Amount Paid" value={summary.termFeePaid} />
            <SummaryCard label="Total Amount Left" value={summary.termFeeLeft} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Old Yearly Fee</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SummaryCard label="Total Amount" value={summary.oldFeeTotal} />
            <SummaryCard label="Total Amount Paid" value={summary.oldFeePaid} />
            <SummaryCard label="Total Amount Left" value={summary.oldFeeLeft} />
          </div>
        </div>

        <AgGridBox
          title="Fee Dues"
          columnDefs={cols}
          rowData={rows}
          serverPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
        />

        {detailsOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payments — {detailsTitle}</h3>
                <button type="button" onClick={() => setDetailsOpen(false)} className="px-3 py-1 border rounded-lg">Close</button>
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-slate-500">No payments found.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Date</th>
                      <th>Receipt</th>
                      <th>Type</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.paymentId || p.PaymentId} className="border-b border-slate-100 dark:border-slate-700">
                        <td className="py-2">{new Date(p.paymentDate || p.PaymentDate).toLocaleDateString()}</td>
                        <td>{p.receiptNo || p.ReceiptNo}</td>
                        <td>{(p.paymentTarget || p.PaymentTarget) === 'OldFee' ? 'Old Fee' : 'Term Fee'}</td>
                        <td className="text-right">{money(p.totalPaidAmount ?? p.TotalPaidAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}
