import React, { createContext, useCallback, useContext, useMemo } from 'react';
import toastApi from 'react-hot-toast';
import notify from './notifications';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const addToast = useCallback((message, type = 'success', options = {}) => {
    const normalizedOptions = typeof options === 'number' ? { duration: options } : options;
    const notifier = notify[type] || notify.info;
    return notifier(message, normalizedOptions);
  }, []);

  const removeToast = useCallback((id) => {
    toastApi.dismiss(id);
  }, []);

  const toast = useMemo(() => ({
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options)
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, toasts: [], removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
