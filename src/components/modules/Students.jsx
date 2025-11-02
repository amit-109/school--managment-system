import React, { useMemo, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import AgGridBox from '../shared/AgGridBox'
import LoadingOverlay from '../shared/LoadingOverlay'
import { getUsers, createUser, updateUser, deleteUser, getParents, getClasses } from '../Services/adminService'

export default function Students() {
  const { permissions } = useSelector((state) => state.auth)
  const [rows, setRows] = useState([])
  const [parents, setParents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    userId: 0,
    roleName: 'Student',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    admissionNo: '',
    parentName: '',
    classId: 0
  })
  const [errors, setErrors] = useState({})
  const [classFilter, setClassFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [streamFilter, setStreamFilter] = useState('')
  const [viewData, setViewData] = useState(null)

  useEffect(() => {
    loadStudents()
    loadClasses()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await getUsers()
      if (response.success) {
        const students = response.data?.users?.filter(user => user.roleName === 'Student') || []
        setRows(students)
      }
    } catch (error) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }



  const loadClasses = async () => {
    try {
      const response = await getClasses()
      if (response.success) {
        setClasses(response.data || [])
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  const filteredRows = rows.filter(row => {
    const className = classes.find(c => c.classId === row.classId)?.className || ''
    return (
      (classFilter === '' || className.includes(classFilter)) &&
      (sectionFilter === '' || className.includes(sectionFilter))
    )
  })

  const cols = useMemo(() => [
    { field: 'admissionNo', headerName: 'Admission No', maxWidth: 140 },
    { field: 'fullName', headerName: 'Name' },
    { field: 'username', headerName: 'Username', maxWidth: 140 },
    { field: 'email', headerName: 'Email' },
    { field: 'phone', headerName: 'Phone', maxWidth: 160 },
    { 
      field: 'className', 
      headerName: 'Class', 
      maxWidth: 140,
      valueGetter: (params) => {
        const cls = classes.find(c => c.classId === params.data.classId)
        return cls?.className || 'N/A'
      }
    },
    {
      field: 'parentName',
      headerName: 'Parent'
    }
  ], [classes, parents])

  const validate = () => {
    const newErrors = {}
    if (!form.firstName.trim()) newErrors.firstName = "First name is required"
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!form.username.trim()) newErrors.username = "Username is required"
    if (!form.email.trim()) newErrors.email = "Email is required"
    if (!editMode && !form.password.trim()) newErrors.password = "Password is required"
    if (!form.admissionNo.trim()) newErrors.admissionNo = "Admission number is required"
    if (!form.parentName.trim()) newErrors.parentName = "Parent name is required"
    if (!form.classId) newErrors.classId = "Class is required"
    return newErrors
  }

  const resetForm = () => {
    setForm({
      userId: 0,
      roleName: 'Student',
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      admissionNo: '',
      parentName: '',
      classId: 0
    })
    setErrors({})
    setEditMode(false)
  }

  const addStudent = async () => {
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const userData = {
        ...form,
        roleName: 'Student'
      }

      if (editMode) {
        await updateUser(userData)
        toast.success('Student updated successfully')
      } else {
        await createUser(userData)
        toast.success('Student created successfully')
      }
      
      setShow(false)
      resetForm()
      loadStudents()
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save student'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (data) => {
    setForm({
      userId: data.userId,
      roleName: 'Student',
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: '',
      phoneNumber: data.phoneNumber || data.phone,
      address: data.address,
      admissionNo: data.admissionNo,
      parentName: data.parentName || '',
      classId: data.classId || 0
    })
    setEditMode(true)
    setShow(true)
  }

  const handleView = (data) => {
    setViewData(data)
  }

  const handleDelete = async (data) => {
    if (window.confirm(`Are you sure you want to delete student ${data.fullName}?`)) {
      setLoading(true)
      try {
        await deleteUser(data.userId)
        toast.success('Student deleted successfully')
        loadStudents()
      } catch (error) {
        toast.error('Failed to delete student')
      } finally {
        setLoading(false)
      }
    }
  }

  const toolbar = (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => { resetForm(); setShow(true) }}
        className="px-5 py-2.5 btn-primary flex items-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Student
      </button>
      <div className="flex gap-3">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input-primary text-sm min-w-[120px]"
        >
          <option value="">All Classes</option>
          <option value="1">Class 1</option>
          <option value="2">Class 2</option>
          <option value="9">Class 9</option>
          <option value="10">Class 10</option>
          <option value="11">Class 11</option>
          <option value="12">Class 12</option>
        </select>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="input-primary text-sm min-w-[120px]"
        >
          <option value="">All Sections</option>
          <option value="A">Section A</option>
          <option value="B">Section B</option>
          <option value="C">Section C</option>
        </select>
        <select
          value={streamFilter}
          onChange={(e) => setStreamFilter(e.target.value)}
          className="input-primary text-sm min-w-[120px]"
        >
          <option value="">All Streams</option>
          <option value="Science">Science</option>
          <option value="Arts">Arts</option>
          <option value="Commerce">Commerce</option>
        </select>
      </div>
    </div>
  )

  return (
    <LoadingOverlay isLoading={loading}>
      <>
    <AgGridBox
      title="Students"
      columnDefs={cols}
      rowData={filteredRows}
      toolbar={toolbar}
      onEdit={handleEdit}
      onView={handleView}
      onDelete={handleDelete}
    />
    {/* Add/Edit Modal */}
    {show && (
      <div className="modal-backdrop">
        <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {editMode ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button
                onClick={() => setShow(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addStudent(); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={(e) => setForm(f => ({...f, firstName: e.target.value}))}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={(e) => setForm(f => ({...f, lastName: e.target.value}))}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Username *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter username"
                    value={form.username}
                    onChange={(e) => setForm(f => ({...f, username: e.target.value}))}
                  />
                  {errors.username && <p className="text-red-500 text-xs">{errors.username}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Email *</label>
                  <input
                    type="email"
                    className={`input-primary ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={(e) => setForm(f => ({...f, email: e.target.value}))}
                  />
                  {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password {!editMode && '*'}</label>
                  <input
                    type="password"
                    className={`input-primary ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder={editMode ? "Leave blank to keep current" : "Enter password"}
                    value={form.password}
                    onChange={(e) => setForm(f => ({...f, password: e.target.value}))}
                  />
                  {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <input
                    type="tel"
                    className="input-primary"
                    placeholder="Enter phone number"
                    value={form.phoneNumber}
                    onChange={(e) => setForm(f => ({...f, phoneNumber: e.target.value}))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Address</label>
                  <textarea
                    className="input-primary"
                    placeholder="Enter address"
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm(f => ({...f, address: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Admission Number *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.admissionNo ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter admission number"
                    value={form.admissionNo}
                    onChange={(e) => setForm(f => ({...f, admissionNo: e.target.value}))}
                  />
                  {errors.admissionNo && <p className="text-red-500 text-xs">{errors.admissionNo}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Parent Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.parentName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Enter parent name"
                    value={form.parentName}
                    onChange={(e) => setForm(f => ({...f, parentName: e.target.value}))}
                  />
                  {errors.parentName && <p className="text-red-500 text-xs">{errors.parentName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Class *</label>
                  <select
                    className={`input-primary ${errors.classId ? 'border-red-500 focus:ring-red-500' : ''}`}
                    value={form.classId}
                    onChange={(e) => setForm(f => ({...f, classId: parseInt(e.target.value) || 0}))}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                  {errors.classId && <p className="text-red-500 text-xs">{errors.classId}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Stream</label>
                  <select
                    className="input-primary"
                    value={form.stream}
                    onChange={(e) => setForm(f => ({...f, stream: e.target.value}))}
                  >
                    <option value="">Select Stream</option>
                    <option value="Science">Science</option>
                    <option value="Arts">Arts</option>
                    <option value="Commerce">Commerce</option>
                    <option value="-">Not Applicable</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Guardian Name *</label>
                  <input
                    type="text"
                    className={`input-primary ${errors.guardian ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., Mr. Doe"
                    value={form.guardian}
                    onChange={(e) => setForm(f => ({...f, guardian: e.target.value}))}
                  />
                  {errors.guardian && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.guardian}
                  </p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number *</label>
                  <input
                    type="tel"
                    className={`input-primary ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="e.g., 9000000000"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({...f, phone: e.target.value}))}
                    maxLength={10}
                  />
                  {errors.phone && <p className="text-red-500 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone}
                  </p>}
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  className="px-6 py-3 btn-secondary"
                  onClick={() => setShow(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 btn-primary"
                >
                  {editMode ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* View Modal */}
    {viewData && (
      <div className="modal-backdrop">
        <div className="modal-content w-full max-w-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Details</h2>
              <button
                onClick={() => setViewData(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">Student ID</div>
                  <div className="text-lg font-semibold text-primary-900 dark:text-primary-100">{viewData.id}</div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Full Name</div>
                  <div className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">{viewData.name}</div>
                </div>
                <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-accent-700 dark:text-accent-300 mb-1">Class</div>
                  <div className="text-lg font-semibold text-accent-900 dark:text-accent-100">{viewData.cls}</div>
                </div>
                <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-xl">
                  <div className="text-sm font-medium text-success-700 dark:text-success-300 mb-1">Stream</div>
                  <div className="text-lg font-semibold text-success-900 dark:text-success-100">{viewData.stream || 'Not Applicable'}</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl col-span-2">
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Guardian Name</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{viewData.guardian}</div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl col-span-2">
                  <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone Number</div>
                  <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{viewData.phone}</div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    setViewData(null);
                    handleEdit(viewData);
                  }}
                  className="px-6 py-3 btn-primary"
                >
                  Edit Student
                </button>
                <button
                  onClick={() => setViewData(null)}
                  className="px-6 py-3 btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
      </>
    </LoadingOverlay>
  )
}
