import React, { useState, useEffect } from 'react';
import { apiClient } from '../Auth/base';
import AgGridBox from '../shared/AgGridBox';

export default function ClassOutstanding() {
  const [filters, setFilters] = useState({
    classId: '',
    termId: '',
    sessionId: ''
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Dropdown options
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      // Load classes
      const classResponse = await apiClient.get('/admin/classes');
      if (classResponse.data.success) {
        setClasses(classResponse.data.data || []);
      }

      // Load terms and sessions from dropdowns
      const dropdownResponse = await apiClient.get('/admin/feemasters/dropdowns');
      if (dropdownResponse.data.success) {
        const { data } = dropdownResponse.data;
        setTerms(data.terms || []);
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleSearch = async () => {
    if (!filters.classId || !filters.termId || !filters.sessionId) {
      alert('Please select Class, Term, and Session');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        classId: filters.classId,
        termId: filters.termId,
        sessionId: filters.sessionId
      });

      const response = await apiClient.get(`/admin/reports/fees/class-outstanding?${params}`);
      
      if (response.data.success) {
        const formattedData = response.data.data.map((item, index) => ({
          id: index + 1,
          classId: item.classId,
          className: item.className,
          invoiceCount: item.invoiceCount,
          grossAmount: `₹${item.grossAmount.toLocaleString()}`,
          paidAmount: `₹${item.paidAmount.toLocaleString()}`,
          outstandingAmount: `₹${item.outstandingAmount.toLocaleString()}`
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching class outstanding:', error);
      alert('Error fetching class outstanding data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    const currentFilters = {
      classId: filters.classId,
      termId: filters.termId,
      sessionId: filters.sessionId
    };

    if (!currentFilters.classId || !currentFilters.termId || !currentFilters.sessionId) {
      alert('Please select filters before exporting');
      return;
    }

    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        classId: currentFilters.classId,
        termId: currentFilters.termId,
        sessionId: currentFilters.sessionId
      });

      const response = await apiClient.get(`/admin/reports/fees/class-outstanding/csv/stream?${params}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `class-outstanding-${new Date().toISOString().split('T')[0]}.csv`;
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

  const columnDefs = [
    { headerName: 'Class ID', field: 'classId', sortable: true, filter: true, width: 100 },
    { headerName: 'Class Name', field: 'className', sortable: true, filter: true },
    { headerName: 'Invoice Count', field: 'invoiceCount', sortable: true, filter: true, width: 130 },
    { headerName: 'Gross Amount', field: 'grossAmount', sortable: true, filter: true, width: 130 },
    { headerName: 'Paid Amount', field: 'paidAmount', sortable: true, filter: true, width: 130 },
    { headerName: 'Outstanding Amount', field: 'outstandingAmount', sortable: true, filter: true, width: 150 }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg">
              🏫
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Class Outstanding Report</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track outstanding fees by class</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-orange-500">🏫</span>
                Class
              </label>
              <select
                value={filters.classId}
                onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                <span className="text-orange-500">📋</span>
                Term
              </label>
              <select
                value={filters.termId}
                onChange={(e) => setFilters(prev => ({ ...prev, termId: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.termId} value={term.termId}>
                    {term.termName}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-orange-500">📅</span>
                Session
              </label>
              <select
                value={filters.sessionId}
                onChange={(e) => setFilters(prev => ({ ...prev, sessionId: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Session</option>
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
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
                <h3 className="font-semibold text-gray-900 dark:text-white">Outstanding Results</h3>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full font-medium">
                  {data.length} records
                </span>
              </div>
            </div>
          </div>
          <AgGridBox
            rowData={data}
            columnDefs={columnDefs}
            pagination={true}
            paginationPageSize={20}
          />
        </div>
      ) : (
        !loading && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Outstanding Data Found</h3>
            <p className="text-gray-600 dark:text-gray-400">No outstanding records found for the selected criteria. Try adjusting your filters.</p>
          </div>
        )
      )}
    </div>
  );
}