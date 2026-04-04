import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  createUser,
  updateUser,
  deleteUser,
  getClasses,
  getStudentUsers,
  getStudentById,
  checkEmailExists as checkEmailExistsAPI,
  checkUsernameExists as checkUsernameExistsAPI,
  checkAdmissionNoExists as checkAdmissionNoExistsAPI
} from '../Services/adminService';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];

export default function Students() {
  const { permissions } = useSelector((state) => state.auth);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailError, setEmailError] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [admissionNoError, setAdmissionNoError] = useState('');
  const [originalAdmissionNo, setOriginalAdmissionNo] = useState('');
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
    fatherName: '',
    motherName: '',
    classId: 0,
    gender: '',
    category: ''
  });

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudentUsers(1, 10000);
      if (response.success) {
        setStudents(response.data?.users || []);
      }
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await getClasses();
      if (response.success && response.data?.length > 0) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (email) => {
    if (!email) return;

    try {
      const response = await checkEmailExistsAPI(email);

      if (response?.success === true) {
        setEmailError('Email already exists in system');
      } else if (response?.success === false) {
        setEmailError('');
      }
    } catch (error) {
      console.error('Email check failed:', error);
      setEmailError('');
    }
  };

  const checkUsernameExists = async (username) => {
    if (!username) return;

    try {
      const response = await checkUsernameExistsAPI(username);
      const message = String(response?.message || response?.data?.message || '').toLowerCase();
      const hasExistsMessage = message.includes('exist') || message.includes('already') || message.includes('taken');
      const hasAvailableMessage = message.includes('available') || message.includes('not exist');
      const isTakenByFlag =
        response?.success === true ||
        response?.exists === true ||
        response?.data?.exists === true ||
        response?.isAvailable === false ||
        response?.available === false;
      const isAvailableByFlag =
        response?.success === false ||
        response?.exists === false ||
        response?.data?.exists === false ||
        response?.isAvailable === true ||
        response?.available === true;

      if (hasExistsMessage || (isTakenByFlag && !hasAvailableMessage)) {
        setUsernameError('Username already exists in system');
      } else if (hasAvailableMessage || isAvailableByFlag) {
        setUsernameError('');
      } else {
        setUsernameError('');
      }
    } catch (error) {
      console.error('Username check failed:', error);
      setUsernameError('');
    }
  };

  const checkAdmissionNoExists = async (admissionNo) => {
    if (!admissionNo) return;

    try {
      const response = await checkAdmissionNoExistsAPI(admissionNo);
      const message = String(response?.message || response?.data?.message || '').toLowerCase();
      const hasExistsMessage = message.includes('exist') || message.includes('already') || message.includes('taken');
      const hasAvailableMessage = message.includes('available') || message.includes('not exist');
      const isTakenByFlag =
        response?.success === true ||
        response?.exists === true ||
        response?.data?.exists === true ||
        response?.isAvailable === false ||
        response?.available === false;
      const isAvailableByFlag =
        response?.success === false ||
        response?.exists === false ||
        response?.data?.exists === false ||
        response?.isAvailable === true ||
        response?.available === true;

      if (hasExistsMessage || (isTakenByFlag && !hasAvailableMessage)) {
        setAdmissionNoError('Admission number already exists in system');
      } else if (hasAvailableMessage || isAvailableByFlag) {
        setAdmissionNoError('');
      } else {
        setAdmissionNoError('');
      }
    } catch (error) {
      console.error('Admission number check failed:', error);
      setAdmissionNoError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usernameError) {
      toast.error('Please fix username errors before submitting');
      return;
    }

    if (admissionNoError) {
      toast.error('Please fix admission number errors before submitting');
      return;
    }

    if (form.email && emailError) {
      toast.error('Please fix email errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        ...form,
        roleName: 'Student',
        phone: form.phoneNumber
      };

      if (editMode) {
        await updateUser(userData);
        toast.success('Student updated successfully');
      } else {
        await createUser(userData);
        toast.success('Student created successfully');
      }

      setShowModal(false);
      resetForm();
      loadStudents();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save student';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (userData) => {
    setLoading(true);

    try {
      const response = await getStudentById(userData.userId);
      if (response.success) {
        const studentData = response.data;
        const email = studentData.studentEmail || studentData.email || '';
        const username = studentData.studentUsername || studentData.username || userData.username || '';
        const admissionNo = studentData.admissionNo || userData.admissionNo || '';
        const resolvedClassId = parseInt(
          studentData.classId ?? studentData.currentClassId ?? studentData.studentClassId ?? 0,
          10
        ) || 0;

        setForm({
          userId: studentData.studentUserId || studentData.userId || userData.userId,
          roleName: 'Student',
          firstName: studentData.studentFirstName || studentData.firstName || '',
          lastName: studentData.studentLastName || studentData.lastName || '',
          username: username,
          email: email,
          password: '',
          phoneNumber: studentData.studentPhoneNumber || studentData.phoneNumber || studentData.phone || '',
          address: studentData.address || studentData.studentAddress || '',
          admissionNo: admissionNo,
          fatherName: studentData.fatherName || studentData.fayerName || studentData.studentFatherName || studentData.studentFayerName || '',
          motherName: studentData.motherName || studentData.studentMotherName || '',
          classId: resolvedClassId,
          gender: studentData.gender || studentData.studentGender || '',
          category: studentData.category || studentData.studentCategory || ''
        });

        setOriginalEmail(email);
        setOriginalUsername(username);
        setOriginalAdmissionNo(admissionNo);
        setUsernameError('');
        setAdmissionNoError('');
        setEditMode(true);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Failed to load student details');
      console.error('Error loading student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userData) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete student "${userData.fullName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await deleteUser(userData.userId);
      toast.success('Student deleted successfully');
      loadStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

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
      fatherName: '',
      motherName: '',
      classId: 0,
      gender: '',
      category: ''
    });
    setEmailError('');
    setOriginalEmail('');
    setUsernameError('');
    setOriginalUsername('');
    setAdmissionNoError('');
    setOriginalAdmissionNo('');
    setEditMode(false);
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter((student) =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.gender || student.studentGender || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.category || student.studentCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.motherName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const columns = useMemo(() => [
    { headerName: 'Name', field: 'fullName', sortable: true },
    { headerName: 'Username', field: 'username', sortable: true },
    { headerName: 'Admission No', field: 'admissionNo', sortable: true },
    { headerName: 'Gender', field: 'gender', sortable: true, valueGetter: (params) => params.data?.gender || params.data?.studentGender || '' },
    { headerName: 'Category', field: 'category', sortable: true, valueGetter: (params) => params.data?.category || params.data?.studentCategory || '' },
    { headerName: 'Father Name', field: 'fatherName', sortable: true },
    { headerName: 'Mother Name', field: 'motherName', sortable: true },
    { headerName: 'Email', field: 'email', sortable: true },
    { headerName: 'Phone', field: 'phone', sortable: true },
    {
      headerName: 'Status',
      field: 'status',
      width: 100,
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value}
        </span>
      )
    }
  ], []);

  const toolbar = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 px-3 py-1.5 pl-9 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
        <svg className="absolute left-3 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <button
        onClick={() => { resetForm(); setShowModal(true); }}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Student
      </button>
    </div>
  );

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Student Management</h1>
          <p className="text-sm text-slate-600">Manage student accounts and information</p>
        </div>

        <AgGridBox
          title="Students"
          columnDefs={columns}
          rowData={filteredStudents}
          onEdit={handleEdit}
          onDelete={handleDelete}
          toolbar={toolbar}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editMode ? 'Edit Student' : 'Add New Student'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({...form, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({...form, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      value={form.username}
                      onChange={(e) => {
                        const username = e.target.value;
                        setForm({...form, username});
                        setUsernameError('');
                      }}
                      onBlur={(e) => {
                        const username = e.target.value.trim();
                        if (!username) {
                          setUsernameError('');
                          return;
                        }
                        if (editMode && username === originalUsername) {
                          setUsernameError('');
                          return;
                        }
                        checkUsernameExists(username);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                        usernameError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                      }`}
                      placeholder="Enter username"
                    />
                    {usernameError && (
                      <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        setForm({...form, email});
                        setEmailError('');
                        if (email.trim() && !validateEmail(email.trim())) {
                          setEmailError('Invalid email format');
                        }
                      }}
                      onBlur={(e) => {
                        const email = e.target.value.trim();
                        if (email) {
                          if (!validateEmail(email)) {
                            setEmailError('Invalid email format');
                          } else if (!editMode || email !== originalEmail) {
                            checkEmailExists(email);
                          } else {
                            setEmailError('');
                          }
                        } else {
                          setEmailError('');
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                        emailError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                      }`}
                      placeholder="Enter email address (optional)"
                    />
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {editMode ? 'Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      required={!editMode}
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Number *</label>
                    <input
                      type="text"
                      required
                      value={form.admissionNo}
                      onChange={(e) => {
                        const admissionNo = e.target.value;
                        setForm({...form, admissionNo});
                        setAdmissionNoError('');
                      }}
                      onBlur={(e) => {
                        const admissionNo = e.target.value.trim();
                        if (!admissionNo) {
                          setAdmissionNoError('');
                          return;
                        }
                        if (editMode && admissionNo === originalAdmissionNo) {
                          setAdmissionNoError('');
                          return;
                        }
                        checkAdmissionNoExists(admissionNo);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                        admissionNoError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                      }`}
                      placeholder="Enter admission number"
                    />
                    {admissionNoError && (
                      <p className="text-red-500 text-sm mt-1">{admissionNoError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Father Name</label>
                    <input
                      type="text"
                      value={form.fatherName}
                      onChange={(e) => setForm({...form, fatherName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter father name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mother Name</label>
                    <input
                      type="text"
                      value={form.motherName}
                      onChange={(e) => setForm({...form, motherName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter mother name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({...form, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({...form, category: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Class *</label>
                    <select
                      required
                      value={form.classId || ''}
                      onChange={(e) => setForm({...form, classId: parseInt(e.target.value, 10) || 0})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.classId} value={cls.classId}>
                          {cls.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({...form, phoneNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      rows={2}
                      placeholder="Enter address"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading || !!usernameError || !!admissionNoError || (form.email && emailError)}
                  >
                    {loading ? 'Saving...' : (editMode ? 'Update Student' : 'Create Student')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
}
