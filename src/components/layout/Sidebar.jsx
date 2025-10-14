import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function Sidebar({ current, onNavigate, open, onClose }) {
  // Get user role from Redux store
  const { userRole } = useSelector((state) => state.auth);
  const [role, setRole] = useState('operator');

  // Update local role state when Redux userRole changes
  useEffect(() => {
    if (userRole) {
      if (userRole === 'SuperAdmin') {
        setRole('superadmin');
      } else if (userRole === 'Admin') {
        setRole('admin');
      } else {
        setRole('operator');
      }
    }
  }, [userRole]);

  const Item = ({ id, label, icon }) => (
    <button
      onClick={()=>onNavigate(id)}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left w-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 relative overflow-hidden group ${current===id?'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500 font-medium shadow-md':''}`}>
      <div className={`text-lg ${current===id?'text-blue-600 dark:text-blue-400':'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${current===id?'text-slate-900 dark:text-slate-100':'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'}`}>{label}</span>
      {current===id && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
      )}
    </button>
  )

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      )}
      <aside className={`fixed inset-y-0 left-0 md:relative w-56 h-[calc(100vh-56px)] border-r p-3 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out md:z-auto md:translate-x-0 z-50 ${open ? 'translate-x-0' : '-translate-x-full'} md:static`}>

        {/* Operations Section */}
        <div className="px-2 pt-2 pb-3">
          <div className="text-xs text-slate-500 mb-1">Operations</div>
        </div>
        <nav className="px-2 space-y-2">
          <Item id="dashboard" label="Dashboard" icon="📊" />

          {/* Show ALL tabs for development/testing */}
          {/* SuperAdmin-specific tabs */}
          {/* {role === 'superadmin' && ( */}
            <>
              <Item id="users" label="Users" icon="👥" />
              <Item id="subscriptions" label="Subscriptions" icon="💎" />
              <Item id="modules" label="Modules" icon="🧩" />
              <Item id="roles" label="Roles" icon="🎭" />
              <Item id="tenants" label="Tenants" icon="🏢" />
            </>
          {/* )} */}

          {/* Admin-specific tabs */}
          {/* {role === 'admin' && ( */}
            /* <>
              <Item id="users" label="Users" icon="👥" />
              <Item id="subscriptions" label="Subscriptions" icon="💎" />
            </>
          {/* )} */}

          {/* Operator/Default tabs */}
          {/* {role === 'operator' && ( */}
            <>
              <Item id="employees" label="Employees" icon="🧑" />
              <Item id="students" label="Students" icon="🎓" />
              <Item id="fees" label="Fees" icon="💰" />
              <Item id="reports" label="Reports" icon="📈" />
            </>
          {/* )} */}
        </nav>

        {/* Master Data Section - Show for all roles during development */}
        {/* {role === 'operator' && ( */}
          <>
            <div className="px-2 pt-6 pb-3 border-t border-slate-200 dark:border-slate-700 mt-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">Master Data</div>
            </div>
            <nav className="px-2 space-y-2">
              <Item id="classes" label="Classes" icon="🏫" />
              <Item id="sessions" label="Sessions" icon="📅" />
              <Item id="subjects" label="Subjects" icon="📚" />
              <Item id="fee-structures" label="Fee Structures" icon="💳" />
            </nav>
          </>
        {/* )} */}

        {/* System Management Section - Show for all roles during development */}
        {/* {role === 'superadmin' && ( */}
          <>
            <div className="px-2 pt-6 pb-3 border-t border-slate-200 dark:border-slate-700 mt-4">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">System</div>
            </div>
            <nav className="px-2 space-y-2">
              <Item id="reports" label="Reports" icon="📈" />
            </nav>
          </>
        {/* )} */}
      </aside>
    </>
  )
}
