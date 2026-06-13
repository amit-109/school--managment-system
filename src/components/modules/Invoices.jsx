import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import SearchBar from '../shared/SearchBar'
import ActionButtons from '../shared/ActionButtons'
import Button from '../shared/Button'
import { useConfirmation } from '../shared/ConfirmationContext'
import apiClient from '../Auth/base'

export default function Invoices() {
  const confirm = useConfirmation()
  const { organizationId } = useSelector((state) => state.auth)
  const [invoices, setInvoices] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetail, setInvoiceDetail] = useState(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateData, setUpdateData] = useState(null)
  const [updateForm, setUpdateForm] = useState({ dueDate: '', notes: '' })
  const [updateErrors, setUpdateErrors] = useState({})

  useEffect(() => {
    loadInvoices(currentPage, pageSize, searchTerm)
  }, [currentPage, pageSize, searchTerm])

  const loadInvoices = async (page = 1, size = 10, search = '') => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/invoices?page=${page}&size=${size}${search ? `&search=${search}` : ''}`)
      if (response.data.success) {
        const responseData = response.data.data;
        const invoiceArray = responseData?.data || responseData?.invoices || [];
        setInvoices(Array.isArray(invoiceArray) ? invoiceArray : []);
        setTotalCount(responseData?.totalCount || invoiceArray?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceDetail = async (invoiceId) => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/invoices/${invoiceId}`)
      if (response.data.success) {
        setInvoiceDetail(response.data.data)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error('Failed to load invoice detail:', error)
      toast.error('Failed to load invoice detail')
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceForUpdate = async (invoiceId) => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/invoices/${invoiceId}`)
      if (response.data.success) {
        const data = response.data.data
        setUpdateData(data)
        setUpdateForm({
          dueDate: data.header?.dueDate ? new Date(data.header.dueDate).toISOString().split('T')[0] : '',
          notes: ''
        })
        setUpdateErrors({})
        setShowUpdateModal(true)
      }
    } catch (error) {
      console.error('Failed to load invoice for update:', error)
      toast.error('Failed to load invoice details')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubmit = async () => {
    // Validate notes
    const errors = {}
    if (!updateForm.notes.trim()) {
      errors.notes = 'Please enter update reason.'
    }
    setUpdateErrors(errors)
    if (Object.keys(errors).length > 0) return

    const confirmed = await confirm({
      title: 'Update Invoice',
      message: 'Updating this invoice will refresh fee structure and concession calculations.',
      detail: 'Existing payments and payment allocations will remain unchanged.',
      confirmLabel: 'Update',
      variant: 'warning'
    })

    if (!confirmed) return

    setLoading(true)
    try {
      const payload = {
        notes: updateForm.notes.trim()
      }
      if (updateForm.dueDate) {
        payload.dueDate = updateForm.dueDate
      }

      const response = await apiClient.put(`/admin/fees/invoices/${updateData.header?.invoiceId}`, payload)
      if (response.data.success) {
        toast.success('Invoice updated successfully. Latest fee structure and concession rules have been applied.')
        setShowUpdateModal(false)
        setUpdateData(null)
        loadInvoices(currentPage, pageSize, searchTerm)
      } else {
        toast.error(response.data.message || 'Failed to update invoice')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update invoice'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (data) => {
    const confirmed = await confirm({
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice ${data.InvoiceNo}?`,
      detail: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    })

    if (!confirmed) return

    setLoading(true)
    try {
      const response = await apiClient.delete(`/admin/fees/invoices/${data.InvoiceId}`)
      if (response.data.success) {
        toast.success(`Invoice ${data.InvoiceNo} deleted successfully.`)
        loadInvoices(currentPage, pageSize, searchTerm)
      } else {
        toast.error(response.data.message || 'Failed to delete invoice')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete invoice'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const cols = useMemo(() => [
    { field: 'InvoiceNo', headerName: 'Invoice No' },
    { field: 'StudentName', headerName: 'Student' },
    { field: 'TotalAmount', headerName: 'Total Amount', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'TotalDiscount', headerName: 'Discount', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'NetPayable', headerName: 'Net Payable', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'PaidAmount', headerName: 'Paid Amount', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'BalanceAmount', headerName: 'Balance', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'InvoiceDate', headerName: 'Invoice Date', valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'DueDate', headerName: 'Due Date', valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { 
      field: 'Status', 
      headerName: 'Status',
      cellRenderer: (params) => {
        const statusColors = {
          'Paid': 'bg-green-100 text-green-800',
          'PartiallyPaid': 'bg-yellow-100 text-yellow-800',
          'Pending': 'bg-red-100 text-red-800'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${statusColors[params.value] || 'bg-gray-100 text-gray-800'}`}>
            {params.value}
          </span>
        )
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 200,
      minWidth: 200,
      maxWidth: 220,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params) => {
        const isEditable = (params.data?.Status === 'Pending' || params.data?.Status === 'PartiallyPaid');
        const isDeletable = (params.data?.Status === 'Pending' && (params.data?.PaidAmount === 0 || params.data?.PaidAmount === 0.0));
        return (
          <ActionButtons
            data={params.data}
            onView={(invoice) => handleView(invoice)}
            onEdit={isEditable ? (invoice) => handleEdit(invoice) : undefined}
            onPrint={(invoice) => handlePrint(invoice)}
            onDelete={isDeletable ? (invoice) => handleDelete(invoice) : undefined}
            viewTitle="View Invoice"
          />
        );
      },
      cellClass: 'flex items-center justify-center',
      headerClass: 'text-center'
    }
  ], [])

  const handleView = (data) => {
    setSelectedInvoice(data)
    loadInvoiceDetail(data.InvoiceId)
  }

  const handleEdit = (data) => {
    loadInvoiceForUpdate(data.InvoiceId)
  }

  const handlePrint = async (data) => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/invoices/${data.InvoiceId}`)
      if (response.data.success) {
        const invoiceData = response.data.data
        
        // Get organization details if not available
        let orgData = null
        try {
          const orgResponse = await apiClient.get('/admin/org')
          if (orgResponse.data.success) {
            orgData = orgResponse.data.data
          }
        } catch (error) {
          console.log('Could not fetch organization data')
        }
        
        await printInvoice(invoiceData, orgData)
      }
    } catch (error) {
      console.error('Failed to load invoice for printing:', error)
      toast.error('Failed to load invoice for printing')
    } finally {
      setLoading(false)
    }
  }

  const printInvoice = async (invoiceData, orgData) => {
    let logoBase64 = ''
    const logoPath = orgData?.logo || orgData?.logoUrl || '/src/assets/logo.svg'
    
    if (logoPath) {
      // Check if logo is already Base64
      if (logoPath.startsWith('data:image/')) {
        logoBase64 = logoPath
      } else {
        // Convert URL/path to base64
        try {
          const logoUrl = logoPath.startsWith('http') ? logoPath : 
                         logoPath.startsWith('/') ? window.location.origin + logoPath :
                         window.location.origin + '/' + logoPath
          
          const response = await fetch(logoUrl)
          const blob = await response.blob()
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.log('Could not convert logo to base64:', error)
          logoBase64 = logoPath.startsWith('http') ? logoPath : 
                      window.location.origin + (logoPath.startsWith('/') ? logoPath : '/' + logoPath)
        }
      }
    }
    
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoiceData.header?.invoiceNo}</title>
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
          .status-partial { background-color: #fef3c7; color: #92400e; }
          .status-pending { background-color: #fee2e2; color: #991b1b; }
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
            <div>${orgData?.phone || ''} | ${orgData?.email || ''}</div>
          </div>
        </div>
        
        <div class="invoice-title">FEE INVOICE</div>
        
        <div class="invoice-details">
          <div class="detail-section">
            <h3>Invoice Details</h3>
            <div class="detail-item"><span class="detail-label">Invoice No:</span> ${invoiceData.header?.invoiceNo || ''}</div>
            <div class="detail-item"><span class="detail-label">Invoice Date:</span> ${invoiceData.header?.invoiceDate ? new Date(invoiceData.header.invoiceDate).toLocaleDateString() : ''}</div>
            <div class="detail-item"><span class="detail-label">Due Date:</span> ${invoiceData.header?.dueDate ? new Date(invoiceData.header.dueDate).toLocaleDateString() : ''}</div>
            <div class="detail-item"><span class="detail-label">Status:</span> <span class="status-badge status-${invoiceData.header?.status?.toLowerCase()}">${invoiceData.header?.status || ''}</span></div>
          </div>
          <div class="detail-section">
            <h3>Student Details</h3>
            <div class="detail-item"><span class="detail-label">Name:</span> ${invoiceData.header?.studentName || ''}</div>
            <div class="detail-item"><span class="detail-label">Admission No:</span> ${invoiceData.header?.admissionNo || ''}</div>
            ${invoiceData.header?.className ? `<div class="detail-item"><span class="detail-label">Class:</span> ${invoiceData.header.className}</div>` : ''}
            <div class="detail-item"><span class="detail-label">Email:</span> ${invoiceData.header?.email || ''}</div>
            <div class="detail-item"><span class="detail-label">Phone:</span> ${invoiceData.header?.phone || ''}</div>
          </div>
        </div>
        
        <table class="fee-table">
          <thead>
            <tr>
              <th>Fee Type</th>
              <th class="amount">Amount</th>
              ${invoiceData.header?.totalDiscount > 0 ? '<th class="amount">Discount</th>' : ''}
              ${invoiceData.header?.totalDiscount > 0 ? '<th class="amount">Net Amount</th>' : ''}
              <th class="amount">Paid Amount</th>
              <th class="amount">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items?.map(item => `
              <tr>
                <td>${item.feeTypeName}</td>
                <td class="amount">₹ ${item.amount}</td>
                ${invoiceData.header?.totalDiscount > 0 ? `<td class="amount">₹ ${item.discountAmount || 0}</td>` : ''}
                ${invoiceData.header?.totalDiscount > 0 ? `<td class="amount">₹ ${item.netAmount}</td>` : ''}
                <td class="amount">₹ ${item.paidAmount}</td>
                <td class="amount">₹ ${(item.netAmount || item.amount) - item.paidAmount}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td class="amount"><strong>₹ ${invoiceData.header?.totalAmount || 0}</strong></td>
              ${invoiceData.header?.totalDiscount > 0 ? `<td class="amount"><strong>₹ ${invoiceData.header?.totalDiscount || 0}</strong></td>` : ''}
              ${invoiceData.header?.totalDiscount > 0 ? `<td class="amount"><strong>₹ ${invoiceData.header?.netPayable || 0}</strong></td>` : ''}
              <td class="amount"><strong>₹ ${invoiceData.header?.paidAmount || 0}</strong></td>
              <td class="amount"><strong>₹ ${invoiceData.header?.balanceAmount || 0}</strong></td>
            </tr>
          </tbody>
        </table>
        
        ${invoiceData.header?.notes ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #3b82f6;">
            <strong>Notes:</strong> ${invoiceData.header.notes}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>This is a computer generated invoice. No signature required.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
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

  const toolbar = (
    <div className="toolbar-row">
      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={(query) => {
          setSearchTerm(query)
          setCurrentPage(1)
        }}
        onClear={() => {
          setSearchInput('')
          setSearchTerm('')
          setCurrentPage(1)
        }}
        placeholder="Search by Invoice No, Student Name"
      />
    </div>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Fee Invoices</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">View and manage student fee invoices</p>
        </div>

        <AgGridBox
          title="Invoices"
          columnDefs={cols}
          rowData={invoices}
          toolbar={toolbar}
          showActions={false}
          serverPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalCount}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
        />

        {/* Invoice Detail Modal */}
        {showDetailModal && invoiceDetail && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Invoice Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Invoice Header */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Invoice No</p>
                    <p className="font-semibold">{invoiceDetail.header?.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Student</p>
                    <p className="font-semibold">{invoiceDetail.header?.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Admission No</p>
                    <p className="font-semibold">{invoiceDetail.header?.admissionNo}</p>
                  </div>
                  {invoiceDetail.header?.className && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Class</p>
                      <p className="font-semibold">{invoiceDetail.header.className}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invoiceDetail.header?.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      invoiceDetail.header?.status === 'PartiallyPaid' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoiceDetail.header?.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Invoice Date</p>
                    <p className="font-semibold">{invoiceDetail.header?.invoiceDate ? new Date(invoiceDetail.header.invoiceDate).toLocaleDateString() : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Due Date</p>
                    <p className="font-semibold">{invoiceDetail.header?.dueDate ? new Date(invoiceDetail.header.dueDate).toLocaleDateString() : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                    <p className="font-semibold">{invoiceDetail.header?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                    <p className="font-semibold">{invoiceDetail.header?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Fee Items */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3">Fee Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 dark:border-slate-600 rounded-lg">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium">Fee Type</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
                        {invoiceDetail.header?.totalDiscount > 0 && (
                          <th className="px-4 py-2 text-right text-sm font-medium">Discount</th>
                        )}
                        {invoiceDetail.header?.totalDiscount > 0 && (
                          <th className="px-4 py-2 text-right text-sm font-medium">Net Amount</th>
                        )}
                        <th className="px-4 py-2 text-right text-sm font-medium">Paid Amount</th>
                        <th className="px-4 py-2 text-right text-sm font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetail.items?.map((item, index) => (
                        <tr key={index} className="border-t border-slate-200 dark:border-slate-600">
                          <td className="px-4 py-2">{item.feeTypeName}</td>
                          <td className="px-4 py-2 text-right">₹ {item.amount}</td>
                          {invoiceDetail.header?.totalDiscount > 0 && (
                            <td className="px-4 py-2 text-right">₹ {item.discountAmount || 0}</td>
                          )}
                          {invoiceDetail.header?.totalDiscount > 0 && (
                            <td className="px-4 py-2 text-right">₹ {item.netAmount}</td>
                          )}
                          <td className="px-4 py-2 text-right">₹ {item.paidAmount}</td>
                          <td className="px-4 py-2 text-right">₹ {(item.netAmount || item.amount) - item.paidAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-700 font-semibold">
                      <tr>
                        <td className="px-4 py-2">Total</td>
                        <td className="px-4 py-2 text-right">₹ {invoiceDetail.header?.totalAmount}</td>
                        {invoiceDetail.header?.totalDiscount > 0 && (
                          <td className="px-4 py-2 text-right">₹ {invoiceDetail.header?.totalDiscount}</td>
                        )}
                        {invoiceDetail.header?.totalDiscount > 0 && (
                          <td className="px-4 py-2 text-right">₹ {invoiceDetail.header?.netPayable}</td>
                        )}
                        <td className="px-4 py-2 text-right">₹ {invoiceDetail.header?.paidAmount}</td>
                        <td className="px-4 py-2 text-right">₹ {invoiceDetail.header?.balanceAmount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Allocations */}
              {invoiceDetail.allocations?.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3">Payment History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-slate-200 dark:border-slate-600 rounded-lg">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Receipt No</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Allocated Amount</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Payment Date</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Payment Mode</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Reference No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetail.allocations.map((allocation, index) => (
                          <tr key={index} className="border-t border-slate-200 dark:border-slate-600">
                            <td className="px-4 py-2">{allocation.receiptNo}</td>
                            <td className="px-4 py-2 text-right">₹ {allocation.allocatedAmount}</td>
                            <td className="px-4 py-2">{new Date(allocation.paymentDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">{allocation.paymentMode}</td>
                            <td className="px-4 py-2">{allocation.referenceNo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {invoiceDetail.header?.notes && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Notes:</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{invoiceDetail.header.notes}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Invoice Modal */}
        {showUpdateModal && updateData && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Update Invoice</h3>
                <button
                  onClick={() => { setShowUpdateModal(false); setUpdateData(null) }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Information Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Updating an invoice will automatically recalculate all invoice items using the latest Fee Structure and Student Concession settings configured in the system. Any changes made to fee amounts, fee components, or concessions after the invoice was originally generated will be reflected in the updated invoice. Existing payments and payment allocations will remain unchanged.
                  </p>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Invoice totals may change after update if the Fee Structure or Student Concession has been modified since the invoice was generated.
                  </p>
                </div>
              </div>

              {/* Non-Editable Invoice Info */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Invoice Number</p>
                    <p className="font-semibold text-sm">{updateData.header?.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Student</p>
                    <p className="font-semibold text-sm">{updateData.header?.studentName}</p>
                  </div>
                  {updateData.header?.className && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Class</p>
                      <p className="font-semibold text-sm">{updateData.header.className}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Net Payable</p>
                    <p className="font-semibold text-sm">₹ {updateData.header?.netPayable}</p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="field-label">
                    Due Date <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={updateForm.dueDate}
                    onChange={(e) => setUpdateForm({...updateForm, dueDate: e.target.value})}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="field-label">
                    Update Reason / Notes <span className="required-mark">*</span>
                  </label>
                  <textarea
                    value={updateForm.notes}
                    onChange={(e) => {
                      setUpdateForm({...updateForm, notes: e.target.value})
                      if (updateErrors.notes) {
                        setUpdateErrors({...updateErrors, notes: ''})
                      }
                    }}
                    rows={3}
                    placeholder="Enter reason for updating this invoice..."
                    className={`form-control ${updateErrors.notes ? 'is-invalid' : ''}`}
                  />
                  {updateErrors.notes && (
                    <p className="field-error">{updateErrors.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={handleUpdateSubmit}
                  className="flex-1"
                  disabled={loading}
                  icon={(
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                >
                  {loading ? 'Updating...' : 'Update Invoice'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => { setShowUpdateModal(false); setUpdateData(null) }}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadingOverlay>
  )
}
