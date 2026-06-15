import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import apiClient from '../Auth/base'

const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'HalfDay']

const STATUS_STYLES = {
  '': 'bg-slate-100 text-slate-400 border-slate-300 italic',
  Present: 'bg-green-100 text-green-800 border-green-300',
  Absent: 'bg-red-100 text-red-800 border-red-300',
  Late: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HalfDay: 'bg-orange-100 text-orange-800 border-orange-300'
}

const STATUS_COLORS = {
  '': 'bg-slate-300',
  Present: 'bg-green-500',
  Absent: 'bg-red-500',
  Late: 'bg-yellow-500',
  HalfDay: 'bg-orange-500'
}

export default function Attendances() {
  const { organizationId } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [noRecords, setNoRecords] = useState(false)
  const gridRef = useRef(null)

  const [form, setForm] = useState({
    attendanceDate: new Date().toISOString().split('T')[0],
    classId: '',
    sectionId: '',
    hasSections: false
  })

  // Load classes on mount
  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        const activeClasses = (response.data.data.classes || []).filter(c => c.isActive !== false)
        setClasses(activeClasses)
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
      toast.error('Failed to load classes')
    }
  }

  const loadSections = async (classId) => {
    try {
      const response = await apiClient.get(`/admin/classes/${classId}/sections`)
      let sectionData = []
      if (Array.isArray(response.data)) {
        sectionData = response.data
      } else if (response.data.success) {
        sectionData = response.data.data || []
      } else {
        sectionData = response.data || []
      }
      const activeSections = sectionData.filter(s => s.isActive !== false)
      setSections(activeSections)
      if (activeSections.length === 0) {
        setForm(prev => ({ ...prev, hasSections: false, sectionId: '' }))
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
      setSections([])
      setForm(prev => ({ ...prev, hasSections: false, sectionId: '' }))
    }
  }

  const handleClassChange = (classId) => {
    const selectedClass = classes.find(c => String(c.classId) === classId)
    const hasSections = selectedClass?.hasSections || false

    setForm(prev => ({
      ...prev,
      classId,
      sectionId: '',
      hasSections
    }))
    setStudents([])
    setStudentsLoaded(false)
    setNoRecords(false)

    if (hasSections) {
      loadSections(classId)
    } else {
      setSections([])
    }
  }

  const validateLoad = () => {
    const errors = []
    if (!form.attendanceDate) errors.push('Attendance Date is required')
    if (!form.classId) errors.push('Class is required')
    if (form.hasSections && !form.sectionId) errors.push('Section is required')
    return errors
  }

  const loadStudents = async () => {
    const validationErrors = validateLoad()
    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.error(err))
      return
    }

    setStudentsLoading(true)
    setNoRecords(false)
    try {
      const params = new URLSearchParams({
        classId: form.classId,
        attendanceDate: form.attendanceDate
      })
      if (form.sectionId) {
        params.append('sectionId', form.sectionId)
      }

      const response = await apiClient.get(`/attendance/students?${params}`)

      let studentData = []
      if (Array.isArray(response.data)) {
        studentData = response.data
      } else if (response.data.success) {
        studentData = response.data.data || []
      } else {
        studentData = response.data || []
      }

      if (studentData.length === 0) {
        setNoRecords(true)
        setStudents([])
      } else {
        const formatted = studentData.map(s => ({
          studentId: s.studentId,
          admissionNo: s.admissionNo || '',
          studentName: s.studentName || '',
          status: s.status || '',
          remarks: s.remarks || ''
        }))
        setStudents(formatted)
      }
      setStudentsLoaded(true)
    } catch (error) {
      console.error('Failed to load students:', error)
      if (error.response?.status === 404) {
        setNoRecords(true)
        setStudents([])
        setStudentsLoaded(true)
      } else {
        toast.error(`Failed to load students: ${error.message}`)
      }
    } finally {
      setStudentsLoading(false)
    }
  }

  const getStudentsFromGrid = () => {
    // Get latest data from grid api for save
    if (!gridRef.current) return students
    const api = gridRef.current?.api
    if (!api) return students
    
    const rows = []
    api.forEachNode(node => rows.push(node.data))
    return rows
  }

  const saveAttendance = async () => {
    const currentStudents = getStudentsFromGrid()
    
    if (currentStudents.length === 0) {
      toast.error('No students to save')
      return
    }

    const missingStatus = currentStudents.some(s => !s.status)
    if (missingStatus) {
      toast.error('Please select attendance status for all students')
      return
    }

    setLoading(true)
    try {
      const payload = {
        attendanceDate: form.attendanceDate,
        classId: parseInt(form.classId),
        sectionId: form.sectionId ? parseInt(form.sectionId) : null,
        students: currentStudents.map(s => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks || ''
        }))
      }

      if (!payload.sectionId) {
        delete payload.sectionId
      }

      const response = await apiClient.post('/attendance/mark', payload)

      const saveSuccess = response.data?.success !== false
      
      if (saveSuccess) {
        toast.success('Attendance saved successfully')
        await loadStudents()
      } else {
        toast.error(response.data?.message || 'Failed to save attendance')
      }
    } catch (error) {
      toast.error(`Network error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Status cell renderer
  const StatusCellRenderer = useCallback((props) => {
    const currentStatus = props.value || ''
    return (
      <div className="flex items-center gap-2 h-full">
        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[currentStatus] || 'bg-slate-300'}`} />
        <select
          className={`w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium ${STATUS_STYLES[currentStatus] || 'bg-slate-100 text-slate-400 italic'}`}
          value={currentStatus}
          onChange={(e) => {
            props.node.setDataValue('status', e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="" disabled className="text-slate-400 italic">-- Select Status --</option>
          {ATTENDANCE_STATUSES.map(status => (
            <option key={status} value={status} className={STATUS_STYLES[status]}>
              {status === 'HalfDay' ? 'Half Day' : status}
            </option>
          ))}
        </select>
      </div>
    )
  }, [])

  // Remarks cell renderer
  const RemarksCellRenderer = useCallback((props) => {
    const [localValue, setLocalValue] = useState(props.value || '')
    const isFocused = useRef(false)
    
    useEffect(() => {
      setLocalValue(props.value || '')
    }, [props.value])

    const handleChange = (e) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      props.node.setDataValue('remarks', newValue)
    }

    return (
      <input
        type="text"
        className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm"
        value={localValue}
        onChange={handleChange}
        onFocus={() => { isFocused.current = true }}
        onBlur={() => { isFocused.current = false }}
        onClick={(e) => e.stopPropagation()}
        placeholder="Optional"
      />
    )
  }, [])

  const columns = useMemo(() => [
    {
      headerName: 'Admission No',
      field: 'admissionNo',
      sortable: true,
      flex: 1,
      minWidth: 120
    },
    {
      headerName: 'Student Name',
      field: 'studentName',
      sortable: true,
      flex: 2,
      minWidth: 200
    },
    {
      headerName: 'Attendance Status',
      field: 'status',
      width: 200,
      sortable: true,
      cellRenderer: StatusCellRenderer
    },
    {
      headerName: 'Remarks',
      field: 'remarks',
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      cellRenderer: RemarksCellRenderer
    }
  ], [StatusCellRenderer, RemarksCellRenderer])

  const canSave = studentsLoaded && students.length > 0 && !loading && !studentsLoading

  return (
    <LoadingOverlay isLoading={loading || studentsLoading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Attendance Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Mark daily attendance for students</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Attendance Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Attendance Date *</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                value={form.attendanceDate}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, attendanceDate: e.target.value }))
                  setStudents([])
                  setStudentsLoaded(false)
                  setNoRecords(false)
                }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Class Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2">Class *</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                value={form.classId}
                onChange={(e) => handleClassChange(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown - Conditional */}
            {form.hasSections && (
              <div>
                <label className="block text-sm font-medium mb-2">Section *</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  value={form.sectionId}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, sectionId: e.target.value }))
                    setStudents([])
                    setStudentsLoaded(false)
                    setNoRecords(false)
                  }}
                >
                  <option value="">Select Section</option>
                  {sections.map(sec => (
                    <option key={sec.sectionId} value={sec.sectionId}>
                      {sec.sectionName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Load Students Button */}
            <div className="flex items-end">
              <button
                onClick={loadStudents}
                disabled={studentsLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                {studentsLoading ? 'Loading...' : 'Load Students'}
              </button>
            </div>
          </div>
        </div>

        {/* Student Grid */}
        {studentsLoaded && (
          <div>
            {noRecords ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No Records Found</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">No students found for the selected criteria</p>
                </div>
              </div>
            ) : students.length > 0 ? (
              <div ref={gridRef}>
                <AgGridBox
                  title={`Students (${students.length})`}
                  columnDefs={columns}
                  rowData={students}
                  showActions={false}
                  pagination={false}
                />
              </div>
            ) : null}

            {/* Save Button */}
            {canSave && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={saveAttendance}
                  disabled={loading}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {loading ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Initial message when no students loaded yet */}
        {!studentsLoaded && !studentsLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No Students Loaded</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Select a date, class{form.hasSections ? ', section' : ''} and click "Load Students" to view attendance</p>
            </div>
          </div>
        )}
      </div>
    </LoadingOverlay>
  )
}