import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { 
  getAdminEffectivePermissions, 
  getUserPermissionsForAssignment, 
  updateUserPermissionsForAssignment
} from '../Services/adminService';

const PermissionAssignment = ({ onNavigate }) => {
  const { accessToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminPerms, setAdminPerms] = useState([]);
  const [userPerms, setUserPerms] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionMatrix, setPermissionMatrix] = useState({});

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      // Get selected user from localStorage
      const selectedUserData = localStorage.getItem('selectedUserForPermissions');
      if (!selectedUserData) {
        // Clear any leftover data and redirect to user list
        localStorage.removeItem('selectedUserForPermissions');
        onNavigate('permission-management');
        return;
      }
      
      const user = JSON.parse(selectedUserData);
      setSelectedUser(user);
      
      // Get current logged-in admin ID from token
      let adminId;
      try {
        if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          adminId = parseInt(payload.sub) || parseInt(payload.userId) || parseInt(payload.id);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
      
      if (!adminId) {
        toast.error('Unable to identify current admin user');
        onNavigate('permission-management');
        return;
      }

      console.log('Loading permissions for:', { adminId, userId: user.userId });

      // Step 1 & 2: Load admin's effective permissions and user's current permissions
      const [adminData, userData] = await Promise.all([
        getAdminEffectivePermissions(adminId),
        getUserPermissionsForAssignment(user.userId)
      ]);

      console.log('Admin effective permissions:', adminData);
      console.log('User current permissions:', userData);

      setAdminPerms(adminData?.data || []);
      setUserPerms(userData?.data || []);

      // Create permission matrix by merging both responses
      createPermissionMatrix(adminData?.data || [], userData?.data || []);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const createPermissionMatrix = (adminPermissions, userPermissions) => {
    const matrix = {};
    
    // Group by moduleName as per specification
    adminPermissions.forEach(adminPerm => {
      const moduleKey = adminPerm.moduleName;
      if (!matrix[moduleKey]) {
        matrix[moduleKey] = [];
      }

      // Find corresponding user permission by permissionId
      const userPerm = userPermissions.find(up => up.permissionId === adminPerm.permissionId) || {
        permissionId: adminPerm.permissionId,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false
      };

      // Merge admin and user permissions for UI binding
      matrix[moduleKey].push({
        permissionId: adminPerm.permissionId,
        permissionKey: adminPerm.permissionKey,
        permissionName: adminPerm.permissionName,
        moduleName: adminPerm.moduleName,
        subModuleName: adminPerm.subModuleName || '',
        // Admin's capabilities (what admin can assign)
        adminCanView: adminPerm.canView,
        adminCanCreate: adminPerm.canCreate,
        adminCanEdit: adminPerm.canEdit,
        adminCanDelete: adminPerm.canDelete,
        // User's current permissions
        userCanView: userPerm.canView,
        userCanCreate: userPerm.canCreate,
        userCanEdit: userPerm.canEdit,
        userCanDelete: userPerm.canDelete
      });
    });

    console.log('Permission matrix created:', matrix);
    setPermissionMatrix(matrix);
  };

  // Handle checkbox changes
  const handlePermissionChange = (permissionId, action, value) => {
    setPermissionMatrix(prev => {
      const newMatrix = { ...prev };
      
      Object.keys(newMatrix).forEach(moduleKey => {
        newMatrix[moduleKey] = newMatrix[moduleKey].map(perm => {
          if (perm.permissionId === permissionId) {
            return {
              ...perm,
              [`user${action.charAt(0).toUpperCase() + action.slice(1)}`]: value
            };
          }
          return perm;
        });
      });
      
      return newMatrix;
    });
  };

  // Save permissions - collect all rows and POST to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Collect all permissions with full payload structure
      const permissions = [];
      Object.values(permissionMatrix).flat().forEach(perm => {
        permissions.push({
          userId: selectedUser.userId,
          permissionId: perm.permissionId,
          permissionKey: perm.permissionKey,
          permissionName: perm.permissionName,
          moduleName: perm.moduleName,
          subModuleName: perm.subModuleName || '',
          isAssigned: perm.userCanView || perm.userCanCreate || perm.userCanEdit || perm.userCanDelete,
          canView: perm.userCanView,
          canCreate: perm.userCanCreate,
          canEdit: perm.userCanEdit,
          canDelete: perm.userCanDelete
        });
      });

      console.log('Saving permissions:', permissions);
      console.log('Payload structure:', JSON.stringify(permissions, null, 2));

      await updateUserPermissionsForAssignment(selectedUser.userId, permissions);
      toast.success('User permissions updated successfully');
      localStorage.removeItem('selectedUserForPermissions');
      onNavigate('permission-management');
    } catch (error) {
      console.error('Error saving permissions:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to update permissions: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assign Permissions</h1>
          <p className="text-slate-600">
            Manage permissions for {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.roleName})
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('selectedUserForPermissions');
              onNavigate('permission-management');
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="space-y-6">
            {/* Group by moduleName - Use collapsible panels as suggested */}
            {Object.entries(permissionMatrix).map(([moduleName, permissions]) => (
              <div key={moduleName} className="border rounded-lg">
                <div className="bg-slate-50 px-4 py-3 border-b">
                  <h3 className="font-medium text-slate-900">{moduleName}</h3>
                </div>
                <div className="p-4">
                  <div className="overflow-x-auto">
                    {/* Permission table - checkbox matrix for View/Create/Edit/Delete */}
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-slate-700">Permission</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-700">View</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-700">Create</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-700">Edit</th>
                          <th className="text-center py-2 px-3 font-medium text-slate-700">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((permission) => (
                          <tr key={permission.permissionId} className="border-b">
                            <td className="py-2 px-3 text-slate-900">
                              {permission.permissionName}
                            </td>
                            {/* Checkbox binding logic: checkbox.disabled = !adminPermission.canView; checkbox.checked = userPermission.canView; */}
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={permission.userCanView}
                                disabled={!permission.adminCanView}
                                onChange={(e) => handlePermissionChange(
                                  permission.permissionId, 
                                  'canView', 
                                  e.target.checked
                                )}
                                className="rounded"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={permission.userCanCreate}
                                disabled={!permission.adminCanCreate}
                                onChange={(e) => handlePermissionChange(
                                  permission.permissionId, 
                                  'canCreate', 
                                  e.target.checked
                                )}
                                className="rounded"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={permission.userCanEdit}
                                disabled={!permission.adminCanEdit}
                                onChange={(e) => handlePermissionChange(
                                  permission.permissionId, 
                                  'canEdit', 
                                  e.target.checked
                                )}
                                className="rounded"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={permission.userCanDelete}
                                disabled={!permission.adminCanDelete}
                                onChange={(e) => handlePermissionChange(
                                  permission.permissionId, 
                                  'canDelete', 
                                  e.target.checked
                                )}
                                className="rounded"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
            
            {Object.keys(permissionMatrix).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No permissions available to assign.</p>
                <p className="text-sm mt-2">Please ensure the backend APIs are implemented and return permission data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionAssignment;