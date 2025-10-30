import React, { useState, useEffect } from 'react';
import { getUsers } from '../Services/adminService';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
// Simple key icon component
const KeyIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243A6 6 0 0121 9z" />
  </svg>
);

const PermissionManagement = ({ onNavigate }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('PermissionManagement: Component mounted, loading users');
    // Force clear any leftover permission assignment data
    localStorage.removeItem('selectedUserForPermissions');
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('PermissionManagement: Loading users...');
      const response = await getUsers(1, 100);
      console.log('PermissionManagement: Users response:', response);
      console.log('PermissionManagement: Extracted users:', response.data?.users);
      const extractedUsers = response.data?.users || [];
      console.log('PermissionManagement: Setting users to:', extractedUsers);
      setUsers(extractedUsers);
    } catch (error) {
      console.error('PermissionManagement: Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissions = (user) => {
    console.log('PermissionManagement: Assigning permissions for user:', user);
    localStorage.setItem('selectedUserForPermissions', JSON.stringify(user));
    onNavigate('permission-assignment', true);
  };

  const columns = [
    { headerName: 'Name', field: 'fullName', flex: 1 },
    { headerName: 'Email', field: 'email', flex: 1 },
    { headerName: 'Role', field: 'roleName', flex: 1 },
    { headerName: 'Status', field: 'status', flex: 1,
      cellRenderer: (params) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          params.value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {params.value}
        </span>
      )
    },
    {
      headerName: 'Actions',
      cellRenderer: (params) => (
        <button 
          onClick={() => handleAssignPermissions(params.data)} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          title="Assign Permissions"
        >
          <KeyIcon className="w-4 h-4" />
          Assign Permissions
        </button>
      ),
      width: 150
    }
  ];

  console.log('PermissionManagement: Rendering with users:', users, 'loading:', loading);

  return (
    <LoadingOverlay isLoading={loading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Permission Management</h1>
          <p className="text-sm text-slate-600">Select a user to manage their permissions</p>
        </div>

        <AgGridBox
          title="Users"
          columnDefs={columns}
          rowData={users}
        />
        
        {users.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-500">
            <p>No users found or API call failed.</p>
            <p className="text-sm mt-2">Check console for errors.</p>
          </div>
        )}
      </section>
    </LoadingOverlay>
  );
};

export default PermissionManagement;