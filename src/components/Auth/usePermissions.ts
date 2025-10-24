import { useSelector } from 'react-redux';
import { hasPermission, type RootState } from './store';

export const usePermissions = () => {
  const permissions = useSelector((state: RootState) => state.auth.permissions);
  const state = useSelector((state: RootState) => state);

  const checkPermission = (permissionName: string): boolean => {
    return hasPermission(state, permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(permissionName => checkPermission(permissionName));
  };

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(permissionName => checkPermission(permissionName));
  };

  // Common permission patterns for UI elements
  const canRead = (moduleName: string): boolean => checkPermission(`${moduleName}.Read`);
  const canCreate = (moduleName: string): boolean => checkPermission(`${moduleName}.Create`);
  const canUpdate = (moduleName: string): boolean => checkPermission(`${moduleName}.Update`);
  const canDelete = (moduleName: string): boolean => checkPermission(`${moduleName}.Delete`);
  const canManage = (moduleName: string): boolean => checkPermission(`${moduleName}.Manage`);

  const canViewModule = (moduleName: string): boolean => {
    // Can view a module if they have any permission in it
    return hasAnyPermission([
      `${moduleName}.Read`,
      `${moduleName}.Create`,
      `${moduleName}.Update`,
      `${moduleName}.Delete`,
      `${moduleName}.Manage`
    ]);
  };

  return {
    permissions,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canManage,
    canViewModule,
  };
};
