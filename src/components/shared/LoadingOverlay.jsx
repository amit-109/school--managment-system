import React from "react";

const LoadingOverlay = ({ isLoading, children }) => {
  return (
    <div className="relative">
      {children}

      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
          isLoading
            ? "visible bg-white/75 opacity-100 backdrop-blur-sm dark:bg-slate-950/65"
            : "invisible opacity-0"
        }`}
        role="status"
        aria-live="polite"
        aria-hidden={!isLoading}
      >
        <div className="flex min-w-56 flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600 dark:border-primary-900 dark:border-t-primary-400" />
          <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Loading data...</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Please wait...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
