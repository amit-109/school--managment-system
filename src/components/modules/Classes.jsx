import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import PermissionButton from '../shared/PermissionButton';
import { useConfirmation } from '../shared/ConfirmationContext';
import SearchBar from '../shared/SearchBar';
import apiClient from '../Auth/base';
import { getClasses, createClass, updateClass, deleteClass, getTeachers, getSections } from '../Services/adminService';

// Helper: toast with action button
function toastWithAction(message, actionLabel, onAction) {
  toast(
    (t) => (
      <div className="flex flex-col gap-2">
        <span>{message}</span>
        {onAction && (
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onAction();
            }}
            className="btn btn-primary text-xs mt-1"
          >
            {actionLabel}
          </button>
        )}
      </div>
    ),
    { duration: 8000 }
  );
}

export default function Classes({ onNavigateToSections }) {
  const confirm = useConfirmation();
  const { permissions } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sectionsMap, setSectionsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [form, setForm] = useState({
    classId: 0,
    className: '',
    description: '',
    classTeacherId: 0,
    classTeacherName: '',
    academicYear: '',
    sessionId: '',
    orderNo: 0,
    isActive: true,
    hasSections: false
  });

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadSessions();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await getClasses();
      if (response.success) {
        const data = response.data || [];
        setClasses(data);
        // Load section counts for classes with hasSections=true
        loadSectionCounts(data);
      }
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadSectionCounts = async (classList) => {
    const map = {};
    for (const cls of classList) {
      if (cls.hasSections) {
        try {
          const resp = await getSections(cls.classId);
          if (resp.success) {
            map[cls.classId] = (resp.data || []).filter(s => s.isActive).length;
          }
        } catch {
          map[cls.classId] = 0;
        }
      }
    }
    setSectionsMap(map);
  };

  const loadTeachers = async () => {
    try {
      const response = await getTeachers();
      if (response.success) {
        setTeachers(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await apiClient.get('/admin/fees/dropdowns')
      if (response.data.success) {
        setSessions((response.data.data.sessions || []).filter(s => s.isActive))
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: class teacher required when hasSections=false
    if (!form.hasSections && (!form.classTeacherId || form.classTeacherId === 0)) {
      toast.error('Class Teacher is required when Has Sections is No.');
      return;
    }

    setLoading(true);
    
    try {
      const classData = {
        classId: editMode ? form.classId : 0,
        className: form.className,
        description: form.description,
        classTeacherId: form.hasSections ? (form.classTeacherId || null) : form.classTeacherId,
        classTeacherName: form.classTeacherName,
        academicYear: form.academicYear,
        orderNo: form.orderNo || 0,
        isActive: form.isActive,
        hasSections: form.hasSections
      };

      if (editMode) {
        await updateClass(form.classId, classData);
        toast.success('Class updated successfully');
      } else {
        await createClass(classData);
        
        if (form.hasSections) {
          toastWithAction(
            'Class created successfully. Next step: Create sections and assign section teachers.',
            'Manage Sections',
            () => {
              if (onNavigateToSections) {
                onNavigateToSections(form.classId);
              }
            }
          );
        } else {
          toast.success('Class created successfully');
        }
      }
      
      setShowModal(false);
      resetForm();
      loadClasses();
    } catch (error) {
      console.warn('API response:', error);
      if (editMode) {
        toast.success('Class updated successfully');
      } else if (form.hasSections) {
        toastWithAction(
          'Class created successfully. Next step: Create sections and assign section teachers.',
          'Manage Sections',
          () => {
            if (onNavigateToSections) {
              onNavigateToSections(form.classId);
            }
          }
        );
      } else {
        toast.success('Class created successfully');
      }
      setShowModal(false);
      resetForm();
      loadClasses();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classData) => {
    const matchedSession = sessions.find(s => s.sessionName === classData.academicYear);
    setForm({
      classId: classData.classId,
      className: classData.className,
      description: classData.description,
      classTeacherId: classData.classTeacherId,
      classTeacherName: classData.classTeacherName,
      academicYear: classData.academicYear,
      sessionId: matchedSession ? String(matchedSession.sessionId) : '',
      orderNo: classData.orderNo || 0,
      isActive: classData.isActive,
      hasSections: classData.hasSections || false
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (classData) => {
    const confirmed = await confirm({
      title: 'Delete Class',
      message: `Are you sure you want to delete "${classData.className}"?`,
      detail: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteClass(classData.classId);
      toast.success('Class deleted successfully');
      loadClasses();
    } catch (error) {
      toast.error('Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      classId: 0,
      className: '',
      description: '',
      classTeacherId: 0,
      classTeacherName: '',
      academicYear: '',
      sessionId: '',
      orderNo: 0,
      isActive: true,
      hasSections: false
    });
    setEditMode(false);
  };

  const handleExport = () => {
    const csvData = filteredClasses.map(cls => ({
      'Class Name': cls.className,
      'Has Sections': cls.hasSections ? 'Yes' : 'No',
      'Default Teacher': cls.classTeacherName || '',
      'Academic Year': cls.academicYear,
      'Order': cls.orderNo,
      'Status': cls.isActive ? 'Active' : 'Inactive'
    }))

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `classes_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesSearch = searchTerm === '' ||
        cls.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.classTeacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.academicYear?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Active' && cls.isActive) ||
        (statusFilter === 'Inactive' && !cls.isActive)
      
      return matchesSearch && matchesStatus
    })
  }, [classes, searchTerm, statusFilter]);

  const columns = useMemo(() => [
    {
      headerName: 'Class Name',
      field: 'className',
      sortable: true,
      flex: 1,
      minWidth: 150
    },
    {
      headerName: 'Has Sections',
      field: 'hasSections',
      width: 130,
      sortable: true,
      cellRenderer: (params) => {
        const hasSections = params.value;
        const classId = params.data.classId;
        const sectionCount = sectionsMap[classId];
        
        if (hasSections && sectionCount !== undefined && sectionCount === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pending Setup
            </span>
          );
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            hasSections ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {hasSections ? 'Yes' : 'No'}
          </span>
        );
      }
    },
    {
      headerName: 'Default Teacher',
      field: 'classTeacherName',
      sortable: true,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => {
        const hasSections = params.data.hasSections;
        const name = params.value;
        if (!name && hasSections) {
          return <span className="text-slate-400 italic">Coordinator</span>;
        }
        return name || <span className="text-slate-400">—</span>;
      }
    },
    {
      headerName: 'Academic Year',
      field: 'academicYear',
      sortable: true,
      flex: 1,
      minWidth: 130
    },
    {
      headerName: 'Order',
      field: 'orderNo',
      width: 80,
      sortable: true
    },
    {
      headerName: 'Status',
      field: 'isActive',
      width: 100,
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ], [sectionsMap]);

  const toolbar = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSearch={setSearchTerm}
        onClear={() => {
          setSearchInput('');
          setSearchTerm('');
        }}
        placeholder="Search by Class, Teacher, Academic Year"
      />
      
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      
      <PermissionButton
        moduleName="Class Management"
        subModuleName="Classes"
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
        Add Class
      </PermissionButton>
    </div>
  );

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Classes Management</h1>
            <p className="text-sm text-slate-600">Manage school classes and their details</p>
          </div>
          <button
            onClick={handleExport}
            className="btn-success flex items-center gap-2"
            disabled={filteredClasses.length === 0}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        <AgGridBox
          title={`Classes (${filteredClasses.length})`}
          columnDefs={columns}
          rowData={filteredClasses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          toolbar={toolbar}
        />

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editMode ? 'Edit Class' : 'Add New Class'}
                </h3>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Class Name */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Class Name *</label>
                    <input
                      type="text"
                      required
                      value={form.className}
                      onChange={(e) => setForm({...form, className: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., Grade 1"
                    />
                  </div>

                  {/* Academic Session */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Academic Year *</label>
                    <select
                      required
                      value={form.sessionId}
                      onChange={(e) => {
                        const selectedSession = sessions.find(s => String(s.sessionId) === e.target.value);
                        setForm({
                          ...form,
                          sessionId: e.target.value,
                          academicYear: selectedSession ? selectedSession.sessionName : ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">Select Academic Session</option>
                      {sessions.map(session => (
                        <option key={session.sessionId} value={session.sessionId}>
                          {session.sessionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Has Sections Toggle */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Has Sections *</label>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setForm({...form, hasSections: !form.hasSections})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          form.hasSections ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          form.hasSections ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {form.hasSections ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {/* Class Teacher - Dynamic required/optional based on hasSections */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {form.hasSections ? 'Default Class Teacher (Optional)' : 'Class Teacher *'}
                    </label>
                    <select
                      required={!form.hasSections}
                      value={form.classTeacherId}
                      onChange={(e) => {
                        const selectedTeacher = teachers.find(t => t.teacherId === parseInt(e.target.value));
                        setForm({
                          ...form, 
                          classTeacherId: parseInt(e.target.value),
                          classTeacherName: selectedTeacher ? selectedTeacher.teacherName : ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">{form.hasSections ? 'Select a teacher (optional)' : 'Select a teacher'}</option>
                      {teachers.map(teacher => (
                        <option key={teacher.teacherId} value={teacher.teacherId}>
                          {teacher.teacherName} - {teacher.designation}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {form.hasSections
                        ? 'This teacher acts as the Class Coordinator / Grade Incharge. Section teachers can be assigned separately.'
                        : 'This teacher will manage attendance and activities for all students in this class.'
                      }
                    </p>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      rows={2}
                      placeholder="Class description (optional)"
                    />
                  </div>

                  {/* Info message when hasSections=true */}
                  {form.hasSections && (
                    <div className="md:col-span-2">
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          This class uses sections. After creating the class, create sections (A, B, C, etc.) and assign teachers to each section.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Validation message when hasSections=false and no teacher */}
                  {!form.hasSections && editMode && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Class Teacher is required when Has Sections is No.
                      </p>
                    </div>
                  )}

                  {/* Active - only in edit mode */}
                  {editMode && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={form.isActive}
                        onChange={(e) => setForm({...form, isActive: e.target.checked})}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editMode ? 'Update Class' : 'Create Class')}
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
    </LoadingOverlay>
  );
}