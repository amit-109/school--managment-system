import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import { getUsers, createUser, updateUser, deleteUser, getTeacherUsers, getTeacherById, checkEmailExists as checkEmailExistsAPI } from '../Services/adminService';

export default function Teachers() {
  console.log('Teachers component rendering');
  const { permissions } = useSelector((state) => state.auth);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailError, setEmailError] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [form, setForm] = useState({
    userId: 0,
    roleName: 'Teacher',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    qualification: '',
    designation: '',
    salary: ''
  });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    console.log('Loading teachers...');
    setLoading(true);
    try {
      const response = await getTeacherUsers();
      console.log('Teachers API response:', response);
      if (response.success) {
        setTeachers(response.data?.users || []);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
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
      console.log('Email check response:', response);
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only check email errors if user has entered an email
    if (form.email && emailError) {
      toast.error('Please fix email errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = { 
        ...form, 
        roleName: 'Teacher',
        phone: form.phoneNumber // Map phoneNumber to phone for API
      };

      if (editMode) {
        await updateUser(userData);
        toast.success('Teacher updated successfully');
      } else {
        await createUser(userData);
        toast.success('Teacher created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadTeachers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save teacher';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (userData) => {
    console.log('Teacher edit data:', userData);
    setLoading(true);

    try {
      // Get detailed teacher data using the new API
      const response = await getTeacherById(userData.userId);
      if (response.success) {
        const teacherData = response.data;
        const email = teacherData.teacherEmail || '';
        setForm({
          userId: teacherData.teacherUserId,
          roleName: 'Teacher',
          firstName: teacherData.teacherFirstName || '',
          lastName: teacherData.teacherLastName || '',
          username: teacherData.teacherUsername || '',
          email: email,
          password: '',
          phoneNumber: teacherData.teacherPhoneNumber || '',
          address: teacherData.address || '',
          qualification: teacherData.qualification || '',
          designation: teacherData.designation || '',
          salary: teacherData.salary || ''
        });
        setOriginalEmail(email);
        setEditMode(true);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Failed to load teacher details');
      console.error('Error loading teacher:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userData) => {
    if (window.confirm(`Are you sure you want to delete ${userData.fullName}?`)) {
      setLoading(true);
      try {
        await deleteUser(userData.userId);
        toast.success('Teacher deleted successfully');
        loadTeachers();
      } catch (error) {
        toast.error('Failed to delete teacher');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setForm({
      userId: 0,
      roleName: 'Teacher',
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      qualification: '',
      designation: '',
      salary: ''
    });
    setEmailError('');
    setOriginalEmail('');
    setEditMode(false);
  };

  const filteredTeachers = useMemo(() => {
    if (!searchTerm) return teachers;
    return teachers.filter(teacher => 
      teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.qualification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

  const columns = useMemo(() => [
    { headerName: 'Name', field: 'fullName', sortable: true },
    { headerName: 'Username', field: 'username', sortable: true },
    { headerName: 'Email', field: 'email', sortable: true },
    { headerName: 'Phone', field: 'phone', sortable: true },
    { headerName: 'Qualification', field: 'qualification', sortable: true },
    { headerName: 'Designation', field: 'designation', sortable: true },
    { 
      headerName: 'Salary', 
      field: 'salary', 
      sortable: true,
      valueFormatter: (params) => params.value ? `₹ ${params.value.toLocaleString()}` : 'N/A'
    },
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
          placeholder="Search teachers..."
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
        Add Teacher
      </button>
    </div>
  );

  console.log('Teachers render - teachers count:', teachers.length, 'loading:', loading);
  
  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Teacher Management</h1>
          <p className="text-sm text-slate-600">Manage teacher accounts and information</p>
        </div>

        <AgGridBox
          title="Teachers"
          columnDefs={columns}
          rowData={filteredTeachers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          toolbar={toolbar}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editMode ? 'Edit Teacher' : 'Add New Teacher'}
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
                      onChange={(e) => setForm({...form, username: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter username"
                    />
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
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={form.phoneNumber}
                      onChange={(e) => setForm({...form, phoneNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Qualification</label>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={(e) => setForm({...form, qualification: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter qualification"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Designation</label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => setForm({...form, designation: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter designation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salary}
                      onChange={(e) => setForm({...form, salary: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter salary"
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
                    disabled={loading || (form.email && emailError)}
                  >
                    {loading ? 'Saving...' : (editMode ? 'Update Teacher' : 'Create Teacher')}
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
