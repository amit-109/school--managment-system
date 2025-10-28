import React, { useEffect, useState, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchTenantAdminsAsync,
  fetchAdminRoleScopeAsync,
  updateAdminRoleScopeAsync,
  fetchRolesAsync,
} from '../Services/superAdminStore';
import { TenantAdmin, RoleScopeRole, Role } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

const RoleScope: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    tenantAdmins,
    adminRoleScope,
    roles,
    tenantAdminsLoading,
    adminRoleScopeLoading,
    updatingRoleScope,
    rolesLoading,
  } = useSelector((state: RootState) => state.superAdmin);

  const [selectedAdminId, setSelectedAdminId] = useState<number>(0);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  useEffect(() => {
    if (!tenantAdmins || tenantAdmins.length === 0) {
      dispatch(fetchTenantAdminsAsync());
    }
    if (!roles || roles.length === 0) {
      dispatch(fetchRolesAsync({ page: 0, size: 100 }));
    }
  }, [dispatch, tenantAdmins, roles]);

  const handleAdminChange = async (adminUserId: number) => {
    setSelectedAdminId(adminUserId);
    if (adminUserId > 0) {
      try {
        const roleScope = await dispatch(fetchAdminRoleScopeAsync(adminUserId)).unwrap();
        setSelectedRoleIds(roleScope.map(role => role.roleId));
      } catch (error) {
        console.error('Failed to fetch admin role scope:', error);
        setSelectedRoleIds([]);
      }
    } else {
      setSelectedRoleIds([]);
    }
  };

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleUpdateRoleScope = async () => {
    if (selectedAdminId === 0) {
      toast.error('Please select an admin');
      return;
    }

    try {
      await dispatch(updateAdminRoleScopeAsync({ 
        adminUserId: selectedAdminId, 
        roleIds: selectedRoleIds 
      })).unwrap();
      toast.success('Role scope updated successfully!');
    } catch (error: any) {
      toast.error(`Failed to update role scope: ${error}`);
    }
  };

  const getSelectedAdmin = (): TenantAdmin | undefined => {
    return tenantAdmins?.find(admin => admin.adminUserId === selectedAdminId);
  };

  if (tenantAdminsLoading && (!tenantAdmins || tenantAdmins.length === 0)) {
    return (
      <LoadingOverlay isLoading={true}>
        <section className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Role Scope Management</h1>
            <p className="text-sm text-slate-600">Loading tenant admins...</p>
          </div>
        </section>
      </LoadingOverlay>
    );
  }

  return (
    <LoadingOverlay isLoading={adminRoleScopeLoading || updatingRoleScope}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Role Scope Management</h1>
          <p className="text-sm text-slate-600">Assign roles to tenant administrators</p>
        </div>

        {/* Admin Selection */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Tenant Admin:</label>
              <select
                value={selectedAdminId}
                onChange={(e) => handleAdminChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value={0}>Select an Admin</option>
                {tenantAdmins?.map((admin: TenantAdmin) => (
                  <option key={admin.adminUserId} value={admin.adminUserId}>
                    {admin.adminName} - {admin.organizationName}
                  </option>
                ))}
              </select>
            </div>

            {selectedAdminId > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">Admin Details:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {getSelectedAdmin()?.adminName}</div>
                  <div><strong>Organization:</strong> {getSelectedAdmin()?.organizationName}</div>
                  <div><strong>Email:</strong> {getSelectedAdmin()?.email}</div>
                  <div><strong>Username:</strong> {getSelectedAdmin()?.username}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Assignment */}
        {selectedAdminId > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assign Roles</h3>
              
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  {roles?.map((role: Role) => (
                    <label key={role.roleId} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.roleId)}
                        onChange={() => handleRoleToggle(role.roleId)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{role.roleName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateRoleScope}
                  disabled={selectedRoleIds.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Role Scope
                </button>
                <button
                  onClick={() => {
                    setSelectedAdminId(0);
                    setSelectedRoleIds([]);
                  }}
                  className="btn-secondary"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedAdminId === 0 && !tenantAdminsLoading && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">Please select a tenant admin to manage their role scope.</p>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default RoleScope;