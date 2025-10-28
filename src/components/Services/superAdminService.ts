import apiClient from '../Auth/base';

// Type Definitions
export interface Module {
  moduleId: number;
  moduleName: string;
  description: string;
  icon?: string;
  routePath?: string;
  orderNo?: number;
  isActive: boolean;
  createdOn: string;
  assignedRoleIds: number[];
}

export interface Role {
  roleId: number;
  roleName: string;
  description?: string;
  permissions?: string[];
  isSystemRole?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tenant {
  tenantId: number;
  tenantName: string;
  domain: string;
  contactEmail: string;
  contactPhone?: string;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial';
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalTenants: number;
  activeTenants: number;
  totalModules: number;
  systemUptime: number;
  apiRequestCount: number;
  errorRate: number;
  revenueData: {
    totalRevenue: number;
    monthlyRevenue: number[];
    subscriptionBreakdown: Record<string, number>;
  };
}

export interface SystemLog {
  logId: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  userId?: number;
  tenantId?: number;
  timestamp: string;
  metadata?: any;
}

export interface ModuleCreateData {
  moduleName: string;
  description: string;
  icon: string;
  routePath: string;
  orderNo: number;
  assignedRoleIds: number[];
}

export interface ModuleUpdateData {
  moduleName: string;
  description: string;
  icon: string;
  routePath: string;
  orderNo: number;
  isActive: boolean;
  assignedRoleIds: number[];
}

export interface RoleCreateData {
  roleName: string;
}

export interface RoleUpdateData {
  roleName?: string;
  description?: string;
  permissions?: string[];
}

export interface RolePermission {
  roleId: number;
  roleName: string;
}

export interface Permission {
  permissionId: number;
  permissionKey: string;
  permissionName: string;
  moduleId: number;
  subModuleId: number | null;
  moduleName: string;
  description: string;
  isActive: boolean;
  createdOn: string;
}

export interface RolePermissionDetail {
  permissionId: number;
  permissionName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface PermissionAssignment {
  roleId: number;
  permissionId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface TenantCreateData {
  tenantName: string;
  domain: string;
  contactEmail: string;
  contactPhone?: string;
  subscriptionPlan: string;
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'trial';
}

export interface TenantUpdateData {
  tenantName?: string;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'trial';
}

export interface SubscriptionPlan {
  planId: number;
  planName: string;
  description: string;
  price: number;
  billingCycle: string;
  customMonths: number;
  isActive: boolean;
}

export interface SubscriptionPlanCreateData {
  planId?: number;
  planName: string;
  description: string;
  price: number;
  billingCycle: string;
  customMonths?: number;
  isActive?: boolean;
}

export interface SubscriptionPlanUpdateData {
  planName?: string;
  description?: string;
  price?: number;
  billingCycle?: string;
  customMonths?: number;
  isActive?: boolean;
}

export interface SubModule {
  subModuleId: number;
  moduleId: number;
  subModuleName: string;
  description: string;
  routePath: string;
  orderNo: number;
  isActive: boolean;
  createdOn: string;
  assignedRoleIds: number[];
}

export interface SubModuleCreateData {
  moduleId: number;
  subModuleName: string;
  description: string;
  routePath: string;
  orderNo: number;
  assignedRoleIds: number[];
}

export interface SubModuleUpdateData {
  subModuleId: number;
  moduleId: number;
  subModuleName: string;
  description: string;
  routePath: string;
  orderNo: number;
  isActive: boolean;
  createdOn: string;
  assignedRoleIds: number[];
}

export interface PageableResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Module Management APIs
export const getModules = async (page = 0, size = 10, search?: string): Promise<PageableResponse<Module>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append('search', search);

  const response = await apiClient.get<ApiResponse<Module[]>>(`/superadmin/modules?${params}`);
  const data = response.data.data;
  
  // API returns direct array, wrap in pageable format
  return {
    content: data,
    totalElements: data.length,
    totalPages: Math.ceil(data.length / size),
    size: size,
    number: page,
    first: page === 0,
    last: page >= Math.ceil(data.length / size) - 1,
  };
};

export const getModuleById = async (moduleId: number): Promise<Module> => {
  const response = await apiClient.get<ApiResponse<Module>>(`/SuperAdmin/modules/${moduleId}`);
  return response.data.data;
};

export const createModule = async (moduleData: ModuleCreateData): Promise<Module> => {
  const response = await apiClient.post<ApiResponse<Module>>('/superadmin/modules', moduleData);
  return response.data.data;
};

export const updateModule = async (moduleId: number, moduleData: ModuleUpdateData): Promise<Module> => {
  const response = await apiClient.put<ApiResponse<Module>>(`/SuperAdmin/modules/${moduleId}`, moduleData);
  return response.data.data;
};

export const deleteModule = async (moduleId: number): Promise<void> => {
  await apiClient.delete(`/SuperAdmin/modules/${moduleId}`);
};

export const toggleModuleStatus = async (moduleId: number, isEnabled: boolean): Promise<Module> => {
  const response = await apiClient.patch<ApiResponse<Module>>(`/SuperAdmin/modules/${moduleId}/status`, { isEnabled });
  return response.data.data;
};

// Role Management APIs
export const getRoles = async (page = 0, size = 10, search?: string): Promise<PageableResponse<Role>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append('search', search);

  const response = await apiClient.get<ApiResponse<any>>(`/superadmin/roles?${params}`);
  // Handle both paginated and direct array responses
  const data = response.data.data;
  console.log('getRoles API response:', data);

  if (Array.isArray(data)) {
    // Direct array response - wrap in pageable format
    console.log('Converting array response to pageable:', data);
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      size: data.length,
      number: 0,
      first: true,
      last: true,
    };
  } else {
    // Already paginated response
    console.log('Using paginated response:', data);
    return data;
  }
};

export const getRoleById = async (roleId: number): Promise<Role> => {
  const response = await apiClient.get<ApiResponse<Role>>(`/SuperAdmin/roles/${roleId}`);
  return response.data.data;
};

export const createRole = async (roleData: RoleCreateData): Promise<Role> => {
  const response = await apiClient.post<ApiResponse<Role>>('/SuperAdmin/roles', roleData);
  return response.data.data;
};

export const updateRole = async (roleId: number, roleData: RoleUpdateData): Promise<Role> => {
  const response = await apiClient.put<ApiResponse<Role>>(`/SuperAdmin/roles/${roleId}`, roleData);
  return response.data.data;
};

export const deleteRole = async (roleId: number): Promise<void> => {
  await apiClient.delete(`/SuperAdmin/roles/${roleId}`);
};

export const assignRoleToUsers = async (roleId: number, userIds: number[]): Promise<void> => {
  await apiClient.post(`/SuperAdmin/roles/${roleId}/assign`, { userIds });
};

export const revokeRoleFromUsers = async (roleId: number, userIds: number[]): Promise<void> => {
  await apiClient.post(`/SuperAdmin/roles/${roleId}/revoke`, { userIds });
};

// Tenant Management APIs
export const getTenants = async (page = 0, size = 10, search?: string, status?: string): Promise<PageableResponse<Tenant>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const response = await apiClient.get<ApiResponse<PageableResponse<Tenant>>>(`/superadmin/tenants?${params}`);
  return response.data.data;
};

export const getTenantById = async (tenantId: number): Promise<Tenant> => {
  const response = await apiClient.get<ApiResponse<Tenant>>(`/superadmin/tenants/${tenantId}`);
  return response.data.data;
};

export const createTenant = async (tenantData: TenantCreateData): Promise<Tenant> => {
  const response = await apiClient.post<ApiResponse<Tenant>>('/superadmin/tenants', tenantData);
  return response.data.data;
};

export const updateTenant = async (tenantId: number, tenantData: TenantUpdateData): Promise<Tenant> => {
  const response = await apiClient.put<ApiResponse<Tenant>>(`/superadmin/tenants/${tenantId}`, tenantData);
  return response.data.data;
};

export const deleteTenant = async (tenantId: number): Promise<void> => {
  await apiClient.delete(`/superadmin/tenants/${tenantId}`);
};

export const suspendTenant = async (tenantId: number, reason?: string): Promise<Tenant> => {
  const response = await apiClient.patch<ApiResponse<Tenant>>(`/superadmin/tenants/${tenantId}/suspend`, { reason });
  return response.data.data;
};

export const reactivateTenant = async (tenantId: number): Promise<Tenant> => {
  const response = await apiClient.patch<ApiResponse<Tenant>>(`/superadmin/tenants/${tenantId}/reactivate`);
  return response.data.data;
};

// Analytics & Dashboard APIs
export const getAnalyticsData = async (period = 'month'): Promise<AnalyticsData> => {
  const response = await apiClient.get<ApiResponse<AnalyticsData>>(`/SuperAdmin/analytics?period=${period}`);
  return response.data.data;
};

export const getSystemLogs = async (page = 0, size = 10, level?: string, source?: string): Promise<PageableResponse<SystemLog>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (level) params.append('level', level);
  if (source) params.append('source', source);

  const response = await apiClient.get<ApiResponse<PageableResponse<SystemLog>>>(`/SuperAdmin/logs?${params}`);
  return response.data.data;
};

export const getSystemHealth = async (): Promise<any> => {
  const response = await apiClient.get<ApiResponse<any>>('/SuperAdmin/health');
  return response.data.data;
};

// Permission Management APIs
export const getAllSystemPermissions = async (): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>('/SuperAdmin/permissions/system');
  return response.data.data;
};

export const createPermission = async (permission: string, description?: string): Promise<{ message: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/SuperAdmin/permissions', { permission, description });
  return response.data.data;
};

export const deletePermission = async (permission: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/SuperAdmin/permissions/${encodeURIComponent(permission)}`);
  return response.data.data;
};

// System Configuration APIs
export const getSystemConfig = async (): Promise<any> => {
  const response = await apiClient.get<ApiResponse<any>>('/SuperAdmin/config');
  return response.data.data;
};

export const updateSystemConfig = async (config: any): Promise<any> => {
  const response = await apiClient.put<ApiResponse<any>>('/SuperAdmin/config', config);
  return response.data.data;
};

export const backupSystem = async (): Promise<{ backupId: string; downloadUrl: string }> => {
  const response = await apiClient.post<ApiResponse<{ backupId: string; downloadUrl: string }>>('/SuperAdmin/backup');
  return response.data.data;
};

export const restoreSystem = async (backupId: string): Promise<void> => {
  await apiClient.post(`/SuperAdmin/restore/${backupId}`);
};

// Subscription Plans APIs
export const getSubscriptionPlans = async (page = 0, size = 10): Promise<PageableResponse<SubscriptionPlan>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>(`/superadmin/subscription/plans?${params}`);
  const data = response.data.data;

  // API returns direct array, wrap in pageable format
  return {
    content: data,
    totalElements: data.length,
    totalPages: Math.ceil(data.length / size),
    size: size,
    number: page,
    first: page === 0,
    last: page >= Math.ceil(data.length / size) - 1,
  };
};

export const getSubscriptionPlanById = async (planId: number): Promise<SubscriptionPlan> => {
  const response = await apiClient.get<ApiResponse<SubscriptionPlan>>(`/superadmin/subscription/plans/${planId}`);
  return response.data.data;
};

export const createSubscriptionPlan = async (planData: SubscriptionPlanCreateData): Promise<SubscriptionPlan> => {
  const response = await apiClient.post<ApiResponse<SubscriptionPlan>>('/superadmin/subscription/plans', planData);
  return response.data.data;
};

export const updateSubscriptionPlan = async (planId: number, planData: SubscriptionPlanUpdateData): Promise<SubscriptionPlan> => {
  const response = await apiClient.patch<ApiResponse<SubscriptionPlan>>(`/superadmin/subscription/plans/${planId}`, planData);
  return response.data.data;
};

export const deleteSubscriptionPlan = async (planId: number): Promise<void> => {
  await apiClient.delete(`/superadmin/subscription/plans/${planId}`);
};

// Export role scope types
export type { TenantAdmin, RoleScopeRole, RolePermission, PermissionAssignment, Permission, RolePermissionDetail };

// SubModule Management APIs
export const getSubModules = async (page = 0, size = 10, moduleId: number): Promise<PageableResponse<SubModule>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const endpoint = `/superadmin/modules/${moduleId}/submodules?${params}`;
    
  const response = await apiClient.get<ApiResponse<SubModule[]>>(endpoint);
  const data = response.data.data;
  
  // API returns direct array, wrap in pageable format
  return {
    content: data,
    totalElements: data.length,
    totalPages: Math.ceil(data.length / size),
    size: size,
    number: page,
    first: page === 0,
    last: page >= Math.ceil(data.length / size) - 1,
  };
};

export const createSubModule = async (subModuleData: SubModuleCreateData): Promise<SubModule> => {
  try {
    // Ensure proper data format for API
    // Ensure route path starts with /
    let routePath = subModuleData.routePath;
    if (routePath && !routePath.startsWith('/')) {
      routePath = '/' + routePath;
    }
    
    const payload = {
      moduleId: subModuleData.moduleId,
      subModuleName: subModuleData.subModuleName,
      description: subModuleData.description,
      routePath: routePath,
      orderNo: subModuleData.orderNo,
      assignedRoleIds: subModuleData.assignedRoleIds || []
    };
    
    console.log('API: Creating SubModule with payload:', payload);
    const response = await apiClient.post<ApiResponse<SubModule>>('/superadmin/modules/submodules', payload);
    console.log('API: SubModule creation response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('API: SubModule creation failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const updateSubModule = async (subModuleId: number, subModuleData: SubModuleUpdateData): Promise<SubModule> => {
  try {
    // Ensure route path starts with /
    let routePath = subModuleData.routePath;
    if (routePath && !routePath.startsWith('/')) {
      routePath = '/' + routePath;
    }
    
    const payload = {
      subModuleId: subModuleId,
      moduleId: subModuleData.moduleId,
      subModuleName: subModuleData.subModuleName,
      description: subModuleData.description,
      routePath: routePath,
      orderNo: subModuleData.orderNo,
      isActive: subModuleData.isActive,
      createdOn: subModuleData.createdOn,
      assignedRoleIds: subModuleData.assignedRoleIds || []
    };
    
    console.log('API: Updating SubModule with payload:', { subModuleId, payload });
    const response = await apiClient.put<ApiResponse<SubModule>>(`/superadmin/modules/submodules/${subModuleId}`, payload);
    console.log('API: SubModule update response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('API: SubModule update failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const deleteSubModule = async (subModuleId: number): Promise<void> => {
  await apiClient.delete(`/superadmin/modules/submodules/${subModuleId}`);
};

// Role Scope Management APIs
export interface TenantAdmin {
  adminUserId: number;
  adminName: string;
  organizationName: string;
  roleName: string;
  email: string;
  username: string;
}

export interface RoleScopeRole {
  roleId: number;
  roleName: string;
}

export const getTenantAdmins = async (): Promise<TenantAdmin[]> => {
  const response = await apiClient.get<ApiResponse<TenantAdmin[]>>('/superadmin/role-scope/tenant-admins');
  return response.data.data;
};

export const getAdminRoleScope = async (adminUserId: number): Promise<RoleScopeRole[]> => {
  const response = await apiClient.get<ApiResponse<RoleScopeRole[]>>(`/superadmin/role-scope/${adminUserId}`);
  return response.data.data;
};

export const updateAdminRoleScope = async (adminUserId: number, roleIds: number[]): Promise<void> => {
  await apiClient.post(`/superadmin/role-scope/${adminUserId}`, roleIds);
};

export const getRolePermissions = async (roleId: number): Promise<RolePermission[]> => {
  const response = await apiClient.get<ApiResponse<RolePermission[]>>(`/superadmin/roles/${roleId}/permissions`);
  return response.data.data;
};

export const getAllPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get<ApiResponse<Permission[]>>('/superadmin/roles/GetAllPermissions');
  return response.data.data;
};

export const getRolePermissionDetails = async (roleId: number): Promise<RolePermissionDetail[]> => {
  const response = await apiClient.get<ApiResponse<RolePermissionDetail[]>>(`/superadmin/roles/${roleId}/permissions`);
  return response.data.data;
};

export const assignPermissionToRole = async (permissionData: PermissionAssignment): Promise<void> => {
  await apiClient.post('/superadmin/roles/assign-permission', permissionData);
};
