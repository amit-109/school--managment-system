import React, { useState, useEffect } from 'react';
import { apiClient } from '../Auth/base';
import AgGridBox from '../shared/AgGridBox';

export default function StudentOutstanding() {
  const [filters, setFilters] = useState({
    classId: '',
    search: ''
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 20,
    totalCount: 0
  });
  
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [selectedAdmissionNo, setSelectedAdmissionNo] = useState('');

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  useEffect(() => {
    if (filters.classId) {
      handleSearch();
    }
  }, [pagination.page, pagination.size]);

  const loadClasses = async () => {
    try {
      const response = await apiClient.get('/admin/classes');
      if (response.data.success) setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await apiClient.get('/admin/fees/students');
      if (response.data.success) setAllStudents(response.data.data.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleClassChange = (classId) => {
    setFilters(prev => ({ ...prev, classId, search: '' }));
    setStudentSearch('');
    setSelectedAdmissionNo('');
    setFilteredStudents(classId ? allStudents.filter(s => String(s.currentClassId) === String(classId)) : []);
  };

  const handleSearch = async () => {
    if (!filters.classId) {
      alert('Please select a class');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        size: pagination.size,
        classId: filters.classId
      });

      if (selectedAdmissionNo) {
        params.append('search', selectedAdmissionNo);
      }

      const response = await apiClient.get(`/admin/reports/fees/student-outstanding?${params}`);
      
      if (response.data.success) {
        const responseData = response.data.data;
        const formattedData = responseData.data.map((item, index) => ({
          id: index + 1,
          studentId: item.studentId,
          userId: item.userId,
          studentName: item.studentName,
          admissionNo: item.admissionNo,
          currentClassId: item.currentClassId,
          totalInvoiced: `₹${item.totalInvoiced.toLocaleString()}`,
          totalPaid: `₹${item.totalPaid.toLocaleString()}`,
          outstanding: `₹${item.outstanding.toLocaleString()}`
        }));
        setData(formattedData);
        setPagination(prev => ({
          ...prev,
          totalCount: responseData.totalCount
        }));
      }
    } catch (error) {
      console.error('Error fetching student outstanding:', error);
      alert('Error fetching student outstanding data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.classId) {
        params.append('classId', filters.classId);
      } else {
        params.append('classId', '0');
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/admin/reports/fees/student-outstanding/csv/stream?${params}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-outstanding-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV file');
    } finally {
      setExportLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };



  const columnDefs = [
    { headerName: 'Student ID', field: 'studentId', sortable: true, filter: true, width: 100 },
    { headerName: 'Student Name', field: 'studentName', sortable: true, filter: true },
    { headerName: 'Admission No', field: 'admissionNo', sortable: true, filter: true, width: 130 },
    { headerName: 'Total Invoiced', field: 'totalInvoiced', sortable: true, filter: true, width: 130 },
    { headerName: 'Total Paid', field: 'totalPaid', sortable: true, filter: true, width: 130 },
    { headerName: 'Outstanding', field: 'outstanding', sortable: true, filter: true, width: 130 }
  ];

  const totalPages = Math.ceil(pagination.totalCount / pagination.size);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg">
              🎓
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Outstanding Report</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track outstanding fees by student</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            title="Export to CSV"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
        
        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-inner border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-purple-500">🏫</span>
                Class
              </label>
              <select
                value={filters.classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="input-primary w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-purple-500">🎓</span>
                Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={filters.classId ? 'Search student...' : 'Select class first'}
                  disabled={!filters.classId}
                  value={studentSearch}
                  onFocus={() => setStudentDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setStudentDropdownOpen(false), 150)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudentSearch(val);
                    setSelectedAdmissionNo('');
                    setFilteredStudents(
                      val
                        ? allStudents.filter(s => String(s.currentClassId) === String(filters.classId) &&
                            (s.studentName.toLowerCase().includes(val.toLowerCase()) ||
                             s.admissionNo.toLowerCase().includes(val.toLowerCase())))
                        : allStudents.filter(s => String(s.currentClassId) === String(filters.classId))
                    );
                    setStudentDropdownOpen(true);
                  }}
                  className="input-primary w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {studentDropdownOpen && filters.classId && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                      <button
                        key={s.studentId}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setStudentSearch(s.studentName);
                          setSelectedAdmissionNo(s.admissionNo);
                          setStudentDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-200 dark:border-slate-600 last:border-b-0"
                      >
                        <div className="font-medium text-sm">{s.studentName}</div>
                        <div className="text-xs text-slate-500">Adm: {s.admissionNo}</div>
                      </button>
                    )) : (
                      <div className="p-3 text-sm text-slate-500">No students found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {data.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Student Outstanding Results</h3>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded-full font-medium">
                  {pagination.totalCount} total records
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Page {pagination.page} of {totalPages}</span>
              </div>
            </div>
          </div>
          <AgGridBox
            rowData={data}
            columnDefs={columnDefs}
            pagination={false}
          />
          
          {/* Custom Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.size) + 1} to {Math.min(pagination.page * pagination.size, pagination.totalCount)} of {pagination.totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg font-medium">
                  {pagination.page}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Student Data Found</h3>
            <p className="text-gray-600 dark:text-gray-400">No student outstanding records found for the selected criteria. Try adjusting your filters.</p>
          </div>
        )
      )}
    </div>
  );
}