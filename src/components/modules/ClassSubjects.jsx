import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import PermissionButton from '../shared/PermissionButton';
import { getClasses, getSubjects, getClassSubjects, assignSubjectToClass, removeSubjectFromClass } from '../Services/adminService';

export default function ClassSubjects() {
  const { permissions } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassSubjects(selectedClassId);
    } else {
      setClassSubjects([]);
      setAvailableSubjects(subjects);
    }
  }, [selectedClassId, subjects]);

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

  const loadSubjects = async () => {
    try {
      const response = await getSubjects();
      if (response.success) {
        const subjectsList = response.data?.records || [];
        setSubjects(subjectsList);
        setAvailableSubjects(subjectsList);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadClassSubjects = async (classId) => {
    setLoading(true);
    try {
      const response = await getClassSubjects(classId);
      if (response.success) {
        const assignedSubjects = response.data || [];
        setClassSubjects(assignedSubjects);
        
        // Filter available subjects (exclude already assigned)
        const assignedSubjectIds = assignedSubjects.map(cs => cs.subjectId);
        const available = subjects.filter(s => !assignedSubjectIds.includes(s.subjectId));
        setAvailableSubjects(available);
      }
    } catch (error) {
      toast.error('Failed to load class subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubject = async (subjectId) => {
    if (!selectedClassId) return;
    
    setLoading(true);
    try {
      await assignSubjectToClass(selectedClassId, subjectId);
      toast.success('Subject assigned successfully');
      loadClassSubjects(selectedClassId);
    } catch (error) {
      toast.error('Failed to assign subject');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubject = async (classSubjectData) => {
    if (window.confirm(`Remove ${classSubjectData.subjectName} from this class?`)) {
      setLoading(true);
      try {
        await removeSubjectFromClass(selectedClassId, classSubjectData.classSubjectId);
        toast.success('Subject removed successfully');
        loadClassSubjects(selectedClassId);
      } catch (error) {
        toast.error('Failed to remove subject');
      } finally {
        setLoading(false);
      }
    }
  };

  const columns = useMemo(() => [
    {
      headerName: 'Subject ID',
      field: 'subjectId',
      width: 100,
      sortable: true
    },
    {
      headerName: 'Subject Name',
      field: 'subjectName',
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
  ], []);

  const selectedClassName = classes.find(c => c.classId.toString() === selectedClassId)?.className || '';

  const toolbar = (
    <div className="flex items-center gap-3">
      <select
        value={selectedClassId}
        onChange={(e) => setSelectedClassId(e.target.value)}
        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
      >
        <option value="">Select Class</option>
        {classes.map(cls => (
          <option key={cls.classId} value={cls.classId.toString()}>
            {cls.className}
          </option>
        ))}
      </select>
      
      {selectedClassId && availableSubjects.length > 0 && (
        <PermissionButton
          moduleName="Subject Management"
          subModuleName="Class Subjects"
          action="create"
          onClick={() => setShowModal(true)}
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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Class Subjects</h1>
          <p className="text-sm text-slate-600">Assign subjects to classes</p>
        </div>

        <AgGridBox
          title={`Assigned Subjects${selectedClassName ? ` - ${selectedClassName}` : ''}`}
          columnDefs={columns}
          rowData={classSubjects}
          onDelete={handleRemoveSubject}
          toolbar={toolbar}
        />

        {/* Assign Subject Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Assign Subject to Class</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Available Subjects</label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableSubjects.map(subject => (
                      <div key={subject.subjectId} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                        <div>
                          <div className="font-medium">{subject.subjectName}</div>
                          <div className="text-sm text-slate-500">{subject.subjectCode}</div>
                        </div>
                        <button
                          onClick={() => handleAssignSubject(subject.subjectId)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          disabled={loading}
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </LoadingOverlay>
  );
}