import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import LoadingOverlay from '../shared/LoadingOverlay';
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

      // Extract arrays from nested response structure
      const adminPermissions = Array.isArray(adminData?.data) ? adminData.data : 
                              Array.isArray(adminData) ? adminData : [];
      const userPermissions = Array.isArray(userData?.data) ? userData.data : 
                             Array.isArray(userData) ? userData : [];
      
      console.log('Extracted admin permissions:', adminPermissions);
      console.log('Extracted user permissions:', userPermissions);
      
      setAdminPerms(adminPermissions);
      setUserPerms(userPermissions);

      // Create permission matrix by merging both responses
      createPermissionMatrix(adminPermissions, userPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const createPermissionMatrix = (adminPermissions, userPermissions) => {
    const matrix = {};
    
    // Ensure we have arrays to work with
    if (!Array.isArray(adminPermissions) || !Array.isArray(userPermissions)) {
      console.error('Invalid permission data structure:', { adminPermissions, userPermissions });
      setPermissionMatrix({});
      return;
    }
    
    // Group by moduleName and subModuleName
    adminPermissions.forEach(adminPerm => {
      const moduleKey = adminPerm.moduleName;
      const subModuleKey = adminPerm.subModuleName || 'General';
      const permissionType = adminPerm.permissionKey.split('.').pop(); // Get View/Create/Edit/Delete
      
      if (!matrix[moduleKey]) {
        matrix[moduleKey] = {};
      }
      if (!matrix[moduleKey][subModuleKey]) {
        matrix[moduleKey][subModuleKey] = {
          permissions: {},
          adminCan: { View: false, Create: false, Edit: false, Delete: false },
          userCan: { View: false, Create: false, Edit: false, Delete: false }
        };
      }

      // Find corresponding user permission
      const userPerm = userPermissions.find(up => up.permissionId === adminPerm.permissionId) || {
        canView: false, canCreate: false, canEdit: false, canDelete: false
      };

      // Store permission details
      matrix[moduleKey][subModuleKey].permissions[permissionType] = {
        permissionId: adminPerm.permissionId,
        permissionKey: adminPerm.permissionKey,
        permissionName: adminPerm.permissionName
      };

      // Set admin capabilities
      matrix[moduleKey][subModuleKey].adminCan[permissionType] = adminPerm.canView || adminPerm.canCreate || adminPerm.canEdit || adminPerm.canDelete;
      
      // Set user current permissions
      matrix[moduleKey][subModuleKey].userCan[permissionType] = userPerm.canView || userPerm.canCreate || userPerm.canEdit || userPerm.canDelete;
    });

    console.log('Permission matrix created:', matrix);
    setPermissionMatrix(matrix);
  };

  // Handle permission toggle changes
  const handlePermissionToggle = (moduleKey, subModuleKey, permissionType, value) => {
    setPermissionMatrix(prev => {
      const newMatrix = JSON.parse(JSON.stringify(prev));
      newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
      return newMatrix;
    });
  };

  // Handle module-level toggle (master toggle)
  const handleModuleToggle = (moduleKey, value) => {
    setPermissionMatrix(prev => {
      const newMatrix = JSON.parse(JSON.stringify(prev));
      Object.keys(newMatrix[moduleKey]).forEach(subModuleKey => {
        ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
          if (newMatrix[moduleKey][subModuleKey].adminCan[permissionType]) {
            newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
          }
        });
      });
      return newMatrix;
    });
  };

  // Handle submodule-level toggle
  const handleSubModuleToggle = (moduleKey, subModuleKey, value) => {
    setPermissionMatrix(prev => {
      const newMatrix = JSON.parse(JSON.stringify(prev));
      ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
        if (newMatrix[moduleKey][subModuleKey].adminCan[permissionType]) {
          newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
        }
      });
      return newMatrix;
    });
  };

  // Check if module is fully enabled
  const isModuleEnabled = (moduleKey) => {
    const module = permissionMatrix[moduleKey];
    if (!module) return false;
    return Object.values(module).every(subModule => 
      ['View', 'Create', 'Edit', 'Delete'].every(type => 
        !subModule.adminCan[type] || subModule.userCan[type]
      )
    );
  };

  // Check if submodule is fully enabled
  const isSubModuleEnabled = (moduleKey, subModuleKey) => {
    const subModule = permissionMatrix[moduleKey]?.[subModuleKey];
    if (!subModule) return false;
    return ['View', 'Create', 'Edit', 'Delete'].every(type => 
      !subModule.adminCan[type] || subModule.userCan[type]
    );
  };

  // Save permissions - collect all rows and POST to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Collect all permissions with full payload structure
      const permissions = [];
      Object.entries(permissionMatrix).forEach(([moduleKey, subModules]) => {
        Object.entries(subModules).forEach(([subModuleKey, subModuleData]) => {
          ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
            const permissionInfo = subModuleData.permissions[permissionType];
            if (permissionInfo) {
              const isEnabled = subModuleData.userCan[permissionType];
              permissions.push({
                userId: selectedUser.userId,
                permissionId: permissionInfo.permissionId,
                permissionKey: permissionInfo.permissionKey,
                permissionName: permissionInfo.permissionName,
                moduleName: moduleKey,
                subModuleName: subModuleKey === 'General' ? '' : subModuleKey,
                isAssigned: isEnabled,
                canView: permissionType === 'View' ? isEnabled : false,
                canCreate: permissionType === 'Create' ? isEnabled : false,
                canEdit: permissionType === 'Edit' ? isEnabled : false,
                canDelete: permissionType === 'Delete' ? isEnabled : false
              });
            }
          });
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

  return (
    <LoadingOverlay isLoading={loading || saving}>
      <div className="h-full max-h-screen overflow-hidden flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Assign Permissions</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Manage permissions for {selectedUser?.firstName} {selectedUser?.lastName} ({selectedUser?.roleName})
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => {
              localStorage.removeItem('selectedUserForPermissions');
              onNavigate('permission-management');
            }}
            className="btn-secondary w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden flex flex-col">
        <div className="p-3 sm:p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-2">
            {/* Show skeleton while loading */}
            {loading && (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border rounded-lg">
                    <div className="bg-slate-50 px-3 sm:px-4 py-3 border-b">
                      <div className="h-5 sm:h-6 bg-slate-200 rounded animate-pulse w-32 sm:w-48"></div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <div className="bg-slate-100 rounded-lg p-3 sm:p-4">
                        <div className="h-3 sm:h-4 bg-slate-200 rounded animate-pulse w-24 sm:w-32 mb-3"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          {[1, 2, 3, 4].map(j => (
                            <div key={j} className="h-10 sm:h-12 bg-slate-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Enhanced Permission Matrix with Module and SubModule toggles */}
            {!loading && Object.entries(permissionMatrix).map(([moduleName, subModules]) => (
              <div key={moduleName} className="border rounded-lg flex-shrink-0">
                {/* Module Header with Master Toggle */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                  <h3 className="font-semibold text-slate-900 text-base sm:text-lg">{moduleName}</h3>
                  <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                    <span className="text-xs sm:text-sm font-medium text-slate-700">Enable All</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isModuleEnabled(moduleName)}
                        onChange={(e) => handleModuleToggle(moduleName, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 sm:w-11 h-5 sm:h-6 rounded-full transition-colors ${
                        isModuleEnabled(moduleName) ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          isModuleEnabled(moduleName) ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                      </div>
                    </div>
                  </label>
                </div>
                
                {/* SubModules */}
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {Object.entries(subModules).map(([subModuleName, subModuleData]) => (
                    <div key={subModuleName} className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      {/* SubModule Header with Toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
                        <h4 className="font-medium text-slate-800 text-sm sm:text-base">{subModuleName}</h4>
                        <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                          <span className="text-xs sm:text-sm text-slate-600">Enable</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isSubModuleEnabled(moduleName, subModuleName)}
                              onChange={(e) => handleSubModuleToggle(moduleName, subModuleName, e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-9 sm:w-10 h-4 sm:h-5 rounded-full transition-colors ${
                              isSubModuleEnabled(moduleName, subModuleName) ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              <div className={`w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full shadow transform transition-transform ${
                                isSubModuleEnabled(moduleName, subModuleName) ? 'translate-x-5' : 'translate-x-0.5'
                              } mt-0.5`}></div>
                            </div>
                          </div>
                        </label>
                      </div>
                      
                      {/* Permission Type Toggles */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {['View', 'Create', 'Edit', 'Delete'].map(permissionType => {
                          const canAssign = subModuleData.adminCan[permissionType];
                          const isEnabled = subModuleData.userCan[permissionType];
                          const colors = {
                            View: 'blue', Create: 'green', Edit: 'yellow', Delete: 'red'
                          };
                          const color = colors[permissionType];
                          
                          return (
                            <div key={permissionType} className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                              !canAssign ? 'bg-gray-100 border-gray-200 opacity-50' : 
                              isEnabled ? `bg-${color}-50 border-${color}-200` : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}>
                              <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  disabled={!canAssign}
                                  onChange={(e) => handlePermissionToggle(moduleName, subModuleName, permissionType, e.target.checked)}
                                  className={`rounded text-xs sm:text-sm ${!canAssign ? 'opacity-50' : ''}`}
                                />
                                <span className={`text-xs sm:text-sm font-medium ${
                                  !canAssign ? 'text-gray-400' : 
                                  isEnabled ? `text-${color}-700` : 'text-gray-600'
                                }`}>
                                  {permissionType}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {!loading && Object.keys(permissionMatrix).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>No permissions available to assign.</p>
                <p className="text-sm mt-2">Please ensure the backend APIs are implemented and return permission data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </LoadingOverlay>
  );
};

export default PermissionAssignment;