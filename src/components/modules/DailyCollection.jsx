import React, { useState, useEffect } from 'react';
import { apiClient } from '../Auth/base';
import AgGridBox from '../shared/AgGridBox';

export default function DailyCollection() {
  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    paymentMode: 'All'
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const paymentModes = ['All', 'Cash', 'QR', 'UPI', 'Bank', 'Cheque', 'Card'];

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo
      });
      
      if (filters.paymentMode !== 'All') {
        params.append('mode', filters.paymentMode);
      }

      const response = await apiClient.get(`/admin/reports/fees/daily?${params}`);
      
      if (response.data.success) {
        const formattedData = response.data.data.map((item, index) => ({
          id: index + 1,
          collectionDate: new Date(item.collectionDate).toLocaleDateString(),
          paymentsCount: item.paymentsCount,
          totalCollected: `₹${item.totalCollected.toLocaleString()}`,
          allocatedAmount: `₹${item.allocatedAmount.toLocaleString()}`,
          unallocatedAmount: `₹${item.unallocatedAmount.toLocaleString()}`
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching daily collection:', error);
      alert('Error fetching daily collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        from: filters.dateFrom,
        to: filters.dateTo
      });
      
      if (filters.paymentMode !== 'All') {
        params.append('mode', filters.paymentMode);
      }

      const response = await apiClient.get(`/admin/reports/fees/daily/csv/stream?${params}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-collection-${new Date().toISOString().split('T')[0]}.csv`;
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
    { headerName: 'Collection Date', field: 'collectionDate', sortable: true, filter: true },
    { headerName: 'Payments Count', field: 'paymentsCount', sortable: true, filter: true },
    { headerName: 'Total Collected', field: 'totalCollected', sortable: true, filter: true },
    { headerName: 'Allocated Amount', field: 'allocatedAmount', sortable: true, filter: true },
    { headerName: 'Unallocated Amount', field: 'unallocatedAmount', sortable: true, filter: true }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg">
              📊
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Collection Report</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track and analyze daily fee collections</p>
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
                <span className="text-blue-500">📅</span>
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-blue-500">📅</span>
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-blue-500">💳</span>
                Payment Mode
              </label>
              <select
                value={filters.paymentMode}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
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
                <span className="text-lg">📈</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Collection Results</h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
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
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Data Found</h3>
            <p className="text-gray-600 dark:text-gray-400">No collection records found for the selected criteria. Try adjusting your filters.</p>
          </div>
        )
      )}
    </div>
  );
}