import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function Sidebar({ current, onNavigate, open, onClose }) {
  // Get user role and permissions from Redux store
  const { userRole, permissions } = useSelector((state) => state.auth);
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

  // Calculate accessible modules and menu items
  const accessibleMenus = useMemo(() => {
    if (!permissions?.modules) return [];

    const menus = [];

    // Create a mapping of module names to menu items
    const moduleToMenuMap = {
      'dashboard': { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      'users': { id: 'users', label: 'Users', icon: '👥' },
      'subscriptions': { id: 'subscriptions', label: 'Subscriptions', icon: '💎' },
      'modules': { id: 'modules', label: 'Modules', icon: '🧩' },
      'roles': { id: 'roles', label: 'Roles', icon: '🎭' },
      'tenants': { id: 'tenants', label: 'Tenants', icon: '🏢' },
      'employees': { id: 'employees', label: 'Employees', icon: '🧑' },
      'students': { id: 'students', label: 'Students', icon: '🎓' },
      'fees': { id: 'fees', label: 'Fees', icon: '💰' },
      'reports': { id: 'reports', label: 'Reports', icon: '📈' },
      'classes': { id: 'classes', label: 'Classes', icon: '🏫' },
      'sessions': { id: 'sessions', label: 'Sessions', icon: '📅' },
      'subjects': { id: 'subjects', label: 'Subjects', icon: '📚' },
      'fee-structures': { id: 'fee-structures', label: 'Fee Structures', icon: '💳' },
    };

    // Check permissions for each module
    permissions.modules.forEach(module => {
      // Check if user has any permissions in this module's submodules
      const hasAccessToModule = module.subModules.some(subModule =>
        subModule.permissions.length > 0
      );

      if (hasAccessToModule) {
        const menuItem = moduleToMenuMap[module.moduleName.toLowerCase()];
        if (menuItem) {
          menus.push(menuItem);
        }
      }
    });

    return menus;
  }, [permissions]);

  const [modulesExpanded, setModulesExpanded] = useState(false);

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
          {/* Render menu items based on permissions */}
          {accessibleMenus.length > 0 ? (
            <>
              <Item id="dashboard" label="Dashboard" icon="📊" />
              {accessibleMenus
                .filter(menu => menu.id !== 'dashboard') // Dashboard is always shown
                .map(menu => {
                  if (menu.id === 'modules') {
                    return (
                      <ModulesItem 
                        key={menu.id}
                        id="module-management" 
                        label="Module Management" 
                        icon="⚙️" 
                        hasSubmodules={true}
                        submodules={[
                          { id: 'modules', label: 'Modules', icon: '🧩' },
                          { id: 'submodules', label: 'SubModules', icon: '🔧' }
                        ]}
                      />
                    );
                  }
                  return <Item key={menu.id} id={menu.id} label={menu.label} icon={menu.icon} />;
                })}
            </>
          ) : (
            /* Fallback: Show ALL tabs for development/testing when no permissions are available */
            <>
              <Item id="dashboard" label="Dashboard" icon="📊" />
              <Item id="users" label="Users" icon="👥" />
              <Item id="subscriptions" label="Subscriptions" icon="💎" />
              <ModulesItem 
                id="module-management" 
                label="Module Management" 
                icon="⚙️" 
                hasSubmodules={true}
                submodules={[
                  { id: 'modules', label: 'Modules', icon: '🧩' },
                  { id: 'submodules', label: 'SubModules', icon: '🔧' }
                ]}
              />
              <Item id="roles" label="Roles" icon="🎭" />
              <Item id="tenants" label="Tenants" icon="🏢" />
              <Item id="employees" label="Employees" icon="🧑" />
              <Item id="students" label="Students" icon="🎓" />
              <Item id="fees" label="Fees" icon="💰" />
              <Item id="reports" label="Reports" icon="📈" />
            </>
          )}
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
