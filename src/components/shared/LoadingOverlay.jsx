import React from 'react';

const LoadingOverlay = ({ isLoading, children }) => {
  return (
    <>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">Loading...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoadingOverlay;
