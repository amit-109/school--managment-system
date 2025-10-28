import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import PermissionButton from '../shared/PermissionButton';
import { getTeachers, getClasses, getSections, getClassSubjects, getTeacherSubjects, assignSubjectToTeacher, removeSubjectFromTeacher } from '../Services/adminService';

export default function TeacherSubjects() {
  const { permissions } = useSelector((state) => state.auth);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    isPrimary: false
  });

  useEffect(() => {
    loadTeachers();
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      loadTeacherSubjects(selectedTeacherId);
    } else {
      setTeacherSubjects([]);
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    if (form.classId) {
      loadSections(form.classId);
      loadClassSubjects(form.classId);
    } else {
      setSections([]);
      setClassSubjects([]);
    }
  }, [form.classId]);

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

  const loadClasses = async () => {
    try {
      const response = await getClasses();
      if (response.success) {
        setClasses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadSections = async (classId) => {
    try {
      const response = await getSections(classId);
      if (response.success) {
        setSections(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const loadClassSubjects = async (classId) => {
    try {
      const response = await getClassSubjects(classId);
      if (response.success) {
        setClassSubjects(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load class subjects:', error);
      // If no subjects assigned to class yet, show empty array
      setClassSubjects([]);
    }
  };

  const loadTeacherSubjects = async (teacherId) => {
    setLoading(true);
    try {
      const response = await getTeacherSubjects(teacherId);
      if (response.success) {
        setTeacherSubjects(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load teacher subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      toast.error('Please select a teacher first');
      return;
    }

    setLoading(true);
    try {
      const assignmentData = {
        classId: parseInt(form.classId),
        sectionId: form.sectionId ? parseInt(form.sectionId) : null,
        subjectId: parseInt(form.subjectId),
        isPrimary: form.isPrimary
      };

      await assignSubjectToTeacher(selectedTeacherId, assignmentData);
      toast.success('Subject assigned to teacher successfully');
      setShowModal(false);
      resetForm();
      loadTeacherSubjects(selectedTeacherId);
    } catch (error) {
      console.log('Assignment error:', error);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      
      let errorMessage = 'Failed to assign subject to teacher';
      
      if (error.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentData) => {
    if (window.confirm(`Remove this subject assignment?`)) {
      setLoading(true);
      try {
        await removeSubjectFromTeacher(selectedTeacherId, assignmentData.teacherSubjectId);
        toast.success('Assignment removed successfully');
        loadTeacherSubjects(selectedTeacherId);
      } catch (error) {
        toast.error('Failed to remove assignment');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setForm({
      classId: '',
      sectionId: '',
      subjectId: '',
      isPrimary: false
    });
  };

  const columns = useMemo(() => [
    {
      headerName: 'Class',
      field: 'className',
      sortable: true,
      valueGetter: (params) => {
        const cls = classes.find(c => c.classId === params.data.classId);
        return cls ? cls.className : 'N/A';
      }
    },
    {
      headerName: 'Section',
      field: 'sectionName',
      sortable: true,
      valueGetter: (params) => {
        return params.data.sectionName || 'N/A';
      }
    },
    {
      headerName: 'Subject',
      field: 'subjectName',
      sortable: true
    },
    {
      headerName: 'Primary',
      field: 'isPrimary',
      width: 100,
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {params.value ? 'Primary' : 'Secondary'}
        </span>
      )
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
  ], [classes, sections, classSubjects]);

  const selectedTeacherName = teachers.find(t => t.teacherId.toString() === selectedTeacherId)?.teacherName || '';

  const toolbar = (
    <div className="flex items-center gap-3">
      <select
        value={selectedTeacherId}
        onChange={(e) => setSelectedTeacherId(e.target.value)}
        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
      >
        <option value="">Select Teacher</option>
        {teachers.map(teacher => (
          <option key={teacher.teacherId} value={teacher.teacherId.toString()}>
            {teacher.teacherName} - {teacher.designation}
          </option>
        ))}
      </select>
      
      {selectedTeacherId && (
        <PermissionButton
          moduleName="Subject Management"
          subModuleName="Teacher Subjects"
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
          Assign Subject
        </PermissionButton>
      )}
    </div>
  );

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Teacher Subjects</h1>
          <p className="text-sm text-slate-600">Assign subjects to teachers for specific classes and sections</p>
        </div>

        <AgGridBox
          title={`Subject Assignments${selectedTeacherName ? ` - ${selectedTeacherName}` : ''}`}
          columnDefs={columns}
          rowData={teacherSubjects}
          onDelete={handleRemoveAssignment}
          toolbar={toolbar}
        />

        {/* Assign Subject Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Assign Subject to Teacher</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Class *</label>
                  <select
                    required
                    value={form.classId}
                    onChange={(e) => setForm({...form, classId: e.target.value, sectionId: '', subjectId: ''})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Select a class</option>
                    {classes.map(cls => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select
                    value={form.sectionId}
                    onChange={(e) => setForm({...form, sectionId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    disabled={!form.classId}
                  >
                    <option value="">All Sections (Optional)</option>
                    {sections.map(section => (
                      <option key={section.sectionId} value={section.sectionId}>
                        {section.sectionName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Subject *</label>
                  <select
                    required
                    value={form.subjectId}
                    onChange={(e) => setForm({...form, subjectId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    disabled={!form.classId}
                  >
                    <option value="">Select a subject</option>
                    {classSubjects.map(subject => (
                      <option key={subject.subjectId} value={subject.subjectId}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                  {form.classId && classSubjects.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      No subjects assigned to this class yet. Please assign subjects to the class first.
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    checked={form.isPrimary}
                    onChange={(e) => setForm({...form, isPrimary: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isPrimary" className="text-sm font-medium">Primary Teacher</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Assigning...' : 'Assign Subject'}
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