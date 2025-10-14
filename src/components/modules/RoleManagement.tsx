import React, { useEffect, useState, useCallback, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchRolesAsync,
  createRoleAsync,
  updateRoleAsync,
  deleteRoleAsync,
  setSelectedRole,
  setSearchTerm,
} from '../Services/superAdminStore';
import { Role, RoleCreateData, RoleUpdateData } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

interface RoleFormData {
  roleName: string;
  description: string;
  permissions: string[];
}

interface RoleManagementProps {
  // Props can be added here if needed in the future
}

const RoleManagement: FC<RoleManagementProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    roles,
    rolesPagination,
    rolesLoading,
    creatingRole,
    updatingRole,
    deletingRole,
    searchTerm,
    selectedRole,
    error,
  } = useSelector((state: RootState) => state.superAdmin);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    roleName: '',
    description: '',
    permissions: [],
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [permissionsInput, setPermissionsInput] = useState<string>('');

  useEffect(() => {
    loadRoles();
  }, [currentPage, pageSize, searchTerm]);

  const loadRoles = useCallback(() => {
    dispatch(fetchRolesAsync({ page: currentPage, size: pageSize, search: searchTerm }));
  }, [dispatch, currentPage, pageSize, searchTerm]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roleData: RoleCreateData = {
        roleName: roleForm.roleName,
        description: roleForm.description,
        permissions: roleForm.permissions,
      };
      await dispatch(createRoleAsync(roleData)).unwrap();
      toast.success('Role created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadRoles();
    } catch (error: any) {
      toast.error(`Failed to create role: ${error}`);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    try {
      const roleData: RoleUpdateData = {
        roleName: roleForm.roleName,
        description: roleForm.description,
        permissions: roleForm.permissions,
      };
      await dispatch(updateRoleAsync({
        roleId: selectedRole.roleId,
        roleData
      })).unwrap();
      toast.success('Role updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadRoles();
    } catch (error: any) {
      toast.error(`Failed to update role: ${error}`);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete role "${role.roleName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteRoleAsync(role.roleId)).unwrap();
        toast.success('Role deleted successfully!');
        loadRoles();
      } catch (error: any) {
        toast.error(`Failed to delete role: ${error}`);
      }
    }
  };

  const handleEditRole = (role: Role) => {
    dispatch(setSelectedRole(role));
    setRoleForm({
      roleName: role.roleName,
      description: role.description,
      permissions: role?.permissions ?? [],
    });
    setPermissionsInput((role?.permissions ?? []).join(', '));
    setShowEditModal(true);
  };

  const resetForm = (): void => {
    setRoleForm({
      roleName: '',
      description: '',
      permissions: [],
    });
    setPermissionsInput('');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchTerm(value));
    setCurrentPage(0);
  };

  const handlePermissionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPermissionsInput(value);
    const permissions = value.split(',').map(p => p.trim()).filter(p => p !== '');
    setRoleForm({...roleForm, permissions});
  };

  const roleColumns = [
    {
      headerName: 'ID',
      field: 'roleId',
      width: 80,
      sortable: true,
    },
    {
      headerName: 'Role Name',
      field: 'roleName',
      sortable: true,
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="max-w-xs truncate" title={params.value}>
          {params.value}
        </div>
      ),
    },
    {
      headerName: 'Permissions',
      field: 'permissions',
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="max-w-xs">
          <div className="flex flex-wrap gap-1">
            {params.value?.slice(0, 2)?.map((permission: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                {permission}
              </span>
            ))}
            {params.value?.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{params.value.length - 2} more
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      headerName: 'System Role',
      field: 'isSystemRole',
      sortable: true,
      cellRenderer: (params: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        }`}>
          {params.value ? 'System' : 'Custom'}
        </span>
      ),
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      sortable: true,
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowCreateModal(true)}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Role
      </button>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
    </div>
  );

  return (
    <LoadingOverlay isLoading={rolesLoading || creatingRole || updatingRole || deletingRole}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Role Management</h1>
          <p className="text-sm text-slate-600">Create, edit, and manage system roles and their permissions</p>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Total Roles</h3>
            <div className="text-2xl font-bold">{Array.isArray(roles) ? roles.length : 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">System Roles</h3>
            <div className="text-2xl font-bold">
              {Array.isArray(roles) ? roles.filter((role: Role) => role?.isSystemRole ?? false).length : 0}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Custom Roles</h3>
            <div className="text-2xl font-bold">
              {Array.isArray(roles) ? roles.filter((role: Role) => !(role?.isSystemRole ?? false)).length : 0}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Avg Permissions</h3>
            <div className="text-2xl font-bold">
              {Array.isArray(roles) && roles.length > 0
                ? Math.round(roles.reduce((sum, role: Role) => sum + (role.permissions?.length || 0), 0) / roles.length)
                : 0}
            </div>
          </div>
        </div>

        <AgGridBox
          title="System Roles"
          columnDefs={roleColumns}
          rowData={Array.isArray(roles) ? roles : []}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          toolbar={toolbarButtons}
        />

        {/* Create Role Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    value={roleForm.roleName}
                    onChange={(e) => setRoleForm({...roleForm, roleName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g., Admin, Manager, Operator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={3}
                    placeholder="Describe the role's responsibilities"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Permissions (comma-separated)</label>
                  <textarea
                    value={permissionsInput}
                    onChange={handlePermissionsChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={3}
                    placeholder="e.g., users:read, users:write, users:delete, reports:view"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {showEditModal && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Role</h3>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    value={roleForm.roleName}
                    onChange={(e) => setRoleForm({...roleForm, roleName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  disabled={selectedRole?.isSystemRole ?? false}
                  />
                  {selectedRole.isSystemRole && (
                    <p className="text-xs text-orange-600 mt-1">System roles cannot be renamed</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Permissions (comma-separated)</label>
                  <textarea
                    value={permissionsInput}
                    onChange={handlePermissionsChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {/* System Role Warning */}
              {selectedRole.isSystemRole && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This is a system role and some modifications may be restricted.
                    </p>
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <button
                  type="button"
                  onClick={() => selectedRole && handleDeleteRole(selectedRole)}
                  disabled={selectedRole.isSystemRole}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                    selectedRole.isSystemRole
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {selectedRole.isSystemRole ? 'Cannot Delete System Role' : 'Delete Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default RoleManagement;
