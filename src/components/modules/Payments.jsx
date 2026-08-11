import React, { useState, useEffect, useMemo, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'
import { getSections } from '../Services/adminService'

const emptyFilters = {
  classId: '',
  sectionId: '',
  paymentMode: '',
  fromDate: '',
  toDate: ''
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const searchDebounceRef = useRef(null)

  useEffect(() => {
    loadClasses()
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

  const loadClasses = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        setClasses((response.data.data?.classes || []).filter((c) => c.isActive !== false))
      }
    } catch {
      setClasses([])
    }
  }

  const loadSectionsForClass = async (classId) => {
    if (!classId) {
      setSections([])
      return
    }
    try {
      const res = await getSections(classId)
      setSections(res.success ? (res.data || []) : [])
    } catch {
      setSections([])
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

  const clearFilters = () => {
    setPaymentSearchTerm('')
    setDebouncedSearch('')
    setFilters(emptyFilters)
    setSections([])
    setCurrentPage(1)
  }

  const handlePrint = async (row) => {
    const paymentId = row.paymentId || row.PaymentId
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/payments/${paymentId}`)
      if (!response.data.success) {
        toast.error('Failed to load receipt')
        return
      }

      let orgData = null
      try {
        const orgResponse = await apiClient.get('/admin/org')
        if (orgResponse.data.success) orgData = orgResponse.data.data
      } catch {
        // org details optional for print
      }

      await printReceipt(response.data.data, orgData)
    } catch {
      toast.error('Print failed')
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = async (paymentData, orgData) => {
    const header = paymentData?.header || {}
    const allocations = paymentData?.allocations || []
    const receiptNo = header.receiptNo || header.ReceiptNo || ''
    const paymentTarget = header.paymentTarget || header.PaymentTarget || 'TermFee'
    const paymentDate = header.paymentDate || header.PaymentDate
    const totalPaid = Number(header.totalPaidAmount ?? header.TotalPaidAmount ?? 0)
    const mode = header.paymentMode || header.PaymentMode || ''
    const referenceNo = header.referenceNo || header.ReferenceNo || ''
    const notes = header.notes || header.Notes || ''
    const classLabel = [header.className || header.ClassName, header.sectionName || header.SectionName]
      .filter(Boolean)
      .join(' - ')

    let logoBase64 = ''
    const logoPath = orgData?.logo || orgData?.logoUrl || '/src/assets/logo.svg'
    if (logoPath) {
      if (logoPath.startsWith('data:image/')) {
        logoBase64 = logoPath
      } else {
        try {
          const logoUrl = logoPath.startsWith('http')
            ? logoPath
            : logoPath.startsWith('/')
              ? window.location.origin + logoPath
              : `${window.location.origin}/${logoPath}`
          const response = await fetch(logoUrl)
          const blob = await response.blob()
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
          })
        } catch {
          logoBase64 = logoPath.startsWith('http')
            ? logoPath
            : window.location.origin + (logoPath.startsWith('/') ? logoPath : `/${logoPath}`)
        }
      }
    }

    let sumConfigured = 0
    let sumPaid = 0
    let sumBalance = 0

    const lineRows = allocations.length
      ? allocations.map((a) => {
          const feeType = a.feeTypeName || a.FeeTypeName || (paymentTarget === 'OldFee' ? 'Old Fee' : 'Fee')
          const term = a.termName || a.TermName || ''
          const configured = Number(a.configuredAmount ?? a.ConfiguredAmount ?? a.allocatedAmount ?? a.AllocatedAmount ?? 0)
          const paid = Number(a.paidAmount ?? a.PaidAmount ?? a.allocatedAmount ?? a.AllocatedAmount ?? 0)
          const balance = Number(a.balanceAmount ?? a.BalanceAmount ?? Math.max(configured - paid, 0))
          sumConfigured += configured
          sumPaid += paid
          sumBalance += balance
          return `
            <tr>
              <td>${feeType}${term ? ` (${term})` : ''}</td>
              <td class="amount">₹ ${configured.toFixed(2)}</td>
              <td class="amount"></td>
              <td class="amount"></td>
            </tr>`
        }).join('')
      : (() => {
          sumConfigured = totalPaid
          sumPaid = totalPaid
          sumBalance = 0
          return `
          <tr>
            <td>${paymentTarget === 'OldFee' ? 'Old Fee' : 'Fee Payment'}</td>
            <td class="amount">₹ ${totalPaid.toFixed(2)}</td>
            <td class="amount"></td>
            <td class="amount"></td>
          </tr>`
        })()

    const displayPaid = totalPaid > 0 ? totalPaid : sumPaid
    const totalLabel = paymentTarget === 'OldFee' ? 'TOTAL (Old Fee)' : 'TOTAL (Yearly Fee)'

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Popup blocked. Allow popups to print receipt.')
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .logo { max-height: 80px; max-width: 200px; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          .org-info { text-align: right; }
          .org-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .invoice-title { text-align: center; font-size: 28px; font-weight: bold; margin: 20px 0; color: #1e40af; }
          .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .detail-section h3 { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #374151; }
          .detail-item { margin-bottom: 5px; }
          .detail-label { font-weight: 600; display: inline-block; width: 120px; }
          .fee-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .fee-table th, .fee-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
          .fee-table th { background-color: #f3f4f6; font-weight: 600; }
          .fee-table .amount { text-align: right; }
          .total-row { background-color: #f9fafb; font-weight: bold; }
          .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status-paid { background-color: #dcfce7; color: #166534; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          @media print {
            body { padding: 0; }
            .logo { display: block !important; }
            img { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo">` : ''}
          </div>
          <div class="org-info">
            <div class="org-name">${orgData?.schoolName || orgData?.name || 'School Name'}</div>
            <div>${orgData?.address || ''}</div>
            <div>${[orgData?.phone, orgData?.email].filter(Boolean).join(' | ')}</div>
          </div>
        </div>

        <div class="invoice-title">FEE RECEIPT</div>

        <div class="invoice-details">
          <div class="detail-section">
            <h3>Receipt Details</h3>
            <div class="detail-item"><span class="detail-label">Receipt No:</span> ${receiptNo}</div>
            <div class="detail-item"><span class="detail-label">Payment Date:</span> ${paymentDate ? (() => {
              const d = new Date(paymentDate)
              if (Number.isNaN(d.getTime())) return ''
              const dd = String(d.getDate()).padStart(2, '0')
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              return `${dd}/${mm}/${d.getFullYear()}`
            })() : ''}</div>
            <div class="detail-item"><span class="detail-label">Payment Mode:</span> ${mode}</div>
            <div class="detail-item"><span class="detail-label">Target:</span> ${paymentTarget}</div>
            <div class="detail-item"><span class="detail-label">Status:</span> <span class="status-badge status-paid">Paid</span></div>
            ${referenceNo ? `<div class="detail-item"><span class="detail-label">Reference:</span> ${referenceNo}</div>` : ''}
          </div>
          <div class="detail-section">
            <h3>Student Details</h3>
            <div class="detail-item"><span class="detail-label">Name:</span> ${header.studentName || header.StudentName || ''}</div>
            <div class="detail-item"><span class="detail-label">Admission No:</span> ${header.admissionNo || header.AdmissionNo || ''}</div>
            <div class="detail-item"><span class="detail-label">Class:</span> ${classLabel || '—'}</div>
            <div class="detail-item"><span class="detail-label">Email:</span> ${header.email || header.Email || ''}</div>
            <div class="detail-item"><span class="detail-label">Phone:</span> ${header.phone || header.Phone || ''}</div>
          </div>
        </div>

        <table class="fee-table">
          <thead>
            <tr>
              <th>Fee Type</th>
              <th class="amount">Amount</th>
              <th class="amount">Paid Amount</th>
              <th class="amount">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${lineRows}
            <tr class="total-row">
              <td><strong>${totalLabel}</strong></td>
              <td class="amount"><strong>₹ ${sumConfigured.toFixed(2)}</strong></td>
              <td class="amount"><strong>₹ ${displayPaid.toFixed(2)}</strong></td>
              <td class="amount"><strong>₹ ${sumBalance.toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>

        ${notes ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6;">
            <strong>Notes:</strong> ${notes}
          </div>
        ` : ''}

        <div class="footer">
          <p>This is a computer generated receipt. No signature required.</p>
          <p>Generated on ${(() => {
            const d = new Date()
            const dd = String(d.getDate()).padStart(2, '0')
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const hh = String(d.getHours()).padStart(2, '0')
            const min = String(d.getMinutes()).padStart(2, '0')
            const ss = String(d.getSeconds()).padStart(2, '0')
            return `${dd}/${mm}/${d.getFullYear()}, ${hh}:${min}:${ss}`
          })()}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const paymentCols = useMemo(() => [
    { headerName: 'Receipt', field: 'receiptNo', valueGetter: (p) => p.data?.receiptNo || p.data?.ReceiptNo },
    { headerName: 'Student', field: 'studentName', valueGetter: (p) => p.data?.studentName || p.data?.StudentName || p.data?.fullName },
    { headerName: 'Class', field: 'className', valueGetter: (p) => p.data?.className || p.data?.ClassName || '—' },
    { headerName: 'Section', field: 'sectionName', valueGetter: (p) => p.data?.sectionName || p.data?.SectionName || '—' },
    { headerName: 'Target', field: 'paymentTarget', valueGetter: (p) => p.data?.paymentTarget || p.data?.PaymentTarget || 'TermFee' },
    { headerName: 'Amount', field: 'totalPaidAmount', valueGetter: (p) => Number(p.data?.totalPaidAmount ?? p.data?.TotalPaidAmount ?? 0).toFixed(2) },
    { headerName: 'Mode', field: 'paymentMode', valueGetter: (p) => p.data?.paymentMode || p.data?.PaymentMode },
    {
      headerName: 'Date',
      field: 'paymentDate',
      valueGetter: (p) => {
        const d = p.data?.paymentDate || p.data?.PaymentDate
        return d ? new Date(d).toLocaleDateString() : ''
      }
    }
  ], [])

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-slate-600">View payment history and print receipts</p>
        </div>

        <AgGridBox
          title="Payments & Receipts"
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
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={paymentSearchTerm}
                onChange={(e) => setPaymentSearchTerm(e.target.value)}
                placeholder="Search receipt / student..."
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700"
              />
              <select
                value={filters.classId}
                onChange={async (e) => {
                  const classId = e.target.value
                  setFilters((f) => ({ ...f, classId, sectionId: '' }))
                  setCurrentPage(1)
                  await loadSectionsForClass(classId)
                }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700"
              >
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c.classId} value={c.classId}>{c.className}</option>)}
              </select>
              {sections.length > 0 && (
                <select
                  value={filters.sectionId}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, sectionId: e.target.value }))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700"
                >
                  <option value="">All Sections</option>
                  {sections.map((s) => (
                    <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                  ))}
                </select>
              )}
              <select
                value={filters.paymentMode}
                onChange={(e) => { setFilters((f) => ({ ...f, paymentMode: e.target.value })); setCurrentPage(1) }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700"
              >
                <option value="">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank">Bank</option>
              </select>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => { setFilters((f) => ({ ...f, fromDate: e.target.value })); setCurrentPage(1) }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700"
                title="From date"
              />
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => { setFilters((f) => ({ ...f, toDate: e.target.value })); setCurrentPage(1) }}
                className="px-3 py-1.5 border rounded-lg text-sm dark:bg-slate-700"
                title="To date"
              />
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Clear
              </button>
            </div>
          )}
        />
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}
