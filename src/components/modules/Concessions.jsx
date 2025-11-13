import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function Concessions() {
  const { organizationId } = useSelector((state) => state.auth)
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [concessions, setConcessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [feeTypes, setFeeTypes] = useState([])
  
  const [form, setForm] = useState({
    concessionId: 0,
    studentId: 0,
    feeTypeId: 0,
    discountType: 'Percent',
    discountValue: 0,
    remark: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadStudents()
    loadFeeTypes()
  }, [])

  const loadStudents = async (search = '') => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/students?page=1&pageSize=1000${search ? `&search=${search}` : ''}`)
      if (response.data.success) {
        setStudents(response.data.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const loadConcessions = async (studentId) => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/admin/fees/concessions/${studentId}`)
      if (response.data.success) {
        setConcessions(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load concessions:', error)
      setConcessions([])
    } finally {
      setLoading(false)
    }
  }

  const loadFeeTypes = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        setFeeTypes(response.data.data.feeTypes || [])
      }
    } catch (error) {
      console.error('Failed to load fee types:', error)
    }
  }

  const studentCols = useMemo(() => [
    { field: 'admissionNo', headerName: 'Admission No' },
    { field: 'studentName', headerName: 'Student Name' },
    { field: 'email', headerName: 'Email' },
    { field: 'phone', headerName: 'Phone' },
    { 
      field: 'concessionCount', 
      headerName: 'Concessions',
      cellRenderer: (params) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {params.data.concessionCount || 0}
        </span>
      )
    }
  ], [])

  const concessionCols = useMemo(() => [
    { field: 'FeeTypeName', headerName: 'Fee Type' },
    { field: 'DiscountType', headerName: 'Discount Type' },
    { field: 'DiscountValue', headerName: 'Discount Value', valueFormatter: (params) => 
      `${params.data.DiscountType === 'Percent' ? params.value + '%' : '₹' + params.value}` },
    { field: 'Remark', headerName: 'Remark' },
    { 
      field: 'IsActive', 
      headerName: 'Status',
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], [])

  const validate = () => {
    const newErrors = {}
    if (!selectedStudent) newErrors.studentId = 'Student is required'
    if (!form.feeTypeId) newErrors.feeTypeId = 'Fee type is required'
    if (!form.discountValue || form.discountValue <= 0) newErrors.discountValue = 'Valid discount value is required'
    return newErrors
  }

  const resetForm = () => {
    setForm({
      concessionId: 0,
      studentId: selectedStudent?.studentId || 0,
      feeTypeId: 0,
      discountType: 'Percent',
      discountValue: 0,
      remark: '',
      isActive: true
    })
    setErrors({})
    setEditMode(false)
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const payload = {
        concessionId: editMode ? form.concessionId : 0,
        studentId: selectedStudent.studentId,
        feeTypeId: form.feeTypeId,
        discountType: form.discountType,
        discountValue: form.discountValue,
        remark: form.remark,
        isActive: form.isActive
      }

      const response = await apiClient.post('/admin/fees/concessions', payload)

      if (response.data.success) {
        toast.success(editMode ? 'Concession updated successfully' : 'Concession created successfully')
        setShowModal(false)
        resetForm()
        loadConcessions(selectedStudent.studentId)
      } else {
        toast.error(response.data.message || 'Failed to save concession')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (data) => {
    setForm({
      concessionId: data.ConcessionId,
      studentId: data.StudentId,
      feeTypeId: data.FeeTypeId,
      discountType: data.DiscountType,
      discountValue: data.DiscountValue,
      remark: data.Remark || '',
      isActive: data.IsActive
    })
    setEditMode(true)
    setShowModal(true)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete this concession?`)) {
      setLoading(true)
      try {
        const response = await apiClient.delete(`/admin/fees/concessions/${data.ConcessionId}`)

        if (response.data.success) {
          toast.success('Concession deleted successfully')
          loadConcessions(selectedStudent.studentId)
        } else {
          toast.error(response.data.message || 'Failed to delete concession')
        }
      } catch (error) {
        toast.error(`Network error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    loadStudents(value)
  }

  const handleStudentSelect = (student) => {
    setSelectedStudent(student)
    loadConcessions(student.studentId)
  }

  const handleBackToStudents = () => {
    setSelectedStudent(null)
    setConcessions([])
  }

  const studentToolbar = (
    <div className="relative">
      <input
        type="text"
        placeholder="Search students..."
        value={searchTerm}
        onChange={handleSearch}
        className="px-3 py-2 pl-9 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 text-sm w-64"
      />
      <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  )

  const concessionToolbar = (
    <div className="flex gap-3 items-center">
      <button
        onClick={handleBackToStudents}
        className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Students
      </button>
      <button
        onClick={() => { resetForm(); setShowModal(true) }}
        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Concession
      </button>
    </div>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        {!selectedStudent ? (
          <>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Student Fee Concessions</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Select a student to manage their fee concessions</p>
            </div>

            <AgGridBox
              title="Students"
              columnDefs={studentCols}
              rowData={students}
              toolbar={studentToolbar}
              onView={handleStudentSelect}
              viewTitle="Manage Concessions"
              viewIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Concessions for {selectedStudent.studentName}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Admission No: {selectedStudent.admissionNo} | Email: {selectedStudent.email}
              </p>
            </div>

            <AgGridBox
              title="Concessions"
              columnDefs={concessionCols}
              rowData={concessions}
              toolbar={concessionToolbar}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Concession' : 'Add New Concession'}
                </h3>
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
                  <label className="block text-sm font-medium mb-2">Student</label>
                  <input
                    type="text"
                    value={selectedStudent?.studentName || ''}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fee Type *</label>
                  <select
                    value={form.feeTypeId}
                    onChange={(e) => setForm(f => ({...f, feeTypeId: parseInt(e.target.value) || 0}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.feeTypeId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select Fee Type</option>
                    {feeTypes.map(feeType => (
                      <option key={feeType.feeTypeId} value={feeType.feeTypeId}>
                        {feeType.feeTypeName}
                      </option>
                    ))}
                  </select>
                  {errors.feeTypeId && <p className="text-red-500 text-xs mt-1">{errors.feeTypeId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm(f => ({...f, discountType: e.target.value}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    <option value="Percent">Percent</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Discount Value *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm(f => ({...f, discountValue: parseFloat(e.target.value) || 0}))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                      errors.discountValue ? 'border-red-500' : 'border-slate-300'
                    }`}
                    placeholder={form.discountType === 'Percent' ? 'Enter percentage' : 'Enter amount'}
                  />
                  {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Remark</label>
                  <textarea
                    value={form.remark}
                    onChange={(e) => setForm(f => ({...f, remark: e.target.value}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                    rows="3"
                    placeholder="Enter remark for this concession"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={form.isActive}
                    onChange={(e) => setForm(f => ({...f, isActive: e.target.value === 'true'}))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
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
                  {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
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