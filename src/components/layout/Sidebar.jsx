import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

export default function Sidebar({ current, onNavigate, open, onClose }) {
  // Get user role and permissions from Redux store
  const { userRole, permissions } = useSelector((state) => state.auth);
  const [role, setRole] = useState('operator');
  const [expandedModules, setExpandedModules] = useState({});

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

  // Module icons mapping
  const moduleIcons = {
    'Class Management': '🏫',
    'Subject Management': '📚',
    'Academic Management': '📅',
    'Fee Management': '💰',
    'User Management': '👥',
    'Student Management': '🎓',
    'Employee Management': '🧑',
    'Report Management': '📈'
  };

  // SubModule icons mapping
  const subModuleIcons = {
    'Classes': '🏫',
    'Sections': '📋',
    'Subjects': '📖',
    'Subject Assignments': '🔗',
    'Class Subjects': '🎯',
    'Teacher Subjects': '👨‍🏫',
    'Sessions': '📅',
    'Fee Structures': '💳',
    'Fee Collection': '💰',
    'Users': '👥',
    'Students': '🎓',
    'Employees': '🧑',
    'Reports': '📈'
  };

  // Static menu items for SuperAdmin
  const superAdminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '💎' },
    { id: 'tenants', label: 'Tenants', icon: '🏢' },
    { id: 'roles', label: 'Roles', icon: '🎭' },
    { id: 'modules', label: 'Modules', icon: '🧩' },
    { id: 'submodules', label: 'SubModules', icon: '🔧' },
    { id: 'role-scope', label: 'Role Scope', icon: '🔒' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '📋' },
  ];

  // Generate dynamic menu items from permissions
  const dynamicMenuItems = useMemo(() => {
    if (role === 'superadmin' || !permissions) {
      return [];
    }

    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' }
    ];

    // Add static items that don't come from permissions
    const staticItems = [
      { id: 'users', label: 'Users', icon: '👥' },
      { id: 'employees', label: 'Employees', icon: '🧑' },
      { id: 'students', label: 'Students', icon: '🎓' },
      { id: 'reports', label: 'Reports', icon: '📈' }
    ];

    menuItems.push(...staticItems);

    // Process permissions to create module structure
    if (permissions && Array.isArray(permissions)) {
      permissions.forEach(module => {
        const moduleItem = {
          id: module.moduleName.toLowerCase().replace(/\s+/g, '-'),
          label: module.moduleName,
          icon: moduleIcons[module.moduleName] || '📁',
          hasSubmodules: true,
          submodules: module.subModules.map(subModule => ({
            id: subModule.subModuleName.toLowerCase().replace(/\s+/g, '-'),
            label: subModule.subModuleName,
            icon: subModuleIcons[subModule.subModuleName] || '📄',
            permissions: subModule.permissions
          }))
        };
        menuItems.push(moduleItem);
      });
    }

    return menuItems;
  }, [role, permissions]);

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const Item = ({ id, label, icon }) => (
    <button
      onClick={() => onNavigate(id)}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left w-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 relative overflow-hidden group ${current === id ? 'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500 font-medium shadow-md' : ''}`}>
      <div className={`text-lg ${current === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${current === id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'}`}>{label}</span>
      {current === id && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
      )}
    </button>
  );

  const ModuleItem = ({ id, label, icon, hasSubmodules, submodules }) => {
    const isExpanded = expandedModules[id] || false;
    
    return (
      <div>
        <button
          onClick={() => hasSubmodules ? toggleModule(id) : onNavigate(id)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left w-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 relative overflow-hidden group ${current === id ? 'bg-gradient-to-r from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-500 font-medium shadow-md' : ''}`}>
          <div className={`text-lg ${current === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors'}`}>
            {icon}
          </div>
          <span className={`text-sm font-medium flex-1 ${current === id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'}`}>{label}</span>
          {hasSubmodules && (
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          {current === id && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r"></div>
          )}
        </button>
        {hasSubmodules && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {submodules.map(submodule => (
              <button
                key={submodule.id}
                onClick={() => onNavigate(submodule.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-left w-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 ${current === submodule.id ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : ''}`}>
                <div className="text-sm">{submodule.icon}</div>
                <span className="text-xs font-medium">{submodule.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      )}
      <aside className={`fixed inset-y-0 left-0 md:relative w-56 h-[calc(100vh-56px)] border-r p-3 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out md:z-auto md:translate-x-0 z-50 ${open ? 'translate-x-0' : '-translate-x-full'} md:static`}>
        <nav className="px-2 space-y-2 mt-4">
          {role === 'superadmin' ? (
            // SuperAdmin static menu
            superAdminMenuItems.map(menu => (
              <Item key={menu.id} id={menu.id} label={menu.label} icon={menu.icon} />
            ))
          ) : (
            // Dynamic menu for other roles
            dynamicMenuItems.map(menu => {
              if (menu.hasSubmodules) {
                return (
                  <ModuleItem
                    key={menu.id}
                    id={menu.id}
                    label={menu.label}
                    icon={menu.icon}
                    hasSubmodules={menu.hasSubmodules}
                    submodules={menu.submodules}
                  />
                );
              } else {
                return (
                  <Item key={menu.id} id={menu.id} label={menu.label} icon={menu.icon} />
                );
              }
            })
          )}
        </nav>
      </aside>
    </>
  );
}