// Permission utility functions
export const hasPermission = (permissions, moduleId, subModuleId, action) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  
  const module = permissions.find(m => m.moduleId === moduleId);
  if (!module) return false;
  
  const subModule = module.subModules.find(sm => sm.subModuleId === subModuleId);
  if (!subModule) return false;
  
  const permission = subModule.permissions.find(p => p.permissionKey.includes(action));
  if (!permission) return false;
  
  // Check specific permission flags
  switch (action.toLowerCase()) {
    case 'view':
      return permission.canView;
    case 'create':
      return permission.canCreate;
    case 'edit':
      return permission.canEdit;
    case 'delete':
      return permission.canDelete;
    default:
      return false;
  }
};

export const hasModuleAccess = (permissions, moduleName) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(module => module.moduleName === moduleName);
};

export const hasSubModuleAccess = (permissions, moduleName, subModuleName) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  
  const module = permissions.find(m => m.moduleName === moduleName);
  if (!module) return false;
  
  return module.subModules.some(sm => sm.subModuleName === subModuleName);
};

export const getPermissionsBySubModule = (permissions, moduleName, subModuleName) => {
  if (!permissions || !Array.isArray(permissions)) return null;
  
  const module = permissions.find(m => m.moduleName === moduleName);
  if (!module) return null;
  
  const subModule = module.subModules.find(sm => sm.subModuleName === subModuleName);
  if (!subModule) return null;
  
  return subModule.permissions;
};

// Helper to check if user can perform any CRUD operation on a submodule
export const canAccessSubModule = (permissions, moduleName, subModuleName) => {
  const subModulePermissions = getPermissionsBySubModule(permissions, moduleName, subModuleName);
  if (!subModulePermissions || subModulePermissions.length === 0) return false;
  
  // Check if user has at least view permission
  return subModulePermissions.some(p => p.canView);
};

// Get all accessible modules for the user
export const getAccessibleModules = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return [];
  
  return permissions.filter(module => 
    module.subModules.some(subModule => 
      subModule.permissions.some(p => p.canView)
    )
  );
};

// Check if user can perform specific action on a route
export const canPerformAction = (permissions, routePath, action) => {
  if (!permissions || !Array.isArray(permissions)) return false;
  
  // Find permission by route path
  for (const module of permissions) {
    for (const subModule of module.subModules) {
      if (subModule.routePath === routePath) {
        return subModule.permissions.some(p => {
          switch (action.toLowerCase()) {
            case 'view':
              return p.canView;
            case 'create':
              return p.canCreate;
            case 'edit':
              return p.canEdit;
            case 'delete':
              return p.canDelete;
            default:
              return false;
          }
        });
      }
    }
  }
  
  return false;
};