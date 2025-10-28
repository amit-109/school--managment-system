import React from 'react';
import { useSelector } from 'react-redux';
import { hasSubModuleAccess, getPermissionsBySubModule } from '../../utils/permissions';

const PermissionButton = ({ 
  moduleName, 
  subModuleName, 
  action, 
  children, 
  className = '', 
  onClick,
  ...props 
}) => {
  const { permissions } = useSelector((state) => state.auth);

  // Check if user has access to the submodule
  if (!hasSubModuleAccess(permissions, moduleName, subModuleName)) {
    return null;
  }

  // Get permissions for the specific submodule
  const subModulePermissions = getPermissionsBySubModule(permissions, moduleName, subModuleName);
  if (!subModulePermissions || subModulePermissions.length === 0) {
    return null;
  }

  // Check if user has the required permission
  const hasRequiredPermission = subModulePermissions.some(p => {
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

  if (!hasRequiredPermission) {
    return null;
  }

  return (
    <button
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default PermissionButton;