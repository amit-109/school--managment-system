import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import apiClient from '../Auth/base'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'

const ATTENDANCE_STATUSES = ['Present', 'Absent', 'Late', 'HalfDay']

const STATUS_STYLES = {
  Present: 'bg-green-100 text-green-800 border-green-300',
  Absent: 'bg-red-100 text-red-800 border-red-300',
  Late: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HalfDay: 'bg-orange-100 text-orange-800 border-orange-300'
}

// Monthly Register attendance cell styles
const REGISTER_CELL_STYLES = {
  P: 'bg-green-100 text-green-700 font-bold',
  A: 'bg-red-100 text-red-700 font-bold',
  L: 'bg-orange-100 text-orange-700 font-bold',
  H: 'bg-blue-100 text-blue-700 font-bold',
  '*': 'bg-slate-100 text-slate-400'
}

const REGISTER_LABELS = {
  P: 'P',
  A: 'A',
  L: 'L',
  H: 'H'
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0] || dateStr
}

const getDaysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate()
}

const ATTENDANCE_SHORT = {
  Present: 'P',
  Absent: 'A',
  Late: 'L',
  HalfDay: 'H'
}

export default function AttendanceReports() {
  const { organizationId } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [orgData, setOrgData] = useState(null)
  const [activeTab, setActiveTab] = useState('daily')

  // Common dropdowns
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])

  // ---------------------- TAB 1: Daily Attendance Report ----------------------
  const [dailyFilters, setDailyFilters] = useState({
    attendanceDate: new Date().toISOString().split('T')[0],
    classId: '',
    sectionId: '',
    hasSections: false,
    status: ''
  })
  const [dailyData, setDailyData] = useState([])
  const [dailyLoaded, setDailyLoaded] = useState(false)
  const [dailyNoRecords, setDailyNoRecords] = useState(false)
  const [dailySearchInput, setDailySearchInput] = useState('')
  const [dailySearchTerm, setDailySearchTerm] = useState('')
  const [filteredDailyData, setFilteredDailyData] = useState([])

  // ---------------------- TAB 2: Student Attendance History ----------------------
  const [studentFilters, setStudentFilters] = useState({
    studentId: '',
    fromDate: '',
    toDate: ''
  })
  const [studentHistory, setStudentHistory] = useState([])
  const [studentHistoryLoaded, setStudentHistoryLoaded] = useState(false)
  const [studentHistoryNoRecords, setStudentHistoryNoRecords] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [filteredStudents, setFilteredStudents] = useState([])
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false)
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null)
  const [summaryCards, setSummaryCards] = useState({
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    halfDays: 0,
    attendancePercent: 0
  })

  // ---------------------- TAB 3: Class Attendance Summary ----------------------
  const [classSummaryFilters, setClassSummaryFilters] = useState({
    classId: '',
    sectionId: '',
    hasSections: false,
    month: new Date().getMonth() + 1,
    year: currentYear
  })
  const [classSummaryData, setClassSummaryData] = useState([])
  const [classSummaryLoaded, setClassSummaryLoaded] = useState(false)
  const [classSummaryNoRecords, setClassSummaryNoRecords] = useState(false)
  const [classSummarySearchInput, setClassSummarySearchInput] = useState('')
  const [classSummarySearchTerm, setClassSummarySearchTerm] = useState('')
  const [filteredClassSummaryData, setFilteredClassSummaryData] = useState([])

  // ---------------------- TAB 4: Monthly Register ----------------------
  const [registerFilters, setRegisterFilters] = useState({
    classId: '',
    sectionId: '',
    hasSections: false,
    month: new Date().getMonth() + 1,
    year: currentYear
  })
  const [registerData, setRegisterData] = useState([])
  const [registerLoaded, setRegisterLoaded] = useState(false)
  const [registerNoRecords, setRegisterNoRecords] = useState(false)
  const [registerSearchTerm, setRegisterSearchTerm] = useState('')
  const [registerSummary, setRegisterSummary] = useState({
    totalStudents: 0,
    presentRecords: 0,
    absentRecords: 0,
    lateRecords: 0,
    halfDayRecords: 0
  })
  const registerTableRef = useRef(null)

  // Load classes and org data on mount
  useEffect(() => {
    loadClasses()
    loadStudents()
    loadOrgData()
  }, [])

  // Process register data whenever registerData changes
  const processedRegisterRows = useMemo(() => {
    if (!registerData.length) return []

    // Group by studentId
    const studentMap = {}
    registerData.forEach(record => {
      const sid = record.studentId
      if (!studentMap[sid]) {
        studentMap[sid] = {
          studentId: sid,
          admissionNo: record.admissionNo || '',
          studentName: record.studentName || '',
          days: {}
        }
      }
      const shortStatus = ATTENDANCE_SHORT[record.attendanceStatus] || record.attendanceStatus || '*'
      studentMap[sid].days[record.dayNo] = shortStatus
    })

    const daysInMonth = getDaysInMonth(registerFilters.month, registerFilters.year)
    
    // Fill in missing days with '*'
    Object.values(studentMap).forEach(student => {
      for (let d = 1; d <= daysInMonth; d++) {
        if (!student.days[d]) {
          student.days[d] = '*'
        }
      }
    })

    let rows = Object.values(studentMap)

    // Apply client-side search
    if (registerSearchTerm) {
      const lower = registerSearchTerm.toLowerCase()
      rows = rows.filter(row =>
        (row.studentName || '').toLowerCase().includes(lower) ||
        (row.admissionNo || '').toLowerCase().includes(lower)
      )
    }

    return rows
  }, [registerData, registerSearchTerm, registerFilters.month, registerFilters.year])

  // Calculate register summary
  const registerSummaryData = useMemo(() => {
    if (!registerData.length) return { totalStudents: 0, presentRecords: 0, absentRecords: 0, lateRecords: 0, halfDayRecords: 0 }

    const uniqueStudents = new Set(registerData.map(r => r.studentId)).size
    let present = 0, absent = 0, late = 0, halfDay = 0

    registerData.forEach(r => {
      const status = r.attendanceStatus
      if (status === 'Present') present++
      else if (status === 'Absent') absent++
      else if (status === 'Late') late++
      else if (status === 'HalfDay') halfDay++
    })

    return {
      totalStudents: uniqueStudents,
      presentRecords: present,
      absentRecords: absent,
      lateRecords: late,
      halfDayRecords: halfDay
    }
  }, [registerData])

  const daysInMonth = useMemo(() => {
    return getDaysInMonth(registerFilters.month, registerFilters.year)
  }, [registerFilters.month, registerFilters.year])

  // Filter daily data on search term change
  useEffect(() => {
    if (!dailySearchTerm) {
      setFilteredDailyData(dailyData)
      return
    }
    const lower = dailySearchTerm.toLowerCase()
    setFilteredDailyData(
      dailyData.filter(row =>
        (row.admissionNo || '').toLowerCase().includes(lower) ||
        (row.studentName || '').toLowerCase().includes(lower) ||
        (row.className || '').toLowerCase().includes(lower) ||
        (row.sectionName || '').toLowerCase().includes(lower) ||
        (row.status || '').toLowerCase().includes(lower)
      )
    )
  }, [dailySearchTerm, dailyData])

  // Filter class summary data on search term change
  useEffect(() => {
    if (!classSummarySearchTerm) {
      setFilteredClassSummaryData(classSummaryData)
      return
    }
    const lower = classSummarySearchTerm.toLowerCase()
    setFilteredClassSummaryData(
      classSummaryData.filter(row =>
        (row.studentName || '').toLowerCase().includes(lower)
      )
    )
  }, [classSummarySearchTerm, classSummaryData])

  // Filter student list for dropdown
  useEffect(() => {
    if (!studentSearchTerm) {
      setFilteredStudents(students)
      return
    }
    const lower = studentSearchTerm.toLowerCase()
    setFilteredStudents(
      students.filter(s =>
        (s.studentName || '').toLowerCase().includes(lower) ||
        (s.admissionNo || '').toLowerCase().includes(lower)
      )
    )
  }, [studentSearchTerm, students])

  const loadOrgData = async () => {
    try {
      const response = await apiClient.get('/admin/org')
      if (response.data.success) {
        setOrgData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load org data:', error)
    }
  }

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
      // Reset sections in all tabs
      setDailyFilters(prev => ({ ...prev, hasSections: activeSections.length > 0, sectionId: '' }))
      setClassSummaryFilters(prev => ({ ...prev, hasSections: activeSections.length > 0, sectionId: '' }))
      setRegisterFilters(prev => ({ ...prev, hasSections: activeSections.length > 0, sectionId: '' }))
      if (activeSections.length === 0) {
        setDailyFilters(prev => ({ ...prev, hasSections: false, sectionId: '' }))
        setClassSummaryFilters(prev => ({ ...prev, hasSections: false, sectionId: '' }))
        setRegisterFilters(prev => ({ ...prev, hasSections: false, sectionId: '' }))
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
      setSections([])
      setDailyFilters(prev => ({ ...prev, hasSections: false, sectionId: '' }))
      setClassSummaryFilters(prev => ({ ...prev, hasSections: false, sectionId: '' }))
      setRegisterFilters(prev => ({ ...prev, hasSections: false, sectionId: '' }))
    }
  }

  const loadStudents = async () => {
    try {
      const response = await apiClient.get('/admin/fees/students')
      if (response.data.success) {
        const studentData = response.data.data.data || []
        setStudents(studentData)
        setFilteredStudents(studentData)
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  // ========== TAB 1 HANDLERS ==========
  const handleDailyClassChange = (classId) => {
    const selectedClass = classes.find(c => String(c.classId) === classId)
    const hasSections = selectedClass?.hasSections || false
    setDailyFilters(prev => ({
      ...prev,
      classId,
      sectionId: '',
      hasSections
    }))
    setDailyLoaded(false)
    setDailyNoRecords(false)
    if (hasSections) {
      loadSections(classId)
    } else {
      setSections([])
    }
  }

  const searchDailyAttendance = async () => {
    if (!dailyFilters.attendanceDate) {
      toast.error('Attendance Date is required')
      return
    }
    if (dailyFilters.hasSections && !dailyFilters.sectionId) {
      toast.error('Section is required for the selected class')
      return
    }

    setLoading(true)
    setDailyLoaded(false)
    setDailyNoRecords(false)
    try {
      const params = new URLSearchParams({
        attendanceDate: dailyFilters.attendanceDate
      })
      if (dailyFilters.classId) params.append('classId', dailyFilters.classId)
      if (dailyFilters.sectionId) params.append('sectionId', dailyFilters.sectionId)
      if (dailyFilters.status) params.append('status', dailyFilters.status)

      const response = await apiClient.get(`/attendance/daily?${params}`)

      let data = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (response.data.success) {
        data = response.data.data || []
      } else {
        data = response.data || []
      }

      if (data.length === 0) {
        setDailyNoRecords(true)
        setDailyData([])
        setFilteredDailyData([])
      } else {
        const formatted = data.map((row, idx) => ({
          id: idx + 1,
          admissionNo: row.admissionNo || '',
          studentName: row.studentName || '',
          className: row.className || '',
          sectionName: row.sectionName || '',
          status: row.status || '',
          remarks: row.remarks || ''
        }))
        setDailyData(formatted)
        setFilteredDailyData(formatted)
      }
      setDailyLoaded(true)
    } catch (error) {
      console.error('Failed to load daily attendance:', error)
      if (error.response?.status === 404) {
        setDailyNoRecords(true)
        setDailyData([])
        setFilteredDailyData([])
        setDailyLoaded(true)
      } else {
        toast.error('Failed to load daily attendance report')
      }
    } finally {
      setLoading(false)
    }
  }

  // ========== TAB 2 HANDLERS ==========
  const searchStudentHistory = async () => {
    if (!studentFilters.studentId) {
      toast.error('Please select a student')
      return
    }

    setLoading(true)
    setStudentHistoryLoaded(false)
    setStudentHistoryNoRecords(false)
    try {
      const params = new URLSearchParams({
        studentId: studentFilters.studentId
      })
      if (studentFilters.fromDate) params.append('fromDate', studentFilters.fromDate)
      if (studentFilters.toDate) params.append('toDate', studentFilters.toDate)

      const response = await apiClient.get(`/attendance/student?${params}`)

      let data = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (response.data.success) {
        data = response.data.data || []
      } else {
        data = response.data || []
      }

      if (data.length === 0) {
        setStudentHistoryNoRecords(true)
        setStudentHistory([])
        resetSummaryCards()
      } else {
        const formatted = data.map((row, idx) => ({
          id: idx + 1,
          attendanceDate: formatDate(row.attendanceDate || row.date || ''),
          status: row.status || '',
          remarks: row.remarks || '',
          markedBy: row.markedBy || row.marked_by || ''
        }))
        setStudentHistory(formatted)
        calculateSummary(formatted)
      }
      setStudentHistoryLoaded(true)
    } catch (error) {
      console.error('Failed to load student history:', error)
      if (error.response?.status === 404) {
        setStudentHistoryNoRecords(true)
        setStudentHistory([])
        setStudentHistoryLoaded(true)
        resetSummaryCards()
      } else {
        toast.error('Failed to load student attendance history')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (data) => {
    const present = data.filter(r => r.status === 'Present').length
    const absent = data.filter(r => r.status === 'Absent').length
    const late = data.filter(r => r.status === 'Late').length
    const halfDay = data.filter(r => r.status === 'HalfDay').length
    const total = data.length
    const percent = total > 0 ? ((present + late + halfDay) / total * 100) : 0

    setSummaryCards({
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      halfDays: halfDay,
      attendancePercent: Math.round(percent * 100) / 100
    })
  }

  const resetSummaryCards = () => {
    setSummaryCards({
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      attendancePercent: 0
    })
  }

  // ========== TAB 3 HANDLERS ==========
  const handleClassSummaryClassChange = (classId) => {
    const selectedClass = classes.find(c => String(c.classId) === classId)
    const hasSections = selectedClass?.hasSections || false
    setClassSummaryFilters(prev => ({
      ...prev,
      classId,
      sectionId: '',
      hasSections
    }))
    setClassSummaryLoaded(false)
    setClassSummaryNoRecords(false)
    if (hasSections) {
      loadSections(classId)
    } else {
      setSections([])
    }
  }

  const searchClassSummary = async () => {
    if (!classSummaryFilters.classId) {
      toast.error('Class is required')
      return
    }
    if (classSummaryFilters.hasSections && !classSummaryFilters.sectionId) {
      toast.error('Section is required for the selected class')
      return
    }

    setLoading(true)
    setClassSummaryLoaded(false)
    setClassSummaryNoRecords(false)
    try {
      const params = new URLSearchParams({
        classId: classSummaryFilters.classId,
        month: classSummaryFilters.month.toString(),
        year: classSummaryFilters.year.toString()
      })
      if (classSummaryFilters.sectionId) {
        params.append('sectionId', classSummaryFilters.sectionId)
      }

      const response = await apiClient.get(`/attendance/class-summary?${params}`)

      let data = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (response.data.success) {
        data = response.data.data || []
      } else {
        data = response.data || []
      }

      if (data.length === 0) {
        setClassSummaryNoRecords(true)
        setClassSummaryData([])
        setFilteredClassSummaryData([])
      } else {
        const formatted = data.map((row, idx) => ({
          id: idx + 1,
          studentName: row.studentName || '',
          presentDays: row.presentDays || row.present || 0,
          absentDays: row.absentDays || row.absent || 0,
          lateDays: row.lateDays || row.late || 0,
          halfDays: row.halfDays || row.halfDay || 0,
          attendancePercent: row.attendancePercent || row.attendancePercentage || 0
        }))
        setClassSummaryData(formatted)
        setFilteredClassSummaryData(formatted)
      }
      setClassSummaryLoaded(true)
    } catch (error) {
      console.error('Failed to load class summary:', error)
      if (error.response?.status === 404) {
        setClassSummaryNoRecords(true)
        setClassSummaryData([])
        setFilteredClassSummaryData([])
        setClassSummaryLoaded(true)
      } else {
        toast.error('Failed to load class attendance summary')
      }
    } finally {
      setLoading(false)
    }
  }

  // ========== TAB 4 HANDLERS ==========
  const handleRegisterClassChange = (classId) => {
    const selectedClass = classes.find(c => String(c.classId) === classId)
    const hasSections = selectedClass?.hasSections || false
    setRegisterFilters(prev => ({
      ...prev,
      classId,
      sectionId: '',
      hasSections
    }))
    setRegisterLoaded(false)
    setRegisterNoRecords(false)
    if (hasSections) {
      loadSections(classId)
    } else {
      setSections([])
    }
  }

  const resetRegisterFilters = () => {
    setRegisterFilters({
      classId: '',
      sectionId: '',
      hasSections: false,
      month: new Date().getMonth() + 1,
      year: currentYear
    })
    setRegisterLoaded(false)
    setRegisterNoRecords(false)
    setRegisterData([])
    setRegisterSearchTerm('')
  }

  const searchMonthlyRegister = async () => {
    if (!registerFilters.classId) {
      toast.error('Class is required')
      return
    }
    if (registerFilters.hasSections && !registerFilters.sectionId) {
      toast.error('Section is required for the selected class')
      return
    }

    setLoading(true)
    setRegisterLoaded(false)
    setRegisterNoRecords(false)
    setRegisterData([])
    try {
      const params = new URLSearchParams({
        classId: registerFilters.classId,
        month: registerFilters.month.toString(),
        year: registerFilters.year.toString()
      })
      if (registerFilters.sectionId) {
        params.append('sectionId', registerFilters.sectionId)
      }

      const response = await apiClient.get(`/attendance/monthly-register?${params}`)

      let data = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (response.data.success) {
        data = response.data.data || []
      } else {
        data = response.data || []
      }

      if (data.length === 0) {
        setRegisterNoRecords(true)
        setRegisterData([])
      } else {
        // Normalize PascalCase from API response
        const normalized = data.map(record => ({
          studentId: record.studentId || record.StudentId,
          admissionNo: record.admissionNo || record.AdmissionNo || '',
          studentName: record.studentName || record.StudentName || '',
          dayNo: record.dayNo || record.DayNo,
          attendanceStatus: record.attendanceStatus || record.AttendanceStatus || '',
          classId: record.classId || record.ClassId,
          sectionId: record.sectionId || record.SectionId
        }))
        setRegisterData(normalized)
      }
      setRegisterLoaded(true)
    } catch (error) {
      console.error('Failed to load monthly register:', error)
      if (error.response?.status === 404) {
        setRegisterNoRecords(true)
        setRegisterData([])
        setRegisterLoaded(true)
      } else {
        toast.error('Failed to load monthly attendance register')
      }
    } finally {
      setLoading(false)
    }
  }

  // ========== LOGO HELPER ==========
  const getLogoBase64 = async () => {
    const logoPath = orgData?.logo || orgData?.logoUrl || ''
    if (!logoPath) return ''

    if (logoPath.startsWith('data:image/')) return logoPath

    try {
      const logoUrl = logoPath.startsWith('http') ? logoPath :
                     logoPath.startsWith('/') ? window.location.origin + logoPath :
                     window.location.origin + '/' + logoPath
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.log('Could not convert logo to base64:', error)
      return ''
    }
  }

  const getSchoolName = () => orgData?.schoolName || orgData?.name || 'School Name'
  const getSchoolAddress = () => orgData?.address || ''
  const getSchoolContact = () => {
    const parts = []
    if (orgData?.phone) parts.push(orgData.phone)
    if (orgData?.email) parts.push(orgData.email)
    return parts.join(' | ')
  }

  // ========== EXPORT EXCEL ==========
  const exportToExcel = async (data, filename, reportTitle, extra = {}) => {
    if (!data || data.length === 0) {
      toast.error('No data to export')
      return
    }

    try {
      const rawHeaders = Object.keys(data[0]).filter(k => k !== 'id')
      // Sort headers: string keys (Admission No, Student Name) first, numeric keys (day numbers) last
      const headers = [
        ...rawHeaders.filter(h => isNaN(h)),
        ...rawHeaders.filter(h => !isNaN(h)).sort((a, b) => parseInt(a) - parseInt(b))
      ]
      const headerLabels = headers.map(h =>
        h.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
      )

      const schoolName = getSchoolName()
      const schoolAddress = getSchoolAddress()
      const schoolContact = getSchoolContact()

      const summaryHtml = extra.summary ? `
        <div style="margin-bottom:15px;">
          <table style="border-collapse:collapse;width:100%;font-size:11px;">
            <tr>
              <td style="background-color:#dcfce7;border:1px solid #bbf7d0;padding:8px 12px;text-align:center;font-weight:bold;color:#166534;">${extra.summary.presentRecords}<br><span style="font-weight:normal;font-size:10px;">Present Records</span></td>
              <td style="background-color:#fee2e2;border:1px solid #fecaca;padding:8px 12px;text-align:center;font-weight:bold;color:#991b1b;">${extra.summary.absentRecords}<br><span style="font-weight:normal;font-size:10px;">Absent Records</span></td>
              <td style="background-color:#fef9c3;border:1px solid #fde68a;padding:8px 12px;text-align:center;font-weight:bold;color:#854d0e;">${extra.summary.lateRecords}<br><span style="font-weight:normal;font-size:10px;">Late Records</span></td>
              <td style="background-color:#ffedd5;border:1px solid #fed7aa;padding:8px 12px;text-align:center;font-weight:bold;color:#9a3412;">${extra.summary.halfDayRecords}<br><span style="font-weight:normal;font-size:10px;">Half Day Records</span></td>
            </tr>
          </table>
        </div>
      ` : ''

      const dateRangeHtml = extra.dateRange ? `
        <div class="print-date" style="text-align:center;font-size:11px;color:#6b7280;margin-bottom:15px;">
          Period: ${extra.dateRange.from} to ${extra.dateRange.to}
        </div>
      ` : ''

      const html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .school-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
            .school-name { font-size: 22px; font-weight: bold; color: #2563eb; }
            .school-address { font-size: 12px; color: #666; margin-top: 4px; }
            .school-contact { font-size: 11px; color: #888; margin-top: 2px; }
            .report-title { text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; color: #1e40af; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; }
            th { background-color: #2563eb; color: white; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #1d4ed8; }
            td { padding: 6px 10px; border: 1px solid #d1d5db; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr:hover { background-color: #e0e7ff; }
            .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="school-header">
            <div class="school-name">${schoolName}</div>
            ${schoolAddress ? `<div class="school-address">${schoolAddress}</div>` : ''}
            ${schoolContact ? `<div class="school-contact">${schoolContact}</div>` : ''}
          </div>
          <div class="report-title">${reportTitle}</div>
          ${dateRangeHtml}
          ${summaryHtml}
          <table>
            <thead>
              <tr>${headerLabels.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(row => {
                return `<tr>${headers.map(h => {
                  let val = row[h] || ''
                  return `<td>${val}</td>`
                }).join('')}</tr>`
              }).join('\n')}
            </tbody>
          </table>
          <div class="footer">Generated on ${new Date().toLocaleString()} | ${data.length} records</div>
        </body>
        </html>
      `

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('File exported successfully')
    } catch (error) {
      toast.error('Failed to export file')
    }
  }

  // ========== PRINT ==========
  const printData = async (data, title, extra = {}) => {
    if (!data || data.length === 0) {
      toast.error('No data to print')
      return
    }

    const logoBase64 = await getLogoBase64()
    const schoolName = getSchoolName()
    const schoolAddress = getSchoolAddress()
    const schoolContact = getSchoolContact()

    const rawHeaders = Object.keys(data[0]).filter(k => k !== 'id')
    // Sort headers: string keys (Admission No, Student Name) first, numeric keys (day numbers) last
    const headers = [
      ...rawHeaders.filter(h => isNaN(h)),
      ...rawHeaders.filter(h => !isNaN(h)).sort((a, b) => parseInt(a) - parseInt(b))
    ]
    const headerLabels = headers.map(h =>
      h.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
    )

    const tableRows = data.map(row =>
      `<tr>${headers.map(h => {
        let val = row[h] || ''
        return `<td style="border: 1px solid #d1d5db; padding: 6px 10px; font-size: 11px;">${val}</td>`
      }).join('')}</tr>`
    ).join('\n')

    const summaryHtml = extra.summary ? `
      <div style="margin-bottom:20px;">
        <table style="border-collapse:collapse;width:100%;font-size:12px;">
          <tr>
            <td style="background-color:#dcfce7;border:1px solid #bbf7d0;padding:10px 15px;text-align:center;font-weight:bold;color:#166534;width:25%;">
              ${extra.summary.presentRecords}<br><span style="font-weight:normal;font-size:10px;">Present</span>
            </td>
            <td style="background-color:#fee2e2;border:1px solid #fecaca;padding:10px 15px;text-align:center;font-weight:bold;color:#991b1b;width:25%;">
              ${extra.summary.absentRecords}<br><span style="font-weight:normal;font-size:10px;">Absent</span>
            </td>
            <td style="background-color:#fef9c3;border:1px solid #fde68a;padding:10px 15px;text-align:center;font-weight:bold;color:#854d0e;width:25%;">
              ${extra.summary.lateRecords}<br><span style="font-weight:normal;font-size:10px;">Late</span>
            </td>
            <td style="background-color:#ffedd5;border:1px solid #fed7aa;padding:10px 15px;text-align:center;font-weight:bold;color:#9a3412;width:25%;">
              ${extra.summary.halfDayRecords}<br><span style="font-weight:normal;font-size:10px;">Half Day</span>
            </td>
          </tr>
        </table>
      </div>
    ` : ''

    const dateRangeHtml = extra.dateRange ? `
      <div style="text-align:center;font-size:11px;color:#6b7280;margin-bottom:15px;">
        Period: ${extra.dateRange.from} to ${extra.dateRange.to}
      </div>
    ` : ''

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
          .school-header { display: flex; align-items: center; gap: 20px; margin-bottom: 25px; border-bottom: 2px solid #2563eb; padding-bottom: 15px; }
          .logo { max-height: 70px; max-width: 180px; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
          .school-info { flex: 1; }
          .school-name { font-size: 22px; font-weight: bold; color: #2563eb; }
          .school-address { font-size: 12px; color: #666; margin-top: 4px; }
          .school-contact { font-size: 11px; color: #888; margin-top: 2px; }
          .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; color: #1e40af; }
          .print-date { text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th { border: 1px solid #999; padding: 8px 10px; background-color: #2563eb; color: white; font-size: 11px; font-weight: bold; text-align: left; white-space: nowrap; }
          td { border: 1px solid #d1d5db; padding: 6px 10px; font-size: 11px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; }
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { padding: 10px; font-size: 8px !important; }
            .logo { display: block !important; max-height: 50px; }
            img { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
            th { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; font-size: 8px !important; padding: 4px 5px !important; }
            td { font-size: 8px !important; padding: 3px 5px !important; }
            table { font-size: 8px !important; width: 100% !important; }
            .school-name { font-size: 14px !important; }
            .report-title { font-size: 12px !important; margin: 10px 0 !important; }
            .print-date { font-size: 8px !important; }
            .school-address { font-size: 9px !important; }
            .school-contact { font-size: 8px !important; }
            .footer { font-size: 7px !important; }
            div[style*="margin-bottom:20px"] { margin-bottom: 10px !important; }
          }
        </style>
      </head>
      <body>
        <div class="school-header">
          ${logoBase64 ? `<img src="${logoBase64}" alt="School Logo" class="logo">` : ''}
          <div class="school-info">
            <div class="school-name">${schoolName}</div>
            ${schoolAddress ? `<div class="school-address">${schoolAddress}</div>` : ''}
            ${schoolContact ? `<div class="school-contact">${schoolContact}</div>` : ''}
          </div>
        </div>
        <div class="report-title">${title}</div>
        <div class="print-date">Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}</div>
        ${dateRangeHtml}
        ${summaryHtml}
        <table>
          <thead>
            <tr>${headerLabels.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div class="footer">
          <p>This is a computer generated report. No signature required.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // ========== GRID COLUMNS ==========
  const dailyColumns = useMemo(() => [
    { headerName: 'Admission No', field: 'admissionNo', sortable: true, flex: 1, minWidth: 120 },
    { headerName: 'Student Name', field: 'studentName', sortable: true, flex: 2, minWidth: 180 },
    { headerName: 'Class Name', field: 'className', sortable: true, flex: 1, minWidth: 120 },
    { headerName: 'Section Name', field: 'sectionName', sortable: true, flex: 1, minWidth: 120 },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      flex: 1,
      minWidth: 120,
      cellRenderer: (params) => {
        const status = params.value || ''
        const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'
        return (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${style}`}>
            {status === 'HalfDay' ? 'Half Day' : status}
          </span>
        )
      }
    },
    { headerName: 'Remarks', field: 'remarks', sortable: true, flex: 1.5, minWidth: 150 }
  ], [])

  const studentHistoryColumns = useMemo(() => [
    {
      headerName: 'Date',
      field: 'attendanceDate',
      sortable: true,
      flex: 1,
      minWidth: 120
    },
    {
      headerName: 'Status',
      field: 'status',
      sortable: true,
      flex: 1,
      minWidth: 120,
      cellRenderer: (params) => {
        const status = params.value || ''
        const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'
        return (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${style}`}>
            {status === 'HalfDay' ? 'Half Day' : status}
          </span>
        )
      }
    },
    { headerName: 'Remarks', field: 'remarks', sortable: true, flex: 2, minWidth: 150 },
    { headerName: 'Marked By', field: 'markedBy', sortable: true, flex: 1, minWidth: 130 }
  ], [])

  const classSummaryColumns = useMemo(() => [
    { headerName: 'Student Name', field: 'studentName', sortable: true, flex: 2, minWidth: 180 },
    { headerName: 'Present Days', field: 'presentDays', sortable: true, flex: 1, minWidth: 120 },
    { headerName: 'Absent Days', field: 'absentDays', sortable: true, flex: 1, minWidth: 120 },
    { headerName: 'Late Days', field: 'lateDays', sortable: true, flex: 1, minWidth: 110 },
    { headerName: 'Half Days', field: 'halfDays', sortable: true, flex: 1, minWidth: 110 },
    {
      headerName: 'Attendance %',
      field: 'attendancePercent',
      sortable: true,
      flex: 1,
      minWidth: 130,
      valueFormatter: (params) => {
        const val = params.value
        if (val === null || val === undefined) return '0%'
        return `${Number(val).toFixed(2)}%`
      },
      cellStyle: (params) => {
        const val = Number(params.value) || 0
        if (val >= 90) return { color: '#16a34a', fontWeight: 600 }
        if (val >= 75) return { color: '#ca8a04', fontWeight: 600 }
        return { color: '#dc2626', fontWeight: 600 }
      }
    }
  ], [])

  // ========== TOOLBARS ==========
  const dailyToolbar = useMemo(() => {
    if (!dailyLoaded || dailyNoRecords) return null
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={dailySearchInput}
            onChange={(e) => setDailySearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setDailySearchTerm(dailySearchInput)
            }}
            className="w-40 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            onClick={() => setDailySearchTerm(dailySearchInput)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => exportToExcel(filteredDailyData, 'daily-attendance-report', 'Daily Attendance Report')}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5"
          title="Export Excel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel
        </button>
        <button
          onClick={() => printData(filteredDailyData, 'Daily Attendance Report')}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5"
          title="Print"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>
    )
  }, [dailyLoaded, dailyNoRecords, filteredDailyData, dailySearchInput, orgData])

  const getStudentDetail = () => {
    if (!selectedStudentInfo) return ''
    const parts = [selectedStudentInfo.studentName]
    if (selectedStudentInfo.admissionNo) parts.push(`(${selectedStudentInfo.admissionNo})`)
    if (selectedStudentInfo.className) parts.push(selectedStudentInfo.className)
    if (selectedStudentInfo.sectionName) parts.push(`(${selectedStudentInfo.sectionName})`)
    return parts.join(' - ')
  }

  const studentHistoryToolbar = useMemo(() => {
    if (!studentHistoryLoaded || studentHistoryNoRecords) return null
    const studentDetail = getStudentDetail()
    const excelTitle = `Student Attendance History${studentDetail ? ` - ${studentDetail}` : ''}`
    const printTitle = `Student Attendance History${studentDetail ? ` - ${studentDetail}` : ''}`
    
    const extra = {
      summary: {
        presentDays: summaryCards.presentDays,
        absentDays: summaryCards.absentDays,
        lateDays: summaryCards.lateDays,
        halfDays: summaryCards.halfDays,
        attendancePercent: summaryCards.attendancePercent
      },
      dateRange: {
        from: studentFilters.fromDate || 'All',
        to: studentFilters.toDate || 'All'
      }
    }
    
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => exportToExcel(studentHistory, 'student-attendance-history', excelTitle, extra)}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5"
          title="Export Excel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel
        </button>
        <button
          onClick={() => printData(studentHistory, printTitle, extra)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5"
          title="Print"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>
    )
  }, [studentHistoryLoaded, studentHistoryNoRecords, studentHistory, orgData, selectedStudentInfo, summaryCards, studentFilters])

  const getClassSummaryDetail = () => {
    const selectedClass = classes.find(c => String(c.classId) === classSummaryFilters.classId)
    const parts = []
    if (selectedClass?.className) parts.push(selectedClass.className)
    if (classSummaryFilters.hasSections) {
      const selectedSection = sections.find(s => String(s.sectionId) === classSummaryFilters.sectionId)
      if (selectedSection?.sectionName) parts.push(`(${selectedSection.sectionName})`)
    }
    const monthLabel = MONTHS.find(m => m.value === classSummaryFilters.month)?.label || ''
    if (monthLabel && classSummaryFilters.year) parts.push(`${monthLabel} ${classSummaryFilters.year}`)
    return parts.join(' - ')
  }

  const classSummaryToolbar = useMemo(() => {
    if (!classSummaryLoaded || classSummaryNoRecords) return null
    const classDetail = getClassSummaryDetail()
    const excelTitle = `Class Attendance Summary${classDetail ? ` - ${classDetail}` : ''}`
    const printTitle = `Class Attendance Summary${classDetail ? ` - ${classDetail}` : ''}`
    
    const extra = {
      dateRange: {
        from: `${MONTHS.find(m => m.value === classSummaryFilters.month)?.label || ''} ${classSummaryFilters.year}`,
        to: classDetail
      }
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={classSummarySearchInput}
            onChange={(e) => setClassSummarySearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setClassSummarySearchTerm(classSummarySearchInput)
            }}
            className="w-40 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            onClick={() => setClassSummarySearchTerm(classSummarySearchInput)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => exportToExcel(filteredClassSummaryData, 'class-attendance-summary', excelTitle, extra)}
          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5"
          title="Export Excel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel
        </button>
        <button
          onClick={() => printData(filteredClassSummaryData, printTitle, extra)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5"
          title="Print"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>
    )
  }, [classSummaryLoaded, classSummaryNoRecords, filteredClassSummaryData, classSummarySearchInput, orgData, classes, sections, classSummaryFilters])

  // Get register detail for print/export title
  const getRegisterDetail = () => {
    const selectedClass = classes.find(c => String(c.classId) === registerFilters.classId)
    const parts = []
    if (selectedClass?.className) parts.push(selectedClass.className)
    if (registerFilters.hasSections) {
      const selectedSection = sections.find(s => String(s.sectionId) === registerFilters.sectionId)
      if (selectedSection?.sectionName) parts.push(`(${selectedSection.sectionName})`)
    }
    const monthLabel = MONTHS.find(m => m.value === registerFilters.month)?.label || ''
    if (monthLabel && registerFilters.year) parts.push(`${monthLabel} ${registerFilters.year}`)
    return parts.join(' - ')
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    // Reset loaded states to prevent stale data between tabs
    setDailyLoaded(false)
    setStudentHistoryLoaded(false)
    setClassSummaryLoaded(false)
    setRegisterLoaded(false)
  }

  const TABS = [
    { id: 'daily', label: 'Daily Attendance Report' },
    { id: 'student', label: 'Student Attendance History' },
    { id: 'class', label: 'Class Attendance Summary' },
    { id: 'register', label: 'Monthly Register' }
  ]

  // ========== RENDER HELPER FUNCTIONS ==========
  const renderNoRecords = (message) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No Records Found</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  )

  // ========== RENDER ==========
  return (
    <LoadingOverlay isLoading={loading}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Attendance Reports</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">View and analyze attendance data</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== TAB 1: Daily Attendance Report ===== */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Attendance Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={dailyFilters.attendanceDate}
                    onChange={(e) => {
                      setDailyFilters(prev => ({ ...prev, attendanceDate: e.target.value }))
                      setDailyLoaded(false)
                      setDailyNoRecords(false)
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Class</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={dailyFilters.classId}
                    onChange={(e) => handleDailyClassChange(e.target.value)}
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>{cls.className}</option>
                    ))}
                  </select>
                </div>
                {dailyFilters.hasSections && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Section</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      value={dailyFilters.sectionId}
                      onChange={(e) => {
                        setDailyFilters(prev => ({ ...prev, sectionId: e.target.value }))
                        setDailyLoaded(false)
                        setDailyNoRecords(false)
                      }}
                    >
                      <option value="">All Sections</option>
                      {sections.map(sec => (
                        <option key={sec.sectionId} value={sec.sectionId}>{sec.sectionName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={dailyFilters.status}
                    onChange={(e) => setDailyFilters(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    {ATTENDANCE_STATUSES.map(status => (
                      <option key={status} value={status}>{status === 'HalfDay' ? 'Half Day' : status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={searchDailyAttendance}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {dailyLoaded && (
              dailyNoRecords ? renderNoRecords('No attendance records found for the selected criteria.')
              : dailyData.length > 0 ? (
                <AgGridBox
                  title="Daily Attendance Report"
                  columnDefs={dailyColumns}
                  rowData={filteredDailyData}
                  showActions={false}
                  toolbar={dailyToolbar}
                  pagination
                  paginationPageSize={10}
                />
              ) : null
            )}

            {!dailyLoaded && !loading && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Select Filters</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Select a date and click Search to view daily attendance report</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 2: Student Attendance History ===== */}
        {activeTab === 'student' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Student *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search and select student..."
                      value={studentSearchTerm}
                      onFocus={() => {
                        setFilteredStudents(students)
                        setStudentDropdownOpen(true)
                      }}
                      onBlur={() => setTimeout(() => setStudentDropdownOpen(false), 200)}
                      onChange={(e) => {
                        const value = e.target.value
                        setStudentSearchTerm(value)
                        setStudentFilters(prev => ({ ...prev, studentId: '' }))
                        setStudentHistoryLoaded(false)
                        setStudentHistoryNoRecords(false)
                        setSelectedStudentInfo(null)
                        setStudentDropdownOpen(true)
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                    {studentDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                          <button
                            key={student.studentId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setStudentFilters(prev => ({ ...prev, studentId: student.studentId }))
                              setStudentSearchTerm(`${student.studentName}${student.admissionNo ? ` (${student.admissionNo})` : ''}`)
                              setSelectedStudentInfo(student)
                              setStudentDropdownOpen(false)
                              setStudentHistoryLoaded(false)
                              setStudentHistoryNoRecords(false)
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-200 dark:border-slate-600 last:border-b-0 min-h-[48px]"
                          >
                            <div className="font-medium">{student.studentName}</div>
                            <div className="text-sm text-slate-500">Admission: {student.admissionNo}{student.className ? ` | ${student.className}` : ''}{student.sectionName ? ` - ${student.sectionName}` : ''}</div>
                          </button>
                        )) : (
                          <div className="p-4 text-center text-sm text-slate-500">No students found</div>
                        )}
                      </div>
                    )}
                    {studentFilters.studentId && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">From Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={studentFilters.fromDate}
                    onChange={(e) => setStudentFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">To Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={studentFilters.toDate}
                    onChange={(e) => setStudentFilters(prev => ({ ...prev, toDate: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={searchStudentHistory}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {studentHistoryLoaded && !studentHistoryNoRecords && studentHistory.length > 0 && selectedStudentInfo && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedStudentInfo.studentName}</h3>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Admission No: {selectedStudentInfo.admissionNo || 'N/A'}
                      {selectedStudentInfo.className ? ` | Class: ${selectedStudentInfo.className}` : ''}
                      {selectedStudentInfo.sectionName ? ` | Section: ${selectedStudentInfo.sectionName}` : ''}
                      {studentFilters.fromDate && studentFilters.toDate ? ` | ${studentFilters.fromDate} to ${studentFilters.toDate}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {studentHistoryLoaded && !studentHistoryNoRecords && studentHistory.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summaryCards.presentDays}</div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1 font-medium">Present Days</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summaryCards.absentDays}</div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">Absent Days</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summaryCards.lateDays}</div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 font-medium">Late Days</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summaryCards.halfDays}</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300 mt-1 font-medium">Half Days</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center sm:col-span-1 col-span-2">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summaryCards.attendancePercent}%</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">Attendance %</div>
                </div>
              </div>
            )}

            {studentHistoryLoaded && (
              studentHistoryNoRecords ? renderNoRecords('No attendance records found for the selected student.')
              : studentHistory.length > 0 ? (
                <AgGridBox
                  title="Student Attendance History"
                  columnDefs={studentHistoryColumns}
                  rowData={studentHistory}
                  showActions={false}
                  toolbar={studentHistoryToolbar}
                  pagination
                  paginationPageSize={10}
                />
              ) : null
            )}

            {!studentHistoryLoaded && !loading && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Select a Student</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Select a student and click Search to view attendance history</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 3: Class Attendance Summary ===== */}
        {activeTab === 'class' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={classSummaryFilters.classId}
                    onChange={(e) => handleClassSummaryClassChange(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>{cls.className}</option>
                    ))}
                  </select>
                </div>
                {classSummaryFilters.hasSections && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Section</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      value={classSummaryFilters.sectionId}
                      onChange={(e) => {
                        setClassSummaryFilters(prev => ({ ...prev, sectionId: e.target.value }))
                        setClassSummaryLoaded(false)
                        setClassSummaryNoRecords(false)
                      }}
                    >
                      <option value="">Select Section</option>
                      {sections.map(sec => (
                        <option key={sec.sectionId} value={sec.sectionId}>{sec.sectionName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Month *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={classSummaryFilters.month}
                    onChange={(e) => setClassSummaryFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={classSummaryFilters.year}
                    onChange={(e) => setClassSummaryFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  >
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={searchClassSummary}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {classSummaryLoaded && (
              classSummaryNoRecords ? renderNoRecords('No attendance summary found for the selected class and month.')
              : classSummaryData.length > 0 ? (
                <AgGridBox
                  title="Class Attendance Summary"
                  columnDefs={classSummaryColumns}
                  rowData={filteredClassSummaryData}
                  showActions={false}
                  toolbar={classSummaryToolbar}
                  pagination
                  paginationPageSize={10}
                />
              ) : null
            )}

            {!classSummaryLoaded && !loading && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Select Filters</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Select a class, month, year and click Search to view class attendance summary</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4: Monthly Register ===== */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={registerFilters.classId}
                    onChange={(e) => handleRegisterClassChange(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>{cls.className}</option>
                    ))}
                  </select>
                </div>
                {registerFilters.hasSections && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Section</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      value={registerFilters.sectionId}
                      onChange={(e) => {
                        setRegisterFilters(prev => ({ ...prev, sectionId: e.target.value }))
                        setRegisterLoaded(false)
                        setRegisterNoRecords(false)
                      }}
                    >
                      <option value="">Select Section</option>
                      {sections.map(sec => (
                        <option key={sec.sectionId} value={sec.sectionId}>{sec.sectionName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Month *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={registerFilters.month}
                    onChange={(e) => setRegisterFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                    value={registerFilters.year}
                    onChange={(e) => setRegisterFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  >
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={searchMonthlyRegister}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    onClick={resetRegisterFilters}
                    className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    title="Reset Filters"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Register Summary Cards */}
            {registerLoaded && !registerNoRecords && processedRegisterRows.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{registerSummaryData.totalStudents}</div>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 font-medium">Total Students</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{registerSummaryData.presentRecords}</div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1 font-medium">Present Records</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{registerSummaryData.absentRecords}</div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1 font-medium">Absent Records</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{registerSummaryData.lateRecords}</div>
                  <div className="text-xs text-orange-700 dark:text-orange-300 mt-1 font-medium">Late Records</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{registerSummaryData.halfDayRecords}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">Half Day Records</div>
                </div>
              </div>
            )}

            {/* Legend */}
            {registerLoaded && !registerNoRecords && processedRegisterRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="text-slate-500 font-medium">Legend:</span>
                <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-green-100 text-green-700 font-bold flex items-center justify-center text-xs">P</span> Present</span>
                <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">A</span> Absent</span>
                <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">L</span> Late</span>
                <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">H</span> Half Day</span>
                <span className="inline-flex items-center gap-1"><span className="w-5 h-5 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-xs">*</span> No Mark</span>
              </div>
            )}

            {/* Register Table */}
            {registerLoaded && (
              registerNoRecords ? renderNoRecords('No attendance records found for selected month.')
              : processedRegisterRows.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Monthly Register - {getRegisterDetail()}</h3>
                        <p className="text-xs text-slate-500">{processedRegisterRows.length} students</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search student..."
                          value={registerSearchTerm}
                          onChange={(e) => setRegisterSearchTerm(e.target.value)}
                          className="w-36 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const exportRows = processedRegisterRows.map(row => {
                            const data = { 'Admission No': row.admissionNo, 'Student Name': row.studentName }
                            for (let d = 1; d <= daysInMonth; d++) {
                              data[d] = row.days[d] || '*'
                            }
                            return data
                          })
                          const exportTitle = `Monthly Register - ${getRegisterDetail()}`
                          exportToExcel(exportRows, 'monthly-register', exportTitle, {
                            summary: registerSummaryData,
                            dateRange: { from: `${MONTHS.find(m => m.value === registerFilters.month)?.label} ${registerFilters.year}`, to: getRegisterDetail() }
                          })
                        }}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5"
                        title="Export Excel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                      </button>
                      <button
                        onClick={async () => {
                          const printRows = processedRegisterRows.map(row => {
                            const data = { 'Admission No': row.admissionNo, 'Student Name': row.studentName }
                            for (let d = 1; d <= daysInMonth; d++) {
                              data[d] = row.days[d] || '*'
                            }
                            return data
                          })
                          const printTitle = `Monthly Register - ${getRegisterDetail()}`
                          await printData(printRows, printTitle, {
                            summary: registerSummaryData,
                            dateRange: { from: `${MONTHS.find(m => m.value === registerFilters.month)?.label} ${registerFilters.year}`, to: getRegisterDetail() }
                          })
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5"
                        title="Print"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Register Grid */}
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
                            <th className="sticky left-0 z-10 bg-blue-600 px-3 py-2.5 text-left text-xs font-semibold text-white border-r border-blue-500 min-w-[100px]">Admission No</th>
                            <th className="sticky left-[100px] z-10 bg-blue-600 px-3 py-2.5 text-left text-xs font-semibold text-white border-r border-blue-500 min-w-[160px]">Student Name</th>
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                              <th key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-white border-r border-blue-500 min-w-[30px] w-[30px]">{day}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {processedRegisterRows.map((student, idx) => (
                            <tr key={student.studentId} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}>
                              <td className="sticky left-0 z-10 px-3 py-2 border-b border-slate-200 font-medium text-slate-700 bg-inherit min-w-[100px]">{student.admissionNo || '-'}</td>
                              <td className="sticky left-[100px] z-10 px-3 py-2 border-b border-slate-200 font-medium text-slate-800 bg-inherit min-w-[160px]">{student.studentName}</td>
                              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const status = student.days[day] || '*'
                                const cellStyle = REGISTER_CELL_STYLES[status] || REGISTER_CELL_STYLES['*']
                                return (
                                  <td key={day} className={`px-2 py-2 text-center border-b border-slate-200 border-r border-slate-100 ${cellStyle}`}>
                                    <span className="text-xs font-bold">{status}</span>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null
            )}

            {!registerLoaded && !loading && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Select Filters</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Select a class, month, year and click Search to view the monthly attendance register</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LoadingOverlay>
  )
}