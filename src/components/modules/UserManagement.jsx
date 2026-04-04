import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import PermissionButton from '../shared/PermissionButton';
import { getUsers, createUser, updateUser, deleteUser, getAvailableRoles, getClasses, checkEmailExists as checkEmailExistsAPI, checkUsernameExists as checkUsernameExistsAPI, checkAdmissionNoExists as checkAdmissionNoExistsAPI } from '../Services/adminService';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];

export default function UserManagement() {
  const { permissions } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailError, setEmailError] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [admissionNoError, setAdmissionNoError] = useState('');
  const [originalAdmissionNo, setOriginalAdmissionNo] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form, setForm] = useState({
    userId: 0,
    roleName: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    qualification: '',
    designation: '',
    salary: 0,
    occupation: '',
    address: '',
    admissionNo: '',
    fatherName: '',
    motherName: '',
    classId: 0,
    gender: '',
    category: ''
  });

  useEffect(() => {
    loadRoles();
    loadClasses();
  }, []);

  useEffect(() => {
    loadUsers(currentPage, pageSize, searchTerm, roleFilter !== 'All' ? roleFilter : '');
  }, [currentPage, pageSize, searchTerm, roleFilter]);

  // Note: We use client-side filtering with filteredUsers instead of API calls

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const loadUsers = async (pageNumber = 1, size = 10, search = '', filter = '') => {
    setLoading(true);
    try {
      const response = await getUsers(pageNumber, size, search, filter);
      if (response.success) {
        setUsers(response.data?.users || []);
        setTotalCount(response.data?.totalCount || response.data?.users?.length || 0);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await getAvailableRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await getClasses();
      if (response.success && response.data?.length > 0) {
        setClasses(response.data);
      } else {
        // Fallback to dummy data if API returns no data
        setClasses([
          { classId: 1, className: 'Grade 1' },
          { classId: 2, className: 'Grade 2' },
          { classId: 3, className: 'Grade 3' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      // Fallback to dummy data if API fails
      setClasses([
        { classId: 1, className: 'Grade 1' },
        { classId: 2, className: 'Grade 2' },
        { classId: 3, className: 'Grade 3' }
      ]);
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

    if (selectedRole === 'Student' && admissionNoError) {
      toast.error('Please fix admission number errors before submitting');
      return;
    }

    // Only check email errors if user has entered an email
    if (form.email && emailError) {
      toast.error('Please fix email errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        ...form,
        roleName: selectedRole
      };

      if (editMode) {
        await updateUser(userData);
        toast.success('User updated successfully');
      } else {
        await createUser(userData);
        toast.success('User created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadUsers(currentPage, pageSize, searchTerm, roleFilter !== 'All' ? roleFilter : '');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save user';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userData) => {
    const email = userData.email || '';
    const username = userData.username || '';
    const admissionNo = userData.admissionNo || userData.studentAdmissionNo || '';
    const resolvedClassId = parseInt(
      userData.classId ?? userData.currentClassId ?? userData.studentClassId ?? 0,
      10
    ) || 0;

    setForm({
      userId: userData.userId,
      roleName: userData.roleName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: username,
      email: email,
      password: '', // Don't populate password for security
      phoneNumber: userData.phoneNumber || userData.phone,
      qualification: userData.qualification,
      designation: userData.designation,
      salary: userData.salary || 0,
      occupation: userData.occupation,
      address: userData.address,
      admissionNo: admissionNo,
      fatherName: userData.fatherName || '',
      motherName: userData.motherName || '',
      classId: resolvedClassId,
      gender: userData.gender || '',
      category: userData.category || ''
    });
    setSelectedRole(userData.roleName);
    setOriginalEmail(email);
    setOriginalUsername(username);
    setUsernameError('');
    setOriginalAdmissionNo(admissionNo);
    setAdmissionNoError('');
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (userData) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete user "${userData.fullName}"? This action cannot be undone.`,
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
      toast.success('User deleted successfully');
      loadUsers(currentPage, pageSize, searchTerm, roleFilter !== 'All' ? roleFilter : '');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      userId: 0,
      roleName: '',
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
      qualification: '',
      designation: '',
      salary: 0,
      occupation: '',
      address: '',
      admissionNo: '',
      fatherName: '',
      motherName: '',
      classId: 0,
      gender: '',
      category: ''
    });
    setSelectedRole('');
    setEmailError('');
    setOriginalEmail('');
    setUsernameError('');
    setOriginalUsername('');
    setAdmissionNoError('');
    setOriginalAdmissionNo('');
    setEditMode(false);
  };

  const handleView = (userData) => {
    setViewUser(userData);
    setShowViewModal(true);
  };

  const handleExport = async () => {
    try {
      // Export all users by getting them all at once
      const response = await getUsers(1, 10000, '', '');
      if (response.success) {
        const allUsers = response.data?.users || [];
        const csvData = allUsers.map(user => ({
          'Full Name': user.fullName,
          'Username': user.username,
          'Role': user.roleName,
          'Email': user.email,
          'Phone': user.phone || '',
          'Status': user.status,
          'Admission No': user.admissionNo || '',
          'Father Name': user.fatherName || '',
          'Mother Name': user.motherName || '',
          'Qualification': user.qualification || '',
          'Designation': user.designation || '',
          'Salary': user.salary || '',
          'Occupation': user.occupation || '',
          'Gender': user.gender || '',
          'Category': user.category || '',
          'Address': user.address || ''
        }));

        const csvContent = [
          Object.keys(csvData[0] || {}).join(','),
          ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Users exported successfully!');
      }
    } catch (error) {
      toast.error('Failed to export users');
    }
  };

  const getFieldsForRole = (role) => {
    const baseFields = ['firstName', 'lastName', 'username', 'email', 'password'];

    switch (role) {
      case 'Teacher':
        return [...baseFields, 'phoneNumber', 'gender', 'category', 'qualification', 'designation', 'salary', 'address'];
      case 'Student':
        return [...baseFields, 'admissionNo', 'fatherName', 'motherName', 'gender', 'category', 'classId', 'phoneNumber', 'address'];
      case 'Parent':
        return [...baseFields, 'phoneNumber', 'gender', 'category', 'occupation', 'address'];
      default:
        return [...baseFields, 'phoneNumber', 'gender', 'category', 'address'];
    }
  };

  const isFieldRequired = (field, role) => {
    const requiredFields = {
      Teacher: ['firstName', 'lastName', 'username', 'email', 'password', 'phoneNumber'],
      Student: ['firstName', 'lastName', 'username', 'password', 'admissionNo', 'classId'],
      Parent: ['firstName', 'lastName', 'username', 'email', 'password', 'phoneNumber']
    };
    return requiredFields[role]?.includes(field) || false;
  };

  const selectableRoles = useMemo(() => (
    roles.filter((role) => role?.roleName?.toLowerCase() !== 'parent')
  ), [roles]);

  const filteredUsers = users;

  const columns = useMemo(() => [
    {
      headerName: 'Name',
      field: 'fullName',
      sortable: true
    },
    {
      headerName: 'Username',
      field: 'username',
      sortable: true
    },
    {
      headerName: 'Role',
      field: 'roleName',
      sortable: true
    },
    {
      headerName: 'Email',
      field: 'email',
      sortable: true
    },
    {
      headerName: 'Phone',
      field: 'phone',
      sortable: true
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64 px-3 py-1.5 pl-9 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
        <svg className="absolute left-3 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Role Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role:</label>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilterChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        >
          <option value="All">All</option>
          {selectableRoles.map(role => (
            <option key={role.roleName} value={role.roleName}>
              {role.roleName}
            </option>
          ))}
        </select>
      </div>
      
      <PermissionButton
        moduleName="User Management"
        subModuleName="Users"
        action="create"
        onClick={() => {
          resetForm();
          setShowModal(true);
        }}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add User
      </PermissionButton>
    </div>
  );

  const renderField = (fieldName, role) => {
    const fields = getFieldsForRole(role);
    if (!fields.includes(fieldName)) return null;

    const isRequired = isFieldRequired(fieldName, role);
    const fieldConfig = {
      firstName: { label: 'First Name', type: 'text', placeholder: 'Enter first name' },
      lastName: { label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
      username: { label: 'Username', type: 'text', placeholder: 'Enter username' },
      email: { label: 'Email', type: 'email', placeholder: 'Enter email address (optional)' },
      password: { label: editMode ? 'Password (leave blank to keep current)' : 'Password', type: 'password', placeholder: 'Enter password' },
      phoneNumber: { label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
      qualification: { label: 'Qualification', type: 'text', placeholder: 'Enter qualification' },
      designation: { label: 'Designation', type: 'text', placeholder: 'Enter designation' },
      salary: { label: 'Salary', type: 'number', placeholder: 'Enter salary' },
      occupation: { label: 'Occupation', type: 'text', placeholder: 'Enter occupation' },
      gender: { label: 'Gender', type: 'select-gender' },
      category: { label: 'Category', type: 'select-category' },
      fatherName: { label: 'Father Name', type: 'text', placeholder: 'Enter father name (optional)' },
      motherName: { label: 'Mother Name', type: 'text', placeholder: 'Enter mother name (optional)' },
      classId: { label: 'Class', type: 'select-class' },
      address: { label: 'Address', type: 'textarea', placeholder: 'Enter address' },
      admissionNo: { label: 'Admission Number', type: 'text', placeholder: 'Enter admission number' }
    };

    const config = fieldConfig[fieldName];
    if (!config) return null;

    if (fieldName === 'classId') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            Class {isRequired && '*'}
          </label>
          <select
            required={isRequired}
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
      );
    }

    if (fieldName === 'gender') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            {config.label} {isRequired && '*'}
          </label>
          <select
            required={isRequired}
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
      );
    }

    if (fieldName === 'category') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            {config.label} {isRequired && '*'}
          </label>
          <select
            required={isRequired}
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
      );
    }

    if (config.type === 'textarea') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            {config.label} {isRequired && '*'}
          </label>
          <textarea
            required={isRequired && !editMode}
            value={form[fieldName]}
            onChange={(e) => setForm({...form, [fieldName]: e.target.value})}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
            rows={2}
            placeholder={config.placeholder}
          />
        </div>
      );
    }

    if (fieldName === 'email') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            {config.label} {isRequired && '*'}
          </label>
          <input
            type={config.type}
            required={isRequired && !(editMode && fieldName === 'password')}
            value={form[fieldName]}
            onChange={(e) => {
              const email = e.target.value;
              setForm({...form, [fieldName]: email});
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
            placeholder={config.placeholder}
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>
      );
    }

    if (fieldName === 'username') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            {config.label} {isRequired && '*'}
          </label>
          <input
            type={config.type}
            required={isRequired}
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
            placeholder={config.placeholder}
          />
          {usernameError && (
            <p className="text-red-500 text-sm mt-1">{usernameError}</p>
          )}
        </div>
      );
    }

    if (fieldName === 'admissionNo') {
      return (
        <div key={fieldName}>
          <label className="block text-sm font-medium mb-1">
            {config.label} {isRequired && '*'}
          </label>
          <input
            type={config.type}
            required={isRequired}
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
            placeholder={config.placeholder}
          />
          {admissionNoError && (
            <p className="text-red-500 text-sm mt-1">{admissionNoError}</p>
          )}
        </div>
      );
    }

    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium mb-1">
          {config.label} {isRequired && '*'}
        </label>
        <input
          type={config.type}
          required={isRequired && !(editMode && fieldName === 'password')}
          value={form[fieldName]}
          onChange={(e) => setForm({...form, [fieldName]: config.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value})}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
          placeholder={config.placeholder}
        />
      </div>
    );
  };

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">User Management</h1>
            <p className="text-sm text-slate-600">Manage teachers and students</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
            disabled={users.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        <AgGridBox
          title={`Users ${roleFilter !== 'All' ? `(${roleFilter})` : ''}`}
          columnDefs={columns}
          rowData={filteredUsers}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          toolbar={toolbar}
          serverPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalRecords={totalCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editMode ? 'Edit User' : 'Add New User'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    required
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    disabled={editMode}
                  >
                    <option value="">Select Role</option>
                    {selectableRoles.map(role => (
                      <option key={role.roleName} value={role.roleName}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRole && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getFieldsForRole(selectedRole).map(field => renderField(field, selectedRole))}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading || !selectedRole || !!usernameError || (selectedRole === 'Student' && !!admissionNoError) || (form.email && emailError)}
                  >
                    {loading ? 'Saving...' : (editMode ? 'Update User' : 'Create User')}
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

        {/* View Modal */}
        {showViewModal && viewUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Details</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Full Name</label>
                    <p className="text-slate-900 dark:text-slate-100 font-medium">{viewUser.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Username</label>
                    <p className="text-slate-900 dark:text-slate-100">{viewUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Role</label>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {viewUser.roleName}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                    <p className="text-slate-900 dark:text-slate-100">{viewUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Phone</label>
                    <p className="text-slate-900 dark:text-slate-100">{viewUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                      viewUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewUser.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </LoadingOverlay>
  );
}
