import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import LoadingOverlay from '../shared/LoadingOverlay';
import { 
  getAllPermissions, 
  getRolePermissionDetails, 
  assignPermissionToRole 
} from '../Services/superAdminService';

const RolePermissionAssignment = ({ selectedRole, onClose }) => {
  const { accessToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [permissionMatrix, setPermissionMatrix] = useState({});

  useEffect(() => {
    if (selectedRole) {
      loadPermissions();
    }
  }, [selectedRole]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      
      const [allPermsData, rolePermsData] = await Promise.all([
        getAllPermissions(),
        getRolePermissionDetails(selectedRole.roleId)
      ]);

      console.log('All permissions:', allPermsData);
      console.log('Role permissions:', rolePermsData);
      console.log('Permissions with submodules:', allPermsData.filter(p => p.subModuleId));
      
      setAllPermissions(allPermsData);
      setRolePermissions(rolePermsData);

      createPermissionMatrix(allPermsData, rolePermsData);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const createPermissionMatrix = (allPermissions, rolePermissions) => {
    const matrix = {};
    
    if (!Array.isArray(allPermissions)) {
      console.error('Invalid permissions data structure:', allPermissions);
      setPermissionMatrix({});
      return;
    }
    
    // Group by moduleName and subModuleName
    allPermissions.forEach(permission => {
      const moduleKey = permission.moduleName;
      // Extract submodule name from permissionKey if subModuleName is missing
      let subModuleKey = 'General';
      
      if (permission.subModuleName) {
        subModuleKey = permission.subModuleName;
      } else if (permission.subModuleId) {
        // Extract submodule name from permission key
        const keyParts = permission.permissionKey.split('.');
        if (keyParts.length > 2) {
          // e.g., "Academic Management.Sessions.Create" -> "Sessions"
          subModuleKey = keyParts[keyParts.length - 2];
        }
      }
      
      const permissionType = permission.permissionKey.split('.').pop(); // Get View/Create/Edit/Delete
      
      console.log('Processing permission:', {
        moduleKey,
        subModuleKey,
        permissionType,
        permissionKey: permission.permissionKey,
        hasSubModule: !!permission.subModuleId,
        subModuleId: permission.subModuleId
      });
      
      if (!matrix[moduleKey]) {
        matrix[moduleKey] = {};
      }
      if (!matrix[moduleKey][subModuleKey]) {
        matrix[moduleKey][subModuleKey] = {
          permissions: {},
          adminCan: { View: true, Create: true, Edit: true, Delete: true }, // SuperAdmin can assign all
          userCan: { View: false, Create: false, Edit: false, Delete: false }
        };
      }

      // Find corresponding role permission
      const rolePerm = rolePermissions.find(rp => rp.permissionId === permission.permissionId) || {
        canView: false, canCreate: false, canEdit: false, canDelete: false
      };

      // Store permission details
      matrix[moduleKey][subModuleKey].permissions[permissionType] = {
        permissionId: permission.permissionId,
        permissionKey: permission.permissionKey,
        permissionName: permission.permissionName
      };

      // Set role current permissions based on permission type
      if (permissionType === 'View') {
        matrix[moduleKey][subModuleKey].userCan.View = rolePerm.canView;
      } else if (permissionType === 'Create') {
        matrix[moduleKey][subModuleKey].userCan.Create = rolePerm.canCreate;
      } else if (permissionType === 'Edit') {
        matrix[moduleKey][subModuleKey].userCan.Edit = rolePerm.canEdit;
      } else if (permissionType === 'Delete') {
        matrix[moduleKey][subModuleKey].userCan.Delete = rolePerm.canDelete;
      }
    });

    console.log('Permission matrix created:', matrix);
    console.log('Matrix structure:', Object.keys(matrix).map(module => ({
      module,
      submodules: Object.keys(matrix[module])
    })));
    setPermissionMatrix(matrix);
  };

  // Handle permission toggle changes
  const handlePermissionToggle = async (moduleKey, subModuleKey, permissionType, value) => {
    // Check if trying to enable submodule permission when module doesn't have it
    if (value && subModuleKey !== 'General') {
      const moduleHasPermission = permissionMatrix[moduleKey]['General']?.userCan[permissionType];
      if (!moduleHasPermission) {
        toast.error(`Cannot enable ${permissionType} permission for ${subModuleKey}. Please enable ${permissionType} permission for ${moduleKey} module first.`);
        return;
      }
    }
    
    // Update local state
    setPermissionMatrix(prev => {
      const newMatrix = JSON.parse(JSON.stringify(prev));
      newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
      
      // If disabling a module permission, clear the same permission from all submodules
      if (!value && subModuleKey === 'General') {
        Object.keys(newMatrix[moduleKey]).forEach(subKey => {
          if (subKey !== 'General') {
            newMatrix[moduleKey][subKey].userCan[permissionType] = false;
          }
        });
      }
      
      return newMatrix;
    });

    // Just update local state - save will happen when user clicks Save All button
    // Update rolePermissions state for consistency
    const permissionInfo = permissionMatrix[moduleKey][subModuleKey].permissions[permissionType];
    if (permissionInfo) {
      setRolePermissions(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(rp => rp.permissionId === permissionInfo.permissionId);
        const permissionData = {
          roleId: selectedRole.roleId,
          permissionId: permissionInfo.permissionId,
          canView: permissionType === 'View' ? value : (existingIndex >= 0 ? updated[existingIndex].canView : false),
          canCreate: permissionType === 'Create' ? value : (existingIndex >= 0 ? updated[existingIndex].canCreate : false),
          canEdit: permissionType === 'Edit' ? value : (existingIndex >= 0 ? updated[existingIndex].canEdit : false),
          canDelete: permissionType === 'Delete' ? value : (existingIndex >= 0 ? updated[existingIndex].canDelete : false),
        };
        
        if (existingIndex >= 0) {
          updated[existingIndex] = { ...updated[existingIndex], ...permissionData };
        } else {
          updated.push({ permissionId: permissionInfo.permissionId, ...permissionData });
        }
        return updated;
      });
    }
  };

  // Handle module-level toggle (master toggle)
  const handleModuleToggle = async (moduleKey, value) => {
    setPermissionMatrix(prev => {
      const newMatrix = JSON.parse(JSON.stringify(prev));
      
      // Apply to all submodules including General
      Object.keys(newMatrix[moduleKey]).forEach(subModuleKey => {
        ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
          if (newMatrix[moduleKey][subModuleKey].adminCan[permissionType]) {
            newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
          }
        });
      });
      
      return newMatrix;
    });

    // Collect all permissions for this module and save in batch
    const permissionsToUpdate = [];
    Object.keys(permissionMatrix[moduleKey]).forEach(subModuleKey => {
      ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
        const permissionInfo = permissionMatrix[moduleKey][subModuleKey].permissions[permissionType];
        if (permissionInfo) {
          const currentRolePerm = rolePermissions.find(rp => rp.permissionId === permissionInfo.permissionId) || {
            canView: false, canCreate: false, canEdit: false, canDelete: false
          };
          
          permissionsToUpdate.push({
            roleId: selectedRole.roleId,
            permissionId: permissionInfo.permissionId,
            canView: permissionType === 'View' ? value : currentRolePerm.canView,
            canCreate: permissionType === 'Create' ? value : currentRolePerm.canCreate,
            canEdit: permissionType === 'Edit' ? value : currentRolePerm.canEdit,
            canDelete: permissionType === 'Delete' ? value : currentRolePerm.canDelete,
          });
        }
      });
    });
    
    // Update rolePermissions state for all affected permissions
    if (permissionsToUpdate.length > 0) {
      setRolePermissions(prev => {
        const updated = [...prev];
        permissionsToUpdate.forEach(permData => {
          const existingIndex = updated.findIndex(rp => rp.permissionId === permData.permissionId);
          if (existingIndex >= 0) {
            updated[existingIndex] = { ...updated[existingIndex], ...permData };
          } else {
            updated.push({ permissionId: permData.permissionId, ...permData });
          }
        });
        return updated;
      });
    }
  };

  // Handle submodule-level toggle
  const handleSubModuleToggle = async (moduleKey, subModuleKey, value) => {
    // Check if trying to enable submodule when module doesn't have permissions
    if (value && subModuleKey !== 'General') {
      const generalSubModule = permissionMatrix[moduleKey]['General'];
      
      if (!generalSubModule) {
        toast.error(`Cannot enable ${subModuleKey} permissions. Module structure not found.`);
        return;
      }
      
      const modulePermissions = generalSubModule.userCan;
      const hasAnyModulePermission = modulePermissions && 
        (modulePermissions.View || modulePermissions.Create || modulePermissions.Edit || modulePermissions.Delete);
      
      if (!hasAnyModulePermission) {
        toast.error(`Cannot enable ${subModuleKey} permissions. Please enable at least one permission for ${moduleKey} module first.`);
        return;
      }
    }
    
    setPermissionMatrix(prev => {
      const newMatrix = JSON.parse(JSON.stringify(prev));
      
      // Handle General submodule toggle
      if (subModuleKey === 'General') {
        // Toggle General permissions
        ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
          if (newMatrix[moduleKey][subModuleKey].adminCan[permissionType]) {
            newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
          }
        });
        
        // If disabling General, also disable all other submodules
        if (!value) {
          Object.keys(newMatrix[moduleKey]).forEach(subKey => {
            if (subKey !== 'General') {
              ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
                newMatrix[moduleKey][subKey].userCan[permissionType] = false;
              });
            }
          });
        }
      } else {
        // Handle other submodule toggles
        ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
          if (newMatrix[moduleKey][subModuleKey].adminCan[permissionType]) {
            if (value) {
              const moduleHasPermission = newMatrix[moduleKey]['General']?.userCan[permissionType];
              if (moduleHasPermission) {
                newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
              }
            } else {
              newMatrix[moduleKey][subModuleKey].userCan[permissionType] = value;
            }
          }
        });
      }
      
      return newMatrix;
    });

    // Collect all permissions for this submodule and save in batch
    const permissionsToUpdate = [];
    ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
      const permissionInfo = permissionMatrix[moduleKey][subModuleKey].permissions[permissionType];
      if (permissionInfo) {
        const shouldEnable = value && (subModuleKey === 'General' || permissionMatrix[moduleKey]['General']?.userCan[permissionType]);
        const currentRolePerm = rolePermissions.find(rp => rp.permissionId === permissionInfo.permissionId) || {
          canView: false, canCreate: false, canEdit: false, canDelete: false
        };
        
        permissionsToUpdate.push({
          roleId: selectedRole.roleId,
          permissionId: permissionInfo.permissionId,
          canView: permissionType === 'View' ? shouldEnable : currentRolePerm.canView,
          canCreate: permissionType === 'Create' ? shouldEnable : currentRolePerm.canCreate,
          canEdit: permissionType === 'Edit' ? shouldEnable : currentRolePerm.canEdit,
          canDelete: permissionType === 'Delete' ? shouldEnable : currentRolePerm.canDelete,
        });
      }
    });
    
    // Update rolePermissions state for all affected permissions
    if (permissionsToUpdate.length > 0) {
      setRolePermissions(prev => {
        const updated = [...prev];
        permissionsToUpdate.forEach(permData => {
          const existingIndex = updated.findIndex(rp => rp.permissionId === permData.permissionId);
          if (existingIndex >= 0) {
            updated[existingIndex] = { ...updated[existingIndex], ...permData };
          } else {
            updated.push({ permissionId: permData.permissionId, ...permData });
          }
        });
        return updated;
      });
    }
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

  // Save all permissions in batch
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      
      // Collect all permissions from the matrix
      const allPermissions = [];
      Object.entries(permissionMatrix).forEach(([moduleKey, subModules]) => {
        Object.entries(subModules).forEach(([subModuleKey, subModuleData]) => {
          ['View', 'Create', 'Edit', 'Delete'].forEach(permissionType => {
            const permissionInfo = subModuleData.permissions[permissionType];
            if (permissionInfo) {
              const isEnabled = subModuleData.userCan[permissionType];
              allPermissions.push({
                roleId: selectedRole.roleId,
                permissionId: permissionInfo.permissionId,
                canView: permissionType === 'View' ? isEnabled : false,
                canCreate: permissionType === 'Create' ? isEnabled : false,
                canEdit: permissionType === 'Edit' ? isEnabled : false,
                canDelete: permissionType === 'Delete' ? isEnabled : false,
              });
            }
          });
        });
      });

      console.log('Saving all permissions:', allPermissions);
      await assignPermissionToRole(allPermissions);
      toast.success('All permissions saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving all permissions:', error);
      toast.error(`Failed to save permissions: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col relative">
        {(loading || saving) && <LoadingOverlay isLoading={true} />}
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Assign Permissions</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage permissions for role: {selectedRole?.roleName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
              {/* Show skeleton while loading */}
              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg">
                      <div className="bg-slate-50 px-4 py-3 border-b">
                        <div className="h-6 bg-slate-200 rounded animate-pulse w-48"></div>
                      </div>
                      <div className="p-4">
                        <div className="bg-slate-100 rounded-lg p-4">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-32 mb-3"></div>
                          <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(j => (
                              <div key={j} className="h-12 bg-slate-200 rounded animate-pulse"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Enhanced Permission Matrix */}
              {!loading && Object.entries(permissionMatrix).map(([moduleName, subModules]) => (
                <div key={moduleName} className="border rounded-lg">
                  {/* Module Header with Master Toggle */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{moduleName}</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable All</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isModuleEnabled(moduleName)}
                          onChange={(e) => handleModuleToggle(moduleName, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          isModuleEnabled(moduleName) ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                            isModuleEnabled(moduleName) ? 'translate-x-5' : 'translate-x-0.5'
                          } mt-0.5`}></div>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  {/* SubModules */}
                  <div className="p-4 space-y-4">
                    {Object.entries(subModules).map(([subModuleName, subModuleData]) => (
                      <div key={subModuleName} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                        {/* SubModule Header with Toggle */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-800 dark:text-slate-200">{subModuleName}</h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Enable</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={isSubModuleEnabled(moduleName, subModuleName)}
                                onChange={(e) => handleSubModuleToggle(moduleName, subModuleName, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`w-10 h-5 rounded-full transition-colors ${
                                isSubModuleEnabled(moduleName, subModuleName) ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                                  isSubModuleEnabled(moduleName, subModuleName) ? 'translate-x-5' : 'translate-x-0.5'
                                } mt-0.5`}></div>
                              </div>
                            </div>
                          </label>
                        </div>
                        
                        {/* Permission Type Toggles */}
                        <div className="grid grid-cols-4 gap-3">
                          {['View', 'Create', 'Edit', 'Delete'].map(permissionType => {
                            const canAssign = subModuleData.adminCan[permissionType];
                            const isEnabled = subModuleData.userCan[permissionType];
                            const colors = {
                              View: 'blue', Create: 'green', Edit: 'yellow', Delete: 'red'
                            };
                            const color = colors[permissionType];
                            
                            return (
                              <div key={permissionType} className={`p-3 rounded-lg border-2 transition-all ${
                                !canAssign ? 'bg-gray-100 border-gray-200 opacity-50' : 
                                isEnabled ? `bg-${color}-50 border-${color}-200 dark:bg-${color}-900/20 dark:border-${color}-700` : 'bg-white dark:bg-slate-600 border-gray-200 dark:border-slate-500 hover:border-gray-300'
                              }`}>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    disabled={!canAssign}
                                    onChange={(e) => handlePermissionToggle(moduleName, subModuleName, permissionType, e.target.checked)}
                                    className={`rounded ${!canAssign ? 'opacity-50' : ''}`}
                                  />
                                  <span className={`text-sm font-medium ${
                                    !canAssign ? 'text-gray-400' : 
                                    isEnabled ? `text-${color}-700 dark:text-${color}-300` : 'text-gray-600 dark:text-gray-300'
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
                </div>
              )}
          </div>
        </div>
        
        {/* Footer with Save Button */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-600 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || loading}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save All Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionAssignment;