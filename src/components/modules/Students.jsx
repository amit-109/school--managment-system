import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import { getUsers, createUser, updateUser, deleteUser, getParents, getParentsList, getClasses, createStudentWithParent, getStudentUsers, getStudentById, checkEmailExists as checkEmailExistsAPI } from '../Services/adminService';

export default function Students() {
  const { permissions } = useSelector((state) => state.auth);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [parentExists, setParentExists] = useState(true);
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [selectedParentDetails, setSelectedParentDetails] = useState(null);
  const [sameAsParentAddress, setSameAsParentAddress] = useState(false);
  const [emailErrors, setEmailErrors] = useState({ student: '', parent: '' });
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
    parentId: 0,
    classId: 0
  });
  const [parentForm, setParentForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    occupation: ''
  });

  useEffect(() => {
    loadStudents();
    loadParents();
    loadClasses();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudentUsers();
      if (response.success) {
        setStudents(response.data?.users || []);
      }
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadParents = async () => {
    try {
      const response = await getParentsList();
      console.log('Parents API response:', response);
      if (response.success) {
        const parentUsers = response.data?.data || [];
        setParents(parentUsers);
      } else {
        console.error('Parents API failed:', response);
        setParents([]);
      }
    } catch (error) {
      console.error('Failed to load parents:', error);
      // Fallback to filtering users by Parent role
      try {
        const usersResponse = await getUsers();
        if (usersResponse.success) {
          const parentUsers = usersResponse.data?.users?.filter(user => user.roleName === 'Parent') || [];
          setParents(parentUsers);
        }
      } catch (fallbackError) {
        console.error('Fallback parent loading failed:', fallbackError);
        setParents([]);
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only check email errors if user has entered emails
    if ((form.email && emailErrors.student) || (parentForm.email && emailErrors.parent)) {
      toast.error('Please fix email errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      if (editMode) {
        // For edit mode, use existing update logic with proper field mapping
        const userData = { 
          ...form, 
          roleName: 'Student',
          phone: form.phoneNumber // Map phoneNumber to phone for API
        };
        await updateUser(userData);
        toast.success('Student updated successfully');
      } else {
        // For create mode, use combined API
        const requestData = {
          organizationId: 0, // Handled by backend
          createdBy: 0, // Handled by backend
          parentId: parentExists ? form.parentId : null,
          
          // Parent fields (only used if parentId is null)
          parentFirstName: parentForm.firstName,
          parentLastName: parentForm.lastName,
          parentUsername: parentForm.username,
          parentEmail: parentForm.email,
          parentPasswordHash: parentForm.password, // API will hash this
          parentPhoneNumber: parentForm.phoneNumber,
          parentOccupation: parentForm.occupation,
          parentAddress: parentForm.address,
          
          // Student fields
          studentFirstName: form.firstName,
          studentLastName: form.lastName,
          studentUsername: form.username,
          studentEmail: form.email,
          studentPasswordHash: form.password, // API will hash this
          studentPhoneNumber: form.phoneNumber,
          studentAddress: form.address,
          admissionNo: form.admissionNo,
          classId: form.classId
        };
        
        const response = await createStudentWithParent(requestData);
        if (response.success) {
          toast.success(response.message);
        } else {
          throw new Error(response.message);
        }
      }
      
      setShowModal(false);
      resetForm();
      loadStudents();
      loadParents(); // Reload parents list
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save student';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (userData) => {
    console.log('Student edit data:', userData);
    setLoading(true);
    
    try {
      // Get detailed student data using the new API
      const response = await getStudentById(userData.userId);
      if (response.success) {
        const studentData = response.data;
        setForm({
          userId: studentData.studentUserId,
          roleName: 'Student',
          firstName: studentData.studentFirstName || '',
          lastName: studentData.studentLastName || '',
          username: studentData.studentUsername || '',
          email: studentData.studentEmail || '',
          password: '',
          phoneNumber: studentData.studentPhoneNumber || '',
          address: studentData.address || '',
          admissionNo: studentData.admissionNo || '',
          parentId: studentData.parentId || 0,
          classId: studentData.classId || 0
        });
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
    if (window.confirm(`Are you sure you want to delete ${userData.fullName}?`)) {
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
      parentId: 0,
      classId: 0
    });
    setParentForm({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      occupation: ''
    });
    setParentExists(true);
    setParentSearchTerm('');
    setSelectedParentDetails(null);
    setSameAsParentAddress(false);
    setEmailErrors({ student: '', parent: '' });
    setEditMode(false);
  };

  const handleParentSelect = (parent) => {
    setForm({...form, parentId: parent.parentId});
    setSelectedParentDetails(parent);
    setParentForm({
      firstName: parent.fullName.split(' ')[0] || '',
      lastName: parent.fullName.split(' ').slice(1).join(' ') || '',
      username: parent.username || '',
      email: parent.email || '',
      password: '',
      phoneNumber: parent.phoneNumber || '',
      address: parent.address || '',
      occupation: parent.occupation || ''
    });
  };

  const filteredParents = parents.filter(parent => 
    parent.fullName?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
    parent.username?.toLowerCase().includes(parentSearchTerm.toLowerCase())
  );

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailExists = async (email, type) => {
    if (!email) return;
    
    try {
      const response = await checkEmailExistsAPI(email);
      console.log('Email check response:', response);
      
      // API returns success: true when email exists, success: false when not found
      if (response?.success === true) {
        setEmailErrors(prev => ({
          ...prev,
          [type]: 'Email already exists in system'
        }));
      } else if (response?.success === false) {
        // Email not found - this is good, clear any errors
        setEmailErrors(prev => ({
          ...prev,
          [type]: ''
        }));
      }
    } catch (error) {
      console.error('Email check failed:', error);
      // Clear error on API failure (network issues, etc.)
      setEmailErrors(prev => ({
        ...prev,
        [type]: ''
      }));
    }
  };

  const clearParentData = () => {
    setForm({...form, parentId: 0});
    setParentForm({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      occupation: ''
    });
    setSelectedParentDetails(null);
    setParentSearchTerm('');
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(student => 
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const columns = useMemo(() => [
    { headerName: 'Name', field: 'fullName', sortable: true },
    { headerName: 'Username', field: 'username', sortable: true },
    { headerName: 'Admission No', field: 'admissionNo', sortable: true },
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
                        // Clear errors when typing
                        setEmailErrors(prev => ({...prev, student: ''}));
                      }}
                      onBlur={(e) => {
                        const email = e.target.value.trim();
                        if (email) {
                          if (!validateEmail(email)) {
                            setEmailErrors(prev => ({...prev, student: 'Invalid email format'}));
                          } else {
                            checkEmailExists(email, 'student');
                          }
                        } else {
                          setEmailErrors(prev => ({...prev, student: ''}));
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                        emailErrors.student 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                      }`}
                      placeholder="Enter email address (optional)"
                    />
                    {emailErrors.student && (
                      <p className="text-red-500 text-sm mt-1">{emailErrors.student}</p>
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
                      onChange={(e) => setForm({...form, admissionNo: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter admission number"
                    />
                  </div>
                  
                  {/* Parent Toggle - Only show in create mode */}
                  {!editMode && (
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-sm font-medium">Parent Information:</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="parentOption"
                            checked={parentExists}
                            onChange={() => {
                              setParentExists(true);
                              clearParentData();
                            }}
                            className="text-primary-500"
                          />
                          <span className="text-sm">Select Existing Parent</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="parentOption"
                            checked={!parentExists}
                            onChange={() => {
                              setParentExists(false);
                              clearParentData();
                            }}
                            className="text-primary-500"
                          />
                          <span className="text-sm">Create New Parent</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Parent Selection - Different for create vs edit */}
                  {editMode ? (
                    /* Simple parent dropdown for edit mode */
                    <div>
                      <label className="block text-sm font-medium mb-1">Parent *</label>
                      <select
                        required
                        value={form.parentId || ''}
                        onChange={(e) => setForm({...form, parentId: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      >
                        <option value="">Select Parent</option>
                        {parents.map(parent => (
                          <option key={parent.parentId} value={parent.parentId}>
                            {parent.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : parentExists ? (
                    /* Advanced parent selection for create mode */
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Select Parent *</label>
                      <div className="relative">
                        <select
                          required
                          value={form.parentId || ''}
                          onChange={(e) => {
                            const selectedParent = parents.find(p => p.parentId === parseInt(e.target.value));
                            if (selectedParent) {
                              handleParentSelect(selectedParent);
                            } else {
                              setSelectedParentDetails(null);
                            }
                            setForm({...form, parentId: parseInt(e.target.value) || 0});
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                        >
                          <option value="">Select Parent</option>
                          {parents.map(parent => (
                            <option key={parent.parentId} value={parent.parentId}>
                              {parent.fullName}
                            </option>
                          ))}
                        </select>
                        
                        {/* Display selected parent details */}
                        {selectedParentDetails && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                            <h5 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Selected Parent Details:</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-medium">Name:</span> {selectedParentDetails.fullName}</div>
                              <div><span className="font-medium">Username:</span> {selectedParentDetails.username}</div>
                              <div><span className="font-medium">Email:</span> {selectedParentDetails.email || 'N/A'}</div>
                              <div><span className="font-medium">Phone:</span> {selectedParentDetails.phoneNumber || 'N/A'}</div>
                              <div className="col-span-2"><span className="font-medium">Occupation:</span> {selectedParentDetails.occupation || 'N/A'}</div>
                            </div>
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="Type to search parents..."
                          value={parentSearchTerm}
                          onChange={(e) => setParentSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100 text-sm"
                        />
                        {parentSearchTerm && (
                          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredParents.length > 0 ? (
                              filteredParents.map(parent => (
                                <div
                                  key={parent.parentId}
                                  onClick={() => {
                                    handleParentSelect(parent);
                                    setForm({...form, parentId: parent.parentId});
                                    setParentSearchTerm('');
                                  }}
                                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                                >
                                  <div className="font-medium">{parent.fullName}</div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400">{parent.username} • {parent.phoneNumber}</div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-slate-500 dark:text-slate-400 text-center">No parents found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <h4 className="text-md font-semibold mb-3 text-primary-600 dark:text-primary-400">Parent Information</h4>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent First Name *</label>
                        <input
                          type="text"
                          required={!parentExists}
                          value={parentForm.firstName}
                          onChange={(e) => setParentForm({...parentForm, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Enter parent first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Last Name *</label>
                        <input
                          type="text"
                          required={!parentExists}
                          value={parentForm.lastName}
                          onChange={(e) => setParentForm({...parentForm, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Enter parent last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Username *</label>
                        <input
                          type="text"
                          required={!parentExists}
                          value={parentForm.username}
                          onChange={(e) => setParentForm({...parentForm, username: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Enter parent username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Email</label>
                        <input
                          type="email"
                          value={parentForm.email}
                          onChange={(e) => {
                            const email = e.target.value;
                            setParentForm({...parentForm, email});
                            // Clear errors when typing
                            setEmailErrors(prev => ({...prev, parent: ''}));
                          }}
                          onBlur={(e) => {
                            const email = e.target.value.trim();
                            if (email) {
                              if (!validateEmail(email)) {
                                setEmailErrors(prev => ({...prev, parent: 'Invalid email format'}));
                              } else {
                                checkEmailExists(email, 'parent');
                              }
                            } else {
                              setEmailErrors(prev => ({...prev, parent: ''}));
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                            emailErrors.parent 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                          }`}
                          placeholder="Enter parent email"
                        />
                        {emailErrors.parent && (
                          <p className="text-red-500 text-sm mt-1">{emailErrors.parent}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Password *</label>
                        <input
                          type="password"
                          required={!parentExists}
                          value={parentForm.password}
                          onChange={(e) => setParentForm({...parentForm, password: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Enter parent password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Phone *</label>
                        <input
                          type="tel"
                          required={!parentExists}
                          value={parentForm.phoneNumber}
                          onChange={(e) => setParentForm({...parentForm, phoneNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Enter parent phone"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Parent Occupation</label>
                        <input
                          type="text"
                          value={parentForm.occupation}
                          onChange={(e) => setParentForm({...parentForm, occupation: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          placeholder="Enter parent occupation"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Parent Address</label>
                        <textarea
                          value={parentForm.address}
                          onChange={(e) => {
                            setParentForm({...parentForm, address: e.target.value});
                            if (sameAsParentAddress) {
                              setForm({...form, address: e.target.value});
                            }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                          rows={2}
                          placeholder="Enter parent address"
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Class *</label>
                    <select
                      required
                      value={form.classId || ''}
                      onChange={(e) => setForm({...form, classId: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select Class</option>
                      {classes.map(cls => (
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
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Address</label>
                      {!editMode && !parentExists && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sameAsParentAddress}
                            onChange={(e) => {
                              setSameAsParentAddress(e.target.checked);
                              if (e.target.checked) {
                                setForm({...form, address: parentForm.address});
                              } else {
                                setForm({...form, address: ''});
                              }
                            }}
                            className="text-primary-500"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">Same as Parent Address</span>
                        </label>
                      )}
                    </div>
                    <textarea
                      value={form.address}
                      onChange={(e) => {
                        setForm({...form, address: e.target.value});
                        if (sameAsParentAddress) setSameAsParentAddress(false);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      rows={2}
                      placeholder="Enter address"
                      disabled={sameAsParentAddress}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading || (form.email && emailErrors.student) || (parentForm.email && emailErrors.parent)}
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