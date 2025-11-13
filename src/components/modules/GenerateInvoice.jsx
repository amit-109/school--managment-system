import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import toast, { Toaster } from 'react-hot-toast'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

export default function GenerateInvoice() {
  const { organizationId } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [terms, setTerms] = useState([])
  const [sessions, setSessions] = useState([])
  
  const [form, setForm] = useState({
    studentId: 0,
    classId: 0,
    termId: 0,
    sessionId: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadDropdownData()
  }, [])

  const loadDropdownData = async () => {
    try {
      const [studentsRes, dropdownsRes] = await Promise.all([
        apiClient.get('/admin/fees/students?page=1&pageSize=1000'),
        apiClient.get('/admin/fees/dropdowns')
      ])
      
      if (studentsRes.data.success) {
        const studentData = studentsRes.data.data.data || []
        setStudents(studentData)
        setFilteredStudents(studentData)
      }
      
      if (dropdownsRes.data.success) {
        const data = dropdownsRes.data.data
        setClasses(data.classes || [])
        setTerms(data.terms || [])
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.studentId) newErrors.studentId = 'Student is required'
    if (!form.classId) newErrors.classId = 'Class is required'
    if (!form.termId) newErrors.termId = 'Term is required'
    if (!form.sessionId) newErrors.sessionId = 'Session is required'
    if (!form.invoiceDate) newErrors.invoiceDate = 'Invoice date is required'
    if (!form.dueDate) newErrors.dueDate = 'Due date is required'
    return newErrors
  }

  const resetForm = () => {
    setForm({
      studentId: 0,
      classId: 0,
      termId: 0,
      sessionId: 0,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: ''
    })
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
        classId: form.classId,
        termId: form.termId,
        sessionId: form.sessionId,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        notes: form.notes
      }

      const response = await apiClient.post('/admin/fees/invoices/generate', payload)

      if (response.data.success) {
        toast.success('Invoice generated successfully')
        resetForm()
      } else {
        toast.error(response.data.message || 'Failed to generate invoice')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Generate Invoice</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Create fee invoices for students</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
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
                {searchTerm && filteredStudents.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStudents.map(student => (
                      <button
                        key={student.userId}
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
              </div>
              {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Class *</label>
              <select
                value={form.classId}
                onChange={(e) => setForm(f => ({...f, classId: parseInt(e.target.value) || 0}))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.classId ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className}
                  </option>
                ))}
              </select>
              {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Term *</label>
              <select
                value={form.termId}
                onChange={(e) => setForm(f => ({...f, termId: parseInt(e.target.value) || 0}))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.termId ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.termId} value={term.termId}>
                    {term.termName}
                  </option>
                ))}
              </select>
              {errors.termId && <p className="text-red-500 text-xs mt-1">{errors.termId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session *</label>
              <select
                value={form.sessionId}
                onChange={(e) => setForm(f => ({...f, sessionId: parseInt(e.target.value) || 0}))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.sessionId ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">Select Session</option>
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
              {errors.sessionId && <p className="text-red-500 text-xs mt-1">{errors.sessionId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Invoice Date *</label>
              <input
                type="date"
                value={form.invoiceDate}
                onChange={(e) => setForm(f => ({...f, invoiceDate: e.target.value}))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.invoiceDate ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.invoiceDate && <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({...f, dueDate: e.target.value}))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 ${
                  errors.dueDate ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm(f => ({...f, notes: e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700"
                rows="3"
                placeholder="Enter any notes for this invoice"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </LoadingOverlay>
  )
}