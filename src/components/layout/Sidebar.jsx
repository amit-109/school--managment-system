import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function Sidebar({ current, onNavigate, open, onClose }) {
  // Get user role and permissions from Redux store
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
    } else {
      setRole('operator');
    }
  }, [userRole]);

  // Define menu items based on role
  const menuItems = useMemo(() => {
    if (role === 'superadmin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'subscriptions', label: 'Subscriptions', icon: '💎' },
        { id: 'tenants', label: 'Tenants', icon: '🏢' },
        { id: 'roles', label: 'Roles', icon: '🎭' },
        { id: 'modules', label: 'Modules', icon: '🧩' },
        { id: 'role-scope', label: 'Role Scope', icon: '🔒' },
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'audit-logs', label: 'Audit Logs', icon: '📋' },
      ];
    } else if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'employees', label: 'Employees', icon: '🧑' },
        { id: 'students', label: 'Students', icon: '🎓' },
        { id: 'fees', label: 'Fees', icon: '💰' },
        { id: 'reports', label: 'Reports', icon: '📈' },
      ];
    } else {
      // Operator/staff role
      return [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'students', label: 'Students', icon: '🎓' },
        { id: 'fees', label: 'Fees', icon: '💰' },
      ];
    }
  }, [role]);

  const [modulesExpanded, setModulesExpanded] = useState(false);
  const [classManagementExpanded, setClassManagementExpanded] = useState(true);
  const [subjectManagementExpanded, setSubjectManagementExpanded] = useState(true);

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

  const ModulesItem = ({ id, label, icon, hasSubmodules, submodules }) => (
    <div>
      <button
        onClick={() => hasSubmodules ? setModulesExpanded(!modulesExpanded) : onNavigate(id)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left w-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 relative overflow-hidden group ${current===id?'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500 font-medium shadow-md':''}`}>
        <div className={`text-lg ${current===id?'text-blue-600 dark:text-blue-400':'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
          {icon}
        </div>
        <span className={`text-sm font-medium flex-1 ${current===id?'text-slate-900 dark:text-slate-100':'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'}`}>{label}</span>
        {hasSubmodules && (
          <svg className={`w-4 h-4 transition-transform ${modulesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {current===id && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
        )}
        
        
      </button>
      {hasSubmodules && modulesExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {submodules.map(submodule => (
            <button
              key={submodule.id}
              onClick={() => onNavigate(submodule.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-left w-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 ${current===submodule.id?'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400':''}`}>
              <div className="text-sm">{submodule.icon}</div>
              <span className="text-xs font-medium">{submodule.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const ManagementItem = ({ id, label, icon, hasSubmodules, submodules, isExpanded, onToggle }) => (
    <div>
      <button
        onClick={() => hasSubmodules ? onToggle(!isExpanded) : onNavigate(id)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left w-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 relative overflow-hidden group ${current===id?'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500 font-medium shadow-md':''}`}>
        <div className={`text-lg ${current===id?'text-blue-600 dark:text-blue-400':'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
          {icon}
        </div>
        <span className={`text-sm font-medium flex-1 ${current===id?'text-slate-900 dark:text-slate-100':'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'}`}>{label}</span>
        {hasSubmodules && (
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {current===id && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
        )}
      </button>
      {hasSubmodules && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {submodules.map(submodule => (
            <button
              key={submodule.id}
              onClick={() => onNavigate(submodule.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-left w-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 ${current===submodule.id?'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400':''}`}>
              <div className="text-sm">{submodule.icon}</div>
              <span className="text-xs font-medium">{submodule.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      )}
      <aside className={`fixed inset-y-0 left-0 md:relative w-56 h-[calc(100vh-56px)] border-r p-3 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out md:z-auto md:translate-x-0 z-50 ${open ? 'translate-x-0' : '-translate-x-full'} md:static`}>

        <nav className="px-2 space-y-2 mt-4">
          {/* Primary Navigation */}
          {menuItems.filter(menu =>
            role === 'superadmin' ?
              ['dashboard', 'tenants', 'subscriptions'].includes(menu.id) :
            role === 'admin' ?
              ['dashboard', 'users', 'employees', 'students', 'fees', 'reports'].includes(menu.id) :
            ['dashboard', 'students', 'fees', 'reports'].includes(menu.id)
          ).map(menu => {
            if (menu.id === 'subscriptions' && role === 'superadmin') {
              return (
                <Item key={menu.id} id={menu.id} label="Subscriptions" icon={menu.icon} />
              );
            }
            if (menu.id === 'subscriptions' && role === 'admin') {
              return null; // Skip for admin, we'll add later if needed
            }
            return <Item key={menu.id} id={menu.id} label={menu.label} icon={menu.icon} />;
          })}

          {/* Master Data section - always show for admin/operator */}
          {(role === 'admin' || role === 'operator') && (
            <>
              <div className="mt-8 mb-2">
                <div className="px-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Master Data</span>
                </div>
              </div>

              {/* Class Management */}
              <ManagementItem
                id="class-management"
                label="Class Management"
                icon="🏫"
                hasSubmodules={true}
                submodules={[
                  { id: 'classes', label: 'Classes', icon: '📝' },
                  { id: 'sections', label: 'Sections', icon: '🏫' }
                ]}
                isExpanded={classManagementExpanded}
                onToggle={setClassManagementExpanded}
              />

              {/* Subject Management */}
              <ManagementItem
                id="subject-management"
                label="Subject Management"
                icon="📚"
                hasSubmodules={true}
                submodules={[
                  { id: 'subjects', label: 'Subjects', icon: '📖' },
                  { id: 'subject-assignments', label: 'Subject Assignments', icon: '🔗' }
                ]}
                isExpanded={subjectManagementExpanded}
                onToggle={setSubjectManagementExpanded}
              />

              {/* Academic items */}
              <Item id="sessions" label="Sessions" icon="📅" />
              <Item id="fee-structures" label="Fee Structures" icon="💳" />
            </>
          )}


        </nav>
      </aside>
    </>
  )
}
