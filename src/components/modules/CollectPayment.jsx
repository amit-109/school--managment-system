import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function CollectPayment() {
  const { organizationId } = useSelector((state) => state.auth)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('')
  
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [loadingPaymentMethod, setLoadingPaymentMethod] = useState(false)
  
  const [form, setForm] = useState({
    studentId: 0,
    paymentMode: 'Cash',
    referenceNo: '',
    notes: '',
    totalPaidAmount: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadPayments()
    loadStudents()
    loadPaymentMethods()
  }, [])

  const handlePaymentSearch = (e) => {
    const value = e.target.value
    setPaymentSearchTerm(value)
    loadPayments(value)
  }

  const loadPayments = async (search = '') => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/payments?page=1&size=1000${search ? `&search=${search}` : ''}`)
      if (response.data.success) {
        setPayments(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    try {
      const response = await apiClient.get('/admin/fees/students?page=1&pageSize=1000')
      if (response.data.success) {
        const studentData = response.data.data.data || []
        setStudents(studentData)
        setFilteredStudents(studentData)
      }
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const response = await apiClient.get('/PaymentMethods/methods')
      if (response.data.success) {
        setPaymentMethods(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error)
    }
  }

  const loadSpecificPaymentMethod = async (methodType) => {
    setLoadingPaymentMethod(true)
    try {
      const response = await apiClient.get(`/PaymentMethods/methods/${methodType}`)
      if (response.data.success) {
        setSelectedPaymentMethod(response.data.data)
      }
    } catch (error) {
      console.error(`Failed to load ${methodType} payment method:`, error)
    } finally {
      setLoadingPaymentMethod(false)
    }
  }

  const cols = useMemo(() => [
    { field: 'ReceiptNo', headerName: 'Receipt No' },
    { field: 'StudentName', headerName: 'Student' },
    { field: 'TotalPaidAmount', headerName: 'Amount', valueFormatter: (params) => `₹ ${params.value}` },
    { field: 'PaymentMode', headerName: 'Payment Mode' },
    { field: 'PaymentDate', headerName: 'Payment Date', valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'ReferenceNo', headerName: 'Reference No' },
    { field: 'AllocatedAmount', headerName: 'Allocated', valueFormatter: (params) => `₹ ${params.value || 0}` },
    { field: 'UnallocatedAmount', headerName: 'Unallocated', valueFormatter: (params) => `₹ ${params.value || 0}` }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!form.studentId) newErrors.studentId = 'Student is required'
    if (!form.totalPaidAmount || form.totalPaidAmount <= 0) newErrors.totalPaidAmount = 'Valid amount is required'
    if ((form.paymentMode === 'UPI' || form.paymentMode === 'QR') && !form.referenceNo) {
      newErrors.referenceNo = 'Transaction reference number is required for UPI/QR payments'
    }
    if (form.paymentMode !== 'Cash' && form.paymentMode !== 'UPI' && form.paymentMode !== 'QR' && !form.referenceNo) {
      newErrors.referenceNo = 'Reference number is required for non-cash payments'
    }
    return newErrors
  }

  const resetForm = () => {
    setForm({
      studentId: 0,
      paymentMode: 'Cash',
      referenceNo: '',
      notes: '',
      totalPaidAmount: ''
    })
    setSearchTerm('')
    setFilteredStudents([])
    setSelectedPaymentMethod(null)
    setErrors({})
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const payload = {
        studentId: form.studentId,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo,
        notes: form.notes,
        totalPaidAmount: form.totalPaidAmount
      }

      const response = await apiClient.post('/admin/fees/payments', payload)

      if (response.data.success) {
        const result = response.data.data
        toast.success(`Payment collected successfully! Receipt: ${result.receiptNo}`)
        if (result.unallocated > 0) {
          toast.info(`Unallocated amount: ₹${result.unallocated}`)
        }
        setShowModal(false)
        resetForm()
        loadPayments()
      } else {
        toast.error(response.data.message || 'Failed to collect payment')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toolbar = (
    <div className="flex gap-3 items-center">
      <div className="relative">
        <input
          type="text"
          placeholder="Search payments..."
          value={paymentSearchTerm}
          onChange={handlePaymentSearch}
          className="px-3 py-2 pl-9 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 text-sm w-64"
        />
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <button
        onClick={() => { resetForm(); setShowModal(true) }}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Collect Payment
      </button>
    </div>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Fee Payment Collection</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Collect and manage student fee payments</p>
        </div>

        <AgGridBox
          title="Payments"
          columnDefs={cols}
          rowData={payments}
          toolbar={toolbar}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Collect Payment</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Student *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select student..."
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearchTerm(value)
                        const filtered = students.filter(student => 
                          student.studentName.toLowerCase().includes(value.toLowerCase()) ||
                          student.admissionNo.toLowerCase().includes(value.toLowerCase())
                        )
                        setFilteredStudents(filtered)
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                        errors.studentId ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    {filteredStudents.length > 0 && searchTerm && form.studentId === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredStudents.map(student => (
                          <button
                            key={student.studentId}
                            type="button"
                            onClick={() => {
                              setForm(f => ({...f, studentId: student.studentId}))
                              setSearchTerm(student.studentName)
                              setFilteredStudents([])
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                          >
                            <div className="font-medium">{student.studentName}</div>
                            <div className="text-sm text-slate-500">Admission: {student.admissionNo}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchTerm && filteredStudents.length === 0 && form.studentId === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-3">
                        <p className="text-sm text-slate-500">No students found</p>
                      </div>
                    )}
                  </div>
                  {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
                </div>



                <div>
                  <label className="block text-sm font-medium mb-2">Payment Mode</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => {
                      const mode = e.target.value
                      setForm(f => ({...f, paymentMode: mode, referenceNo: ''}))
                      setErrors({})
                      
                      // Load specific payment method for UPI/QR
                      if (mode === 'UPI') {
                        loadSpecificPaymentMethod('UPI')
                      } else if (mode === 'QR') {
                        loadSpecificPaymentMethod('QR')
                      } else {
                        setSelectedPaymentMethod(null)
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online Transfer</option>
                    <option value="Card">Card Payment</option>
                    <option value="UPI">UPI</option>
                    <option value="QR">QR Code</option>
                  </select>
                </div>

                {/* Show UPI ID for UPI payments */}
                {form.paymentMode === 'UPI' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">UPI ID</label>
                    {loadingPaymentMethod ? (
                      <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                        <span className="text-slate-600 dark:text-slate-400">Loading UPI details...</span>
                      </div>
                    ) : selectedPaymentMethod ? (
                      <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        {selectedPaymentMethod.upiId}
                      </div>
                    ) : (
                      <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-red-500">
                        UPI method not configured
                      </div>
                    )}
                  </div>
                )}

                {/* Show QR Code for QR payments */}
                {form.paymentMode === 'QR' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">QR Code</label>
                    {loadingPaymentMethod ? (
                      <div className="text-center p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                          <span className="text-slate-600 dark:text-slate-400">Loading QR code...</span>
                        </div>
                      </div>
                    ) : selectedPaymentMethod && selectedPaymentMethod.qrImageUrl ? (
                      <div className="text-center p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                        <img
                          src={selectedPaymentMethod.qrImageUrl}
                          alt="QR Code for Payment"
                          className="mx-auto max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg"
                          style={{maxHeight: '300px', maxWidth: '300px'}}
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Scan this QR code to make payment</p>
                      </div>
                    ) : (
                      <div className="text-center p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700">
                        <p className="text-red-500">QR code not configured</p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {form.paymentMode === 'UPI' || form.paymentMode === 'QR' ? 'Transaction Reference No *' : `Reference No ${form.paymentMode !== 'Cash' ? '*' : ''}`}
                  </label>
                  <input
                    type="text"
                    value={form.referenceNo}
                    onChange={(e) => setForm(f => ({...f, referenceNo: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.referenceNo ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder={form.paymentMode === 'UPI' || form.paymentMode === 'QR' ? 'Enter transaction reference number' : 'Enter reference number'}
                    disabled={form.paymentMode === 'Cash'}
                  />
                  {errors.referenceNo && <p className="text-red-500 text-xs mt-1">{errors.referenceNo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalPaidAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm(f => ({...f, totalPaidAmount: value === '' ? '' : parseFloat(value) || 0}));
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.totalPaidAmount ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder="Enter payment amount"
                  />
                  {errors.totalPaidAmount && <p className="text-red-500 text-xs mt-1">{errors.totalPaidAmount}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(f => ({...f, notes: e.target.value}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    rows="3"
                    placeholder="Enter any notes for this payment"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Collect Payment'}
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