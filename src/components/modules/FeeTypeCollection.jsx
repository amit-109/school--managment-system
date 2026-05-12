import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../Auth/base';
import AgGridBox from '../shared/AgGridBox';

const today = new Date().toISOString().split('T')[0];
const firstDayOfThisMonth = today.slice(0, 8) + '01';
const allTimeStartDate = '2000-01-01';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-IN')}`;
};

const getAmount = (item, keys) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      return Number(item[key]) || 0;
    }
  }
  return 0;
};

const buildDateRange = (mode, month) => {
  if (mode === 'overall') {
    return { from: allTimeStartDate, to: today };
  }

  const safeMonth = month || today.slice(0, 7);
  const [year, monthIndex] = safeMonth.split('-').map(Number);
  const lastDay = new Date(year, monthIndex, 0).getDate();

  return {
    from: `${safeMonth}-01`,
    to: `${safeMonth}-${String(lastDay).padStart(2, '0')}`
  };
};

export default function FeeTypeCollection() {
  const [filters, setFilters] = useState({
    reportMode: 'month',
    month: today.slice(0, 7),
    from: firstDayOfThisMonth,
    to: today,
    termId: '0',
    sessionId: '0'
  });
  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadDropdownData();
    handleSearch();
  }, []);

  const loadDropdownData = async () => {
    try {
      const response = await apiClient.get('/admin/feemasters/dropdowns');
      if (response.data.success) {
        const { data } = response.data;
        setTerms(data.terms || []);
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const formatFeeTypeRows = (items) => {
    return items.map((item, index) => {
      const invoicedAmount = getAmount(item, ['invoicedAmount', 'InvoicedAmount', 'grossAmount', 'GrossAmount']);
      const collectedAmount = getAmount(item, ['collectedAmount', 'CollectedAmount', 'paidAmount', 'PaidAmount', 'totalCollected', 'TotalCollected']);
      const outstandingAmount = getAmount(item, ['outstandingAmount', 'OutstandingAmount', 'balanceAmount', 'BalanceAmount']);

      return {
        id: index + 1,
        feeTypeId: item.feeTypeId || item.FeeTypeId || '-',
        feeTypeName: item.feeTypeName || item.FeeTypeName || item.name || item.Name || 'Unspecified',
        invoicedAmountValue: invoicedAmount,
        collectedAmountValue: collectedAmount,
        outstandingAmountValue: outstandingAmount,
        invoicedAmount: formatCurrency(invoicedAmount),
        collectedAmount: formatCurrency(collectedAmount),
        outstandingAmount: formatCurrency(outstandingAmount)
      };
    });
  };

  const handleSearch = async (nextFilters = filters) => {
    const dateRange = buildDateRange(nextFilters.reportMode, nextFilters.month);

    if (!dateRange.from || !dateRange.to) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        termId: nextFilters.termId,
        sessionId: nextFilters.sessionId
      });

      const response = await apiClient.get(`/admin/reports/fees/fee-type-collection?${params}`);

      if (response.data.success) {
        const items = Array.isArray(response.data.data) ? response.data.data : [];
        setFilters(prev => ({ ...prev, ...nextFilters, ...dateRange }));
        setRawData(items);
        setData(formatFeeTypeRows(items));
      }
    } catch (error) {
      console.error('Error fetching fee type collection:', error);
      alert('Error fetching fee type collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        termId: filters.termId,
        sessionId: filters.sessionId
      });

      const response = await apiClient.get(`/admin/reports/fees/fee-type-collection/csv/stream?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee-type-collection-${filters.reportMode}-${new Date().toISOString().split('T')[0]}.csv`;
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

  const summary = useMemo(() => {
    return data.reduce((total, item) => ({
      invoicedAmount: total.invoicedAmount + item.invoicedAmountValue,
      collectedAmount: total.collectedAmount + item.collectedAmountValue,
      outstandingAmount: total.outstandingAmount + item.outstandingAmountValue
    }), {
      invoicedAmount: 0,
      collectedAmount: 0,
      outstandingAmount: 0
    });
  }, [data]);

  const classWiseData = useMemo(() => {
    const grouped = rawData.reduce((acc, item) => {
      const classId = item.classId || item.ClassId || item.standardId || item.StandardId;
      const className = item.className || item.ClassName || item.standardName || item.StandardName;

      if (!classId && !className) {
        return acc;
      }

      const key = classId || className;
      if (!acc[key]) {
        acc[key] = {
          classId: classId || '-',
          className: className || 'Unspecified',
          records: 0,
          invoicedAmountValue: 0,
          collectedAmountValue: 0,
          outstandingAmountValue: 0
        };
      }

      acc[key].records += 1;
      acc[key].invoicedAmountValue += getAmount(item, ['invoicedAmount', 'InvoicedAmount', 'grossAmount', 'GrossAmount']);
      acc[key].collectedAmountValue += getAmount(item, ['collectedAmount', 'CollectedAmount', 'paidAmount', 'PaidAmount', 'totalCollected', 'TotalCollected']);
      acc[key].outstandingAmountValue += getAmount(item, ['outstandingAmount', 'OutstandingAmount', 'balanceAmount', 'BalanceAmount']);

      return acc;
    }, {});

    return Object.values(grouped).map((item, index) => ({
      id: index + 1,
      classId: item.classId,
      className: item.className,
      records: item.records,
      invoicedAmount: formatCurrency(item.invoicedAmountValue),
      collectedAmount: formatCurrency(item.collectedAmountValue),
      outstandingAmount: formatCurrency(item.outstandingAmountValue)
    }));
  }, [rawData]);

  const columnDefs = [
    { headerName: 'Fee Type ID', field: 'feeTypeId', sortable: true, filter: true, width: 120 },
    { headerName: 'Fee Type Name', field: 'feeTypeName', sortable: true, filter: true },
    { headerName: 'Invoiced Amount', field: 'invoicedAmount', sortable: true, filter: true, width: 150 },
    { headerName: 'Collected Amount', field: 'collectedAmount', sortable: true, filter: true, width: 150 },
    { headerName: 'Outstanding Amount', field: 'outstandingAmount', sortable: true, filter: true, width: 160 }
  ];

  const classColumnDefs = [
    { headerName: 'Class ID', field: 'classId', sortable: true, filter: true, width: 110 },
    { headerName: 'Class Name', field: 'className', sortable: true, filter: true },
    { headerName: 'Records', field: 'records', sortable: true, filter: true, width: 110 },
    { headerName: 'Invoiced Amount', field: 'invoicedAmount', sortable: true, filter: true, width: 150 },
    { headerName: 'Collected Amount', field: 'collectedAmount', sortable: true, filter: true, width: 150 },
    { headerName: 'Outstanding Amount', field: 'outstandingAmount', sortable: true, filter: true, width: 160 }
  ];

  const rangeLabel = filters.reportMode === 'overall'
    ? `Overall till ${new Date(filters.to).toLocaleDateString()}`
    : new Date(`${filters.month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2m8-6a8 8 0 11-16 0 8 8 0 0116 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Type Collection Report</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Monthly and overall fee collection totals</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exportLoading || data.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-medium transition-all duration-200 shadow-lg disabled:transform-none"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Collection</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.collectedAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rangeLabel}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Invoiced</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(summary.invoicedAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.length} fee type records</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.outstandingAmount)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Balance for selected range</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-inner border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <select
                value={filters.reportMode}
                onChange={(e) => {
                  const nextFilters = { ...filters, reportMode: e.target.value };
                  setFilters(prev => ({ ...prev, reportMode: e.target.value }));
                  handleSearch(nextFilters);
                }}
                className="input-primary w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="month">Particular Month</option>
                <option value="overall">Overall Till Now</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month
              </label>
              <input
                type="month"
                value={filters.month}
                disabled={filters.reportMode === 'overall'}
                onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Term
              </label>
              <select
                value={filters.termId}
                onChange={(e) => setFilters(prev => ({ ...prev, termId: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="0">All Terms</option>
                {terms.map(term => (
                  <option key={term.termId} value={term.termId}>
                    {term.termName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session
              </label>
              <select
                value={filters.sessionId}
                onChange={(e) => setFilters(prev => ({ ...prev, sessionId: e.target.value }))}
                className="input-primary w-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="0">All Sessions</option>
                {sessions.map(session => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Active range: {filters.from} to {filters.to}
          </p>
        </div>
      </div>

      {data.length > 0 ? (
        <>
          <AgGridBox
            title="Fee Type Collection Results"
            rowData={data}
            columnDefs={columnDefs}
            showActions={false}
            pageSize={20}
          />

          {classWiseData.length > 0 ? (
            <AgGridBox
              title="Class Wise Total"
              rowData={classWiseData}
              columnDefs={classColumnDefs}
              showActions={false}
              pageSize={20}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">Class Wise Total</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                The current fee type collection API response does not include class fields, so class-wise totals cannot be calculated on this screen yet.
              </p>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 018 0v2m-6-6h.01M7 21h10a2 2 0 002-2v-7a7 7 0 10-14 0v7a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Fee Type Data Found</h3>
            <p className="text-gray-600 dark:text-gray-400">No fee type collection records found for the selected criteria. Try adjusting your filters.</p>
          </div>
        )
      )}
    </div>
  );
}
