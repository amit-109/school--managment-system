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
  getSections,
  getStudentUsers,
  getStudentById,
  checkEmailExists as checkEmailExistsAPI,
  checkUsernameExists as checkUsernameExistsAPI,
  checkAdmissionNoExists as checkAdmissionNoExistsAPI,
  allocateNextAdmissionNo
} from '../Services/adminService';
import apiClient from '../Auth/base';
import { pickLatestSession } from '../utils/sessionUtils';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
const STUDENT_TYPE_OPTIONS = ['Regular', 'Private'];

const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const emptyStudentForm = {
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
  sectionId: 0,
  studentType: 'Regular',
  gender: '',
  category: ''
};

export default function Students() {
  const { permissions } = useSelector((state) => state.auth);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
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
  const [prefixError, setPrefixError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState(emptyStudentForm);
  const [showOldFeeModal, setShowOldFeeModal] = useState(false);
  const [oldFeeForm, setOldFeeForm] = useState({
    oldFeeId: 0,
    studentId: 0,
    studentName: '',
    sessionId: '',
    totalAmount: '',
    notes: '',
    paidAmount: 0,
    leftAmount: 0
  });
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [concessionForm, setConcessionForm] = useState({
    concessionId: 0,
    studentId: 0,
    studentName: '',
    sessionId: '',
    amount: '',
    notes: ''
  });
  const [sessions, setSessions] = useState([]);

  const ensureSessions = async () => {
    let sessionsList = sessions;
    if (!sessionsList.length) {
      try {
        const dd = await apiClient.get('/admin/fees/dropdowns');
        sessionsList = (dd.data?.data?.sessions || []).filter((s) => s.isActive !== false);
        setSessions(sessionsList);
      } catch {
        sessionsList = [];
      }
    }
    return sessionsList;
  };

  const openOldFeeModal = async (student) => {
    const studentId = student.userId || student.UserId;
    const studentName = student.fullName || student.FullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const sessionsList = await ensureSessions();
    const latestSession = pickLatestSession(sessionsList);
    let existing = null;
    try {
      const res = await apiClient.get(`/admin/fees/old-fees/${studentId}`);
      existing = res.data?.success ? res.data.data : null;
    } catch {
      existing = null;
    }
    setOldFeeForm({
      oldFeeId: existing?.oldFeeId || existing?.OldFeeId || 0,
      studentId,
      studentName,
      sessionId: String(existing?.sessionId || existing?.SessionId || latestSession?.sessionId || latestSession?.SessionId || ''),
      totalAmount: existing ? String(existing.totalAmount ?? existing.TotalAmount ?? '') : '',
      notes: existing?.notes || existing?.Notes || '',
      paidAmount: Number(existing?.paidAmount ?? existing?.PaidAmount ?? 0),
      leftAmount: Number(existing?.leftAmount ?? existing?.LeftAmount ?? 0)
    });
    setShowOldFeeModal(true);
  };

  const saveOldFee = async () => {
    if (!oldFeeForm.totalAmount || Number(oldFeeForm.totalAmount) <= 0) {
      toast.error('Enter a valid old fee amount');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        oldFeeId: oldFeeForm.oldFeeId || 0,
        studentId: oldFeeForm.studentId,
        sessionId: oldFeeForm.sessionId ? parseInt(oldFeeForm.sessionId, 10) : null,
        totalAmount: parseFloat(oldFeeForm.totalAmount),
        notes: oldFeeForm.notes || null,
        isActive: true
      };
      const res = await apiClient.post('/admin/fees/old-fees', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Old fee saved');
        setShowOldFeeModal(false);
      } else {
        toast.error(res.data.message || 'Failed to save old fee');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save old fee');
    } finally {
      setLoading(false);
    }
  };

  const deleteOldFee = async () => {
    if (!oldFeeForm.oldFeeId) return;
    const confirm = await Swal.fire({
      title: 'Remove old fee?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove'
    });
    if (!confirm.isConfirmed) return;
    setLoading(true);
    try {
      const res = await apiClient.delete(`/admin/fees/old-fees/${oldFeeForm.oldFeeId}`);
      if (res.data.success) {
        toast.success('Old fee removed');
        setShowOldFeeModal(false);
      } else {
        toast.error(res.data.message || 'Failed to remove');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    } finally {
      setLoading(false);
    }
  };

  const openConcessionModal = async (student) => {
    const studentId = student.userId || student.UserId;
    const studentName = student.fullName || student.FullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const sessionsList = await ensureSessions();
    const latestSession = pickLatestSession(sessionsList);
    let existing = null;
    try {
      const res = await apiClient.get(`/admin/fees/student-concessions/${studentId}`);
      existing = res.data?.success ? res.data.data : null;
    } catch {
      existing = null;
    }
    setConcessionForm({
      concessionId: existing?.concessionId || existing?.ConcessionId || 0,
      studentId,
      studentName,
      sessionId: String(existing?.sessionId || existing?.SessionId || latestSession?.sessionId || latestSession?.SessionId || ''),
      amount: existing ? String(existing.amount ?? existing.Amount ?? '') : '',
      notes: existing?.notes || existing?.Notes || ''
    });
    setShowConcessionModal(true);
  };

  const saveConcession = async () => {
    if (!concessionForm.amount || Number(concessionForm.amount) <= 0) {
      toast.error('Enter a valid concession amount');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        concessionId: concessionForm.concessionId || 0,
        studentId: concessionForm.studentId,
        sessionId: concessionForm.sessionId ? parseInt(concessionForm.sessionId, 10) : null,
        amount: parseFloat(concessionForm.amount),
        notes: concessionForm.notes || null,
        isActive: true
      };
      const res = await apiClient.post('/admin/fees/student-concessions', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Concession saved');
        setShowConcessionModal(false);
      } else {
        toast.error(res.data.message || 'Failed to save concession');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save concession');
    } finally {
      setLoading(false);
    }
  };

  const deleteConcession = async () => {
    if (!concessionForm.concessionId) return;
    const confirm = await Swal.fire({
      title: 'Remove concession?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove'
    });
    if (!confirm.isConfirmed) return;
    setLoading(true);
    try {
      const res = await apiClient.delete(`/admin/fees/student-concessions/${concessionForm.concessionId}`);
      if (res.data.success) {
        toast.success('Concession removed');
        setShowConcessionModal(false);
      } else {
        toast.error(res.data.message || 'Failed to remove');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    } finally {
      setLoading(false);
    }
  };

  const dropdownClasses = useMemo(() => {
    return (classes || []).filter((cls) => {
      if (cls.isActive !== false) return true;
      return editMode && Number(form.classId) === Number(cls.classId);
    });
  }, [classes, editMode, form.classId]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadStudents(currentPage, pageSize, searchTerm, statusFilter, classFilter, typeFilter);
  }, [currentPage, pageSize, searchTerm, statusFilter, classFilter, typeFilter]);

  const loadStudents = async (
    pageNumber = 1,
    size = 10,
    search = '',
    status = 'All',
    classId = '',
    studentType = ''
  ) => {
    setLoading(true);
    try {
      const response = await getStudentUsers(
        pageNumber,
        size,
        search,
        status === 'All' ? '' : status,
        classId,
        studentType
      );
      if (response.success) {
        setStudents(response.data?.users || []);
        setTotalCount(response.data?.totalCount || response.data?.users?.length || 0);
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

  const loadSectionsForClass = async (classId) => {
    if (!classId) {
      setSections([]);
      return [];
    }
    try {
      const response = await getSections(classId);
      const list = response.success ? (response.data || []) : [];
      setSections(list);
      return list;
    } catch (error) {
      console.error('Failed to load sections:', error);
      setSections([]);
      return [];
    }
  };

  const applyCredentialsForClass = async (classId) => {
    setPrefixError('');
    setAdmissionNoError('');
    setUsernameError('');
    if (!classId) {
      setForm((prev) => ({
        ...prev,
        classId: 0,
        sectionId: 0,
        admissionNo: '',
        username: '',
        password: ''
      }));
      return;
    }

    try {
      const response = await allocateNextAdmissionNo(classId);
      if (!response.success) {
        setPrefixError(response.message || 'Configure admission prefix for this class first.');
        setForm((prev) => ({
          ...prev,
          classId,
          sectionId: 0,
          admissionNo: '',
          username: '',
          password: ''
        }));
        return;
      }

      const admissionNo = response.data?.admissionNo || '';
      const password = generatePassword(8);
      setForm((prev) => ({
        ...prev,
        classId,
        sectionId: 0,
        admissionNo,
        username: admissionNo,
        password
      }));
    } catch (error) {
      const msg = error.response?.data?.message || 'Configure admission prefix for this class first.';
      setPrefixError(msg);
      setForm((prev) => ({
        ...prev,
        classId,
        sectionId: 0,
        admissionNo: '',
        username: '',
        password: ''
      }));
    }
  };

  const handleClassChange = async (classId) => {
    const id = parseInt(classId, 10) || 0;
    await loadSectionsForClass(id);
    if (!editMode) {
      await applyCredentialsForClass(id);
    } else {
      setForm((prev) => ({ ...prev, classId: id, sectionId: 0 }));
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

    if (!form.classId) {
      toast.error('Class is required');
      return;
    }

    if (sections.length > 0 && !form.sectionId) {
      toast.error('Section is required for the selected class');
      return;
    }

    if (!form.studentType) {
      toast.error('Student type is required');
      return;
    }

    if (!editMode && (!form.admissionNo || !form.username || !form.password)) {
      toast.error(prefixError || 'Select a class with an admission prefix to generate credentials');
      return;
    }

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
        phone: form.phoneNumber,
        sectionId: form.sectionId || null,
        classId: form.classId || null
      };

      if (editMode) {
        await updateUser(userData);
        toast.success('Student updated successfully');
      } else {
        await createUser(userData);
        toast.success(`Student created. Username: ${form.username} / Password: ${form.password}`);
      }

      setShowModal(false);
      resetForm();
      loadStudents(currentPage, pageSize, searchTerm, statusFilter, classFilter, typeFilter);
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
        const resolvedSectionId = parseInt(
          studentData.sectionId ?? studentData.currentSectionId ?? 0,
          10
        ) || 0;

        await loadSectionsForClass(resolvedClassId);

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
          sectionId: resolvedSectionId,
          studentType: studentData.studentType || 'Regular',
          gender: studentData.gender || studentData.studentGender || '',
          category: studentData.category || studentData.studentCategory || ''
        });

        setOriginalEmail(email);
        setOriginalUsername(username);
        setOriginalAdmissionNo(admissionNo);
        setUsernameError('');
        setAdmissionNoError('');
        setPrefixError('');
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
      loadStudents(currentPage, pageSize, searchTerm, statusFilter, classFilter, typeFilter);
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyStudentForm);
    setSections([]);
    setEmailError('');
    setOriginalEmail('');
    setUsernameError('');
    setOriginalUsername('');
    setAdmissionNoError('');
    setOriginalAdmissionNo('');
    setPrefixError('');
    setEditMode(false);
  };

  const filteredStudents = students;

  const columns = useMemo(() => [
    { headerName: 'Name', field: 'fullName', sortable: true },
    { headerName: 'Username', field: 'username', sortable: true },
    { headerName: 'Admission No', field: 'admissionNo', sortable: true },
    { headerName: 'Class', field: 'className', sortable: true, valueGetter: (params) => params.data?.className || '' },
    {
      headerName: 'Section',
      field: 'sectionName',
      sortable: true,
      valueGetter: (params) =>
        params.data?.sectionName ||
        params.data?.SectionName ||
        params.data?.currentSectionName ||
        ''
    },
    {
      headerName: 'Type',
      field: 'studentType',
      sortable: true,
      valueGetter: (params) =>
        params.data?.studentType ||
        params.data?.StudentType ||
        params.data?.type ||
        ''
    },
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
    },
    {
      headerName: 'Old Fee',
      field: 'oldFee',
      width: 110,
      cellRenderer: (params) => (
        <button
          type="button"
          className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
          onClick={() => openOldFeeModal(params.data)}
        >
          Map Old Fee
        </button>
      )
    },
    {
      headerName: 'Concession',
      field: 'concession',
      width: 130,
      cellRenderer: (params) => (
        <button
          type="button"
          className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
          onClick={() => openConcessionModal(params.data)}
        >
          Map Concession
        </button>
      )
    }
  ], []);

  const toolbar = (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full">
      <div className="relative w-full sm:w-auto">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-56 md:w-64 px-3 py-1.5 pl-9 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
        <svg className="absolute left-3 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        className="w-full sm:w-auto px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

      <select
        value={classFilter}
        onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
        className="w-full sm:w-auto px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
      >
        <option value="">All Classes</option>
        {(classes || []).filter((c) => c.isActive !== false).map((cls) => (
          <option key={cls.classId} value={cls.classId}>{cls.className}</option>
        ))}
      </select>

      <select
        value={typeFilter}
        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
        className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
      >
        <option value="">All Types</option>
        <option value="Regular">Regular</option>
        <option value="Private">Private</option>
      </select>

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

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto">
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
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({...form, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="Enter last name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Class *</label>
                    <select
                      required
                      value={form.classId || ''}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select Class</option>
                      {dropdownClasses.map((cls) => (
                        <option key={cls.classId} value={cls.classId}>
                          {cls.className}{cls.isActive === false ? ' (Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                    {prefixError && !editMode && (
                      <p className="text-red-500 text-sm mt-1">{prefixError}</p>
                    )}
                  </div>

                  {sections.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Section *</label>
                    <select
                      required
                      value={form.sectionId || ''}
                      onChange={(e) => setForm({ ...form, sectionId: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select Section</option>
                      {sections.map((sec) => (
                        <option key={sec.sectionId} value={sec.sectionId}>
                          {sec.sectionName}
                        </option>
                      ))}
                    </select>
                  </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Student Type *</label>
                    <select
                      required
                      value={form.studentType || 'Regular'}
                      onChange={(e) => setForm({ ...form, studentType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      {STUDENT_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Admission Number *</label>
                    <input
                      type="text"
                      required
                      readOnly={!editMode}
                      value={form.admissionNo}
                      onChange={(e) => {
                        if (editMode) {
                          const admissionNo = e.target.value;
                          setForm({...form, admissionNo});
                          setAdmissionNoError('');
                        }
                      }}
                      onBlur={(e) => {
                        if (!editMode) return;
                        const admissionNo = e.target.value.trim();
                        if (!admissionNo) {
                          setAdmissionNoError('');
                          return;
                        }
                        if (admissionNo === originalAdmissionNo) {
                          setAdmissionNoError('');
                          return;
                        }
                        checkAdmissionNoExists(admissionNo);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                        !editMode ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                      } ${
                        admissionNoError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                      }`}
                      placeholder={editMode ? 'Admission number' : 'Auto from class prefix'}
                    />
                    {admissionNoError && (
                      <p className="text-red-500 text-sm mt-1">{admissionNoError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      readOnly={!editMode}
                      value={form.username}
                      onChange={(e) => {
                        if (editMode) {
                          const username = e.target.value;
                          setForm({...form, username});
                          setUsernameError('');
                        }
                      }}
                      onBlur={(e) => {
                        if (!editMode) return;
                        const username = e.target.value.trim();
                        if (!username) {
                          setUsernameError('');
                          return;
                        }
                        if (username === originalUsername) {
                          setUsernameError('');
                          return;
                        }
                        checkUsernameExists(username);
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-slate-700 dark:text-slate-100 ${
                        !editMode ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                      } ${
                        usernameError
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-primary-500'
                      }`}
                      placeholder={editMode ? 'Username' : 'Auto = admission no'}
                    />
                    {usernameError && (
                      <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {editMode ? 'Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required={!editMode}
                        readOnly={!editMode}
                        value={form.password}
                        onChange={(e) => {
                          if (editMode) setForm({...form, password: e.target.value});
                        }}
                        className={`w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100 ${
                          !editMode ? 'bg-slate-100 dark:bg-slate-600 cursor-not-allowed' : ''
                        }`}
                        placeholder={editMode ? 'Leave blank to keep' : 'Auto generated'}
                      />
                      {!editMode && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, password: generatePassword(8) }))}
                          className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 whitespace-nowrap"
                          title="Regenerate password"
                        >
                          Regen
                        </button>
                      )}
                    </div>
                    {!editMode && form.password && (
                      <p className="text-xs text-slate-500 mt-1">Share this password with the student — it is shown only once.</p>
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

        {showOldFeeModal && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold">Map Old Fee — {oldFeeForm.studentName}</h3>
              {oldFeeForm.oldFeeId > 0 && (
                <p className="text-sm text-slate-600">
                  Paid: {oldFeeForm.paidAmount.toFixed(2)} | Left: {oldFeeForm.leftAmount.toFixed(2)}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Session</label>
                <select
                  value={oldFeeForm.sessionId}
                  onChange={(e) => setOldFeeForm((f) => ({ ...f, sessionId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                >
                  <option value="">Optional</option>
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Old Fee Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={oldFeeForm.totalAmount}
                  onChange={(e) => setOldFeeForm((f) => ({ ...f, totalAmount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={oldFeeForm.notes}
                  onChange={(e) => setOldFeeForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={saveOldFee} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg">
                  Save
                </button>
                {oldFeeForm.oldFeeId > 0 && oldFeeForm.paidAmount <= 0 && (
                  <button type="button" onClick={deleteOldFee} className="px-4 py-2 border border-red-400 text-red-600 rounded-lg">
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => setShowOldFeeModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showConcessionModal && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold">Map Concession — {concessionForm.studentName}</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Session</label>
                <select
                  value={concessionForm.sessionId}
                  onChange={(e) => setConcessionForm((f) => ({ ...f, sessionId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                >
                  <option value="">Optional</option>
                  {sessions.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>{s.sessionName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Concession Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={concessionForm.amount}
                  onChange={(e) => setConcessionForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={concessionForm.notes}
                  onChange={(e) => setConcessionForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={saveConcession} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg">
                  Save
                </button>
                {concessionForm.concessionId > 0 && (
                  <button type="button" onClick={deleteConcession} className="px-4 py-2 border border-red-400 text-red-600 rounded-lg">
                    Remove
                  </button>
                )}
                <button type="button" onClick={() => setShowConcessionModal(false)} className="flex-1 px-4 py-2 border rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
}
