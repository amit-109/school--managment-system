import React, { useEffect, useMemo, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'
import { getSections } from '../Services/adminService'
import { pickLatestSessionId } from '../utils/sessionUtils'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const emptySummary = {
  paymentsCount: 0,
  totalCollected: 0,
  termCollected: 0,
  oldCollected: 0
}

const defaultFromDate = () => {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().split('T')[0]
}

const todayIso = () => new Date().toISOString().split('T')[0]

const paymentTargetLabel = (v) => (v === 'OldFee' ? 'Old Fee' : 'Term Fee')

export default function DailyCollection() {
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [sessions, setSessions] = useState([])
  const [sections, setSections] = useState([])
  const [classId, setClassId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [defaultSessionId, setDefaultSessionId] = useState('')
  const [dateFrom, setDateFrom] = useState(defaultFromDate)
  const [dateTo, setDateTo] = useState(todayIso)
  const [paymentMode, setPaymentMode] = useState('All')
  const [studentSearch, setStudentSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [ready, setReady] = useState(false)
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
    if (!dateFrom || !dateTo) return
    loadData()
  }, [ready, classId, sectionId, sessionId, dateFrom, dateTo, paymentMode, debouncedSearch, currentPage, pageSize])

  const loadDropdowns = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        setClasses((response.data.data?.classes || []).filter((c) => c.isActive !== false))
        const sess = (response.data.data?.sessions || []).filter((s) => s.isActive !== false)
        setSessions(sess)
        const latest = pickLatestSessionId(sess)
        setDefaultSessionId(latest)
        setSessionId(latest)
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

  const buildParams = ({ includePaging = true } = {}) => {
    const params = new URLSearchParams({
      from: dateFrom,
      to: dateTo
    })
    if (paymentMode !== 'All') params.append('mode', paymentMode)
    if (classId) params.append('classId', classId)
    if (sectionId) params.append('sectionId', sectionId)
    if (sessionId) params.append('sessionId', sessionId)
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (includePaging) {
      params.append('page', String(currentPage))
      params.append('size', String(pageSize))
    }
    return params
  }

  const normalizeSummary = (raw) => {
    if (!raw) return { ...emptySummary }
    return {
      paymentsCount: Number(raw.paymentsCount ?? raw.PaymentsCount ?? 0),
      totalCollected: Number(raw.totalCollected ?? raw.TotalCollected ?? 0),
      termCollected: Number(raw.termCollected ?? raw.TermCollected ?? 0),
      oldCollected: Number(raw.oldCollected ?? raw.OldCollected ?? 0)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/reports/fees/daily?${buildParams()}`)
      if (response.data.success) {
        const data = response.data.data
        setRows(data?.rows || [])
        setTotalCount(data?.totalCount ?? data?.rows?.length ?? 0)
        setSummary(normalizeSummary(data?.summary))
      } else {
        setRows([])
        setTotalCount(0)
        setSummary({ ...emptySummary })
      }
    } catch {
      toast.error('Failed to load daily collection')
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
    setDateFrom(defaultFromDate())
    setDateTo(todayIso())
    setPaymentMode('All')
    setStudentSearch('')
    setDebouncedSearch('')
    setSessionId(defaultSessionId || pickLatestSessionId(sessions))
    setCurrentPage(1)
  }

  const handleExportCSV = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('From and To dates are required')
      return
    }
    setExportLoading(true)
    try {
      const response = await apiClient.get(`/admin/reports/fees/daily/csv/stream?${buildParams({ includePaging: false })}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daily-collection-${dateFrom}-${dateTo}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error exporting CSV')
    } finally {
      setExportLoading(false)
    }
  }

  const cols = useMemo(() => [
    { headerName: 'Receipt No', field: 'receiptNo', valueGetter: (p) => p.data?.receiptNo || p.data?.ReceiptNo || '—' },
    {
      headerName: 'Payment Date',
      field: 'paymentDate',
      valueGetter: (p) => {
        const d = p.data?.paymentDate || p.data?.PaymentDate
        return d ? new Date(d).toLocaleDateString('en-IN') : '—'
      }
    },
    { headerName: 'Student', field: 'studentName', valueGetter: (p) => p.data?.studentName || p.data?.StudentName || '—' },
    { headerName: 'Admission No', field: 'admissionNo', valueGetter: (p) => p.data?.admissionNo || p.data?.AdmissionNo || '—' },
    { headerName: 'Class', field: 'className', valueGetter: (p) => p.data?.className || p.data?.ClassName || '—' },
    { headerName: 'Section', field: 'sectionName', valueGetter: (p) => p.data?.sectionName || p.data?.SectionName || '—' },
    { headerName: 'Payment Mode', field: 'paymentMode', valueGetter: (p) => p.data?.paymentMode || p.data?.PaymentMode || '—' },
    {
      headerName: 'Payment Target',
      field: 'paymentTarget',
      valueGetter: (p) => paymentTargetLabel(p.data?.paymentTarget || p.data?.PaymentTarget)
    },
    {
      headerName: 'Amount',
      field: 'totalPaidAmount',
      valueGetter: (p) => formatCurrency(p.data?.totalPaidAmount ?? p.data?.TotalPaidAmount)
    },
    { headerName: 'Reference No', field: 'referenceNo', valueGetter: (p) => p.data?.referenceNo || p.data?.ReferenceNo || '—' }
  ], [])

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Daily Collection</h1>
            <p className="text-sm text-slate-600">Payment-level detail for the selected filters</p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exportLoading || (!rows.length && !summary.paymentsCount)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium"
          >
            {exportLoading ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">From date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Payment mode</label>
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700"
            >
              {['All', 'Cash', 'UPI', 'QR'].map((mode) => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
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
            <label className="block text-xs font-medium mb-1">Search</label>
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Name / admission / receipt"
              className="px-3 py-2 border rounded-lg text-sm dark:bg-slate-700 min-w-[200px]"
            />
          </div>
          <button type="button" onClick={clearFilters} className="px-4 py-2 border rounded-lg text-sm">
            Clear
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-nowrap gap-6 px-4 py-2.5 min-w-max items-baseline text-sm">
            <div>
              <span className="text-xs text-slate-500 mr-2">Total Collected</span>
              <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.totalCollected)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 mr-2">Payments</span>
              <span className="font-semibold tabular-nums">{summary.paymentsCount.toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 mr-2">Term Fee</span>
              <span className="font-semibold tabular-nums">{formatCurrency(summary.termCollected)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 mr-2">Old Fee</span>
              <span className="font-semibold tabular-nums">{formatCurrency(summary.oldCollected)}</span>
            </div>
          </div>
        </div>

        <AgGridBox
          title="Daily Collection"
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
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}
