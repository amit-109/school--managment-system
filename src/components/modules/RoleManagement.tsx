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
  fetchAllPermissionsAsync,
  fetchRolePermissionDetailsAsync,
  assignPermissionToRoleAsync,
} from '../Services/superAdminStore';
import { Role, RoleCreateData, RoleUpdateData, Permission, RolePermissionDetail, PermissionAssignment } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

interface RoleFormData {
  roleName: string;
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
    allPermissions,
    rolePermissionDetails,
    allPermissionsLoading,
    rolePermissionDetailsLoading,
    assigningPermission,
    error,
  } = useSelector((state: RootState) => state.superAdmin);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [roleForm, setRoleForm] = useState<RoleFormData>({
    roleName: '',
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);


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
        roleName: roleForm.roleName.trim(),
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
        roleName: roleForm.roleName.trim(),
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
    });
    setShowEditModal(true);
  };

  const resetForm = (): void => {
    setRoleForm({
      roleName: '',
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchTerm(value));
    setCurrentPage(0);
  };



  const handleManagePermissions = (role: Role) => {
    dispatch(setSelectedRole(role));
    setShowPermissionsModal(true);
    dispatch(fetchAllPermissionsAsync());
    dispatch(fetchRolePermissionDetailsAsync(role.roleId));
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
      headerName: 'Actions',
      field: 'actions',
      width: 150,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEditRole(params.data)}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Edit Role"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDeleteRole(params.data)}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Delete Role"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <div className="relative group">
            <button
              onClick={() => handleManagePermissions(params.data)}
              className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Permissions
            </div>
          </div>
        </div>
      ),
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Total Roles</h3>
            <div className="text-2xl font-bold">{Array.isArray(roles) ? roles.length : 0}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Active Roles</h3>
            <div className="text-2xl font-bold">{Array.isArray(roles) ? roles.length : 0}</div>
          </div>
        </div>

        <AgGridBox
          title="System Roles"
          columnDefs={roleColumns}
          rowData={Array.isArray(roles) ? roles : []}
          toolbar={toolbarButtons}
          showActions={false}
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

              {/* Delete Button */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <button
                  type="button"
                  onClick={() => selectedRole && handleDeleteRole(selectedRole)}
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Management Modal */}
        {showPermissionsModal && selectedRole && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Manage Permissions - {selectedRole.roleName}</h3>
              
              {allPermissionsLoading || rolePermissionDetailsLoading ? (
                <div className="text-center py-8">Loading permissions...</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    allPermissions?.reduce((acc: any, permission: Permission) => {
                      if (!acc[permission.moduleName]) acc[permission.moduleName] = [];
                      acc[permission.moduleName].push(permission);
                      return acc;
                    }, {}) || {}
                  ).map(([moduleName, permissions]: [string, any]) => (
                    <div key={moduleName} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{moduleName}</h4>
                      <div className="space-y-2">
                        {permissions.map((permission: Permission) => {
                          const rolePermission = rolePermissionDetails?.find(
                            (rp: RolePermissionDetail) => rp.permissionId === permission.permissionId
                          );
                          return (
                            <div key={permission.permissionId} className="grid grid-cols-6 gap-2 items-center py-2 border-b">
                              <div className="col-span-2">
                                <span className="text-sm font-medium">{permission.permissionName}</span>
                              </div>
                              {['canView', 'canCreate', 'canEdit', 'canDelete'].map((action) => (
                                <label key={action} className="flex items-center space-x-1">
                                  <input
                                    type="checkbox"
                                    checked={rolePermission?.[action as keyof RolePermissionDetail] || false}
                                    onChange={async (e) => {
                                      const permissionData: PermissionAssignment = {
                                        roleId: selectedRole.roleId,
                                        permissionId: permission.permissionId,
                                        canView: action === 'canView' ? e.target.checked : (rolePermission?.canView || false),
                                        canCreate: action === 'canCreate' ? e.target.checked : (rolePermission?.canCreate || false),
                                        canEdit: action === 'canEdit' ? e.target.checked : (rolePermission?.canEdit || false),
                                        canDelete: action === 'canDelete' ? e.target.checked : (rolePermission?.canDelete || false),
                                      };
                                      try {
                                        await dispatch(assignPermissionToRoleAsync(permissionData)).unwrap();
                                        dispatch(fetchRolePermissionDetailsAsync(selectedRole.roleId));
                                      } catch (error: any) {
                                        toast.error(`Failed to update permission: ${error}`);
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-xs">{action.replace('can', '')}</span>
                                </label>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 pt-4 mt-6 border-t">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="btn-secondary flex-1"
                >
                  Close
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
