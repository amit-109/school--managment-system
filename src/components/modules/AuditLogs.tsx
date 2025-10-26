import React from 'react';
import LoadingOverlay from '../shared/LoadingOverlay';

const AuditLogs: React.FC = () => {
  return (
    <LoadingOverlay isLoading={false}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-slate-600">Monitor and review all system activities and changes</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="text-6xl">📋</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Audit Logs</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              View detailed logs of all system activities, user actions, and data changes.
              Track who performed what action and when for security and compliance.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
              <p className="text-green-800 dark:text-green-200 text-sm">
                <strong>Under Development:</strong> Audit Logs component is coming soon.
                This will provide comprehensive tracking of all system activities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </LoadingOverlay>
  );
};

export default AuditLogs;
