import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function Invoices() {
  const { organizationId } = useSelector((state) => state.auth)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoiceDetail, setInvoiceDetail] = useState(null)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/fees/invoices?page=1&size=1000')
      if (response.data.success) {
        setInvoices(response.data.data || [])
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
    }
  ], [])

  const handleView = (data) => {
    setSelectedInvoice(data)
    loadInvoiceDetail(data.InvoiceId)
  }

  const toolbar = (
    <div className="flex gap-2">
      <button
        onClick={loadInvoices}
        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
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
          onView={handleView}
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
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}