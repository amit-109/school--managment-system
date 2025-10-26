import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Module,
  Role,
  Tenant,
  AnalyticsData,
  SystemLog,
  SubscriptionPlan,
  SubscriptionPlanCreateData,
  SubscriptionPlanUpdateData,
  SubModule,
  SubModuleCreateData,
  SubModuleUpdateData,
  ModuleCreateData,
  ModuleUpdateData,
  RoleCreateData,
  RoleUpdateData,
  TenantCreateData,
  TenantUpdateData,
  PageableResponse,
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  toggleModuleStatus,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToUsers,
  revokeRoleFromUsers,
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  suspendTenant,
  reactivateTenant,
  getAnalyticsData,
  getSystemLogs,
  getSystemHealth,
  getAllSystemPermissions,
  createPermission,
  deletePermission,
  getSystemConfig,
  updateSystemConfig,
  backupSystem,
  restoreSystem,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubModules,
  createSubModule,
  updateSubModule,
  deleteSubModule,
} from './superAdminService';

// Define super admin state interface
interface SuperAdminState {
  modules: Module[];
  roles: Role[];
  tenants: Tenant[];
  subscriptionPlans: SubscriptionPlan[];
  subModules: SubModule[];
  currentModule: Module | null;
  currentRole: Role | null;
  currentTenant: Tenant | null;
  analyticsData: AnalyticsData | null;
  systemLogs: SystemLog[];
  systemHealth: any;
  systemConfig: any;
  systemPermissions: string[];
  subscriptionPlansLoading: boolean;
  subModulesLoading: boolean;
  creatingSubModule: boolean;
  updatingSubModule: boolean;
  deletingSubModule: boolean;

  // Loading states
  loading: boolean;
  modulesLoading: boolean;
  moduleLoading: boolean;
  creatingModule: boolean;
  updatingModule: boolean;
  deletingModule: boolean;
  rolesLoading: boolean;
  roleLoading: boolean;
  creatingRole: boolean;
  updatingRole: boolean;
  deletingRole: boolean;
  tenantsLoading: boolean;
  tenantLoading: boolean;
  creatingTenant: boolean;
  updatingTenant: boolean;
  deletingTenant: boolean;
  analyticsLoading: boolean;
  logsLoading: boolean;
  configLoading: boolean;
  permissionsLoading: boolean;

  // Pagination
  modulesPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  rolesPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  tenantsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  logsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };

  // Errors
  error: string | null;
  searchTerm: string;
  selectedModule: Module | null;
  selectedRole: Role | null;
  selectedTenant: Tenant | null;
  logFilters: {
    level?: string;
    source?: string;
  };
}

// Initial state
const initialState: SuperAdminState = {
  modules: [],
  roles: [],
  tenants: [],
  subscriptionPlans: [],
  subModules: [],
  currentModule: null,
  currentRole: null,
  currentTenant: null,
  analyticsData: null,
  systemLogs: [],
  systemHealth: null,
  systemConfig: null,
  systemPermissions: [],
  subscriptionPlansLoading: false,
  subModulesLoading: false,
  creatingSubModule: false,
  updatingSubModule: false,
  deletingSubModule: false,

  loading: false,
  modulesLoading: false,
  moduleLoading: false,
  creatingModule: false,
  updatingModule: false,
  deletingModule: false,
  rolesLoading: false,
  roleLoading: false,
  creatingRole: false,
  updatingRole: false,
  deletingRole: false,
  tenantsLoading: false,
  tenantLoading: false,
  creatingTenant: false,
  updatingTenant: false,
  deletingTenant: false,
  analyticsLoading: false,
  logsLoading: false,
  configLoading: false,
  permissionsLoading: false,

  modulesPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  rolesPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  tenantsPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  logsPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },

  error: null,
  searchTerm: '',
  selectedModule: null,
  selectedRole: null,
  selectedTenant: null,
  logFilters: {},
};

// Async thunks for Modules
export const fetchModulesAsync = createAsyncThunk(
  'superAdmin/fetchModules',
  async ({ page = 0, size = 10, search }: { page?: number; size?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await getModules(page, size, search);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchModuleByIdAsync = createAsyncThunk(
  'superAdmin/fetchModuleById',
  async (moduleId: number, { rejectWithValue }) => {
    try {
      const module = await getModuleById(moduleId);
      return module;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createModuleAsync = createAsyncThunk(
  'superAdmin/createModule',
  async (moduleData: ModuleCreateData, { rejectWithValue }) => {
    try {
      const module = await createModule(moduleData);
      return module;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateModuleAsync = createAsyncThunk(
  'superAdmin/updateModule',
  async ({ moduleId, moduleData }: { moduleId: number; moduleData: ModuleUpdateData }, { rejectWithValue }) => {
    try {
      const module = await updateModule(moduleId, moduleData);
      return module;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteModuleAsync = createAsyncThunk(
  'superAdmin/deleteModule',
  async (moduleId: number, { rejectWithValue }) => {
    try {
      await deleteModule(moduleId);
      return moduleId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleModuleStatusAsync = createAsyncThunk(
  'superAdmin/toggleModuleStatus',
  async ({ moduleId, isEnabled }: { moduleId: number; isEnabled: boolean }, { rejectWithValue }) => {
    try {
      const module = await toggleModuleStatus(moduleId, isEnabled);
      return module;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for Roles
export const fetchRolesAsync = createAsyncThunk(
  'superAdmin/fetchRoles',
  async ({ page = 0, size = 10, search }: { page?: number; size?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await getRoles(page, size, search);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRoleByIdAsync = createAsyncThunk(
  'superAdmin/fetchRoleById',
  async (roleId: number, { rejectWithValue }) => {
    try {
      const role = await getRoleById(roleId);
      return role;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createRoleAsync = createAsyncThunk(
  'superAdmin/createRole',
  async (roleData: RoleCreateData, { rejectWithValue }) => {
    try {
      const role = await createRole(roleData);
      return role;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRoleAsync = createAsyncThunk(
  'superAdmin/updateRole',
  async ({ roleId, roleData }: { roleId: number; roleData: RoleUpdateData }, { rejectWithValue }) => {
    try {
      const role = await updateRole(roleId, roleData);
      return role;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRoleAsync = createAsyncThunk(
  'superAdmin/deleteRole',
  async (roleId: number, { rejectWithValue }) => {
    try {
      await deleteRole(roleId);
      return roleId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignRoleToUsersAsync = createAsyncThunk(
  'superAdmin/assignRoleToUsers',
  async ({ roleId, userIds }: { roleId: number; userIds: number[] }, { rejectWithValue }) => {
    try {
      await assignRoleToUsers(roleId, userIds);
      return { roleId, userIds };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const revokeRoleFromUsersAsync = createAsyncThunk(
  'superAdmin/revokeRoleFromUsers',
  async ({ roleId, userIds }: { roleId: number; userIds: number[] }, { rejectWithValue }) => {
    try {
      await revokeRoleFromUsers(roleId, userIds);
      return { roleId, userIds };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for Tenants
export const fetchTenantsAsync = createAsyncThunk(
  'superAdmin/fetchTenants',
  async ({ page = 0, size = 10, search, status }: { page?: number; size?: number; search?: string; status?: string }, { rejectWithValue }) => {
    try {
      const response = await getTenants(page, size, search, status);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTenantByIdAsync = createAsyncThunk(
  'superAdmin/fetchTenantById',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      const tenant = await getTenantById(tenantId);
      return tenant;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTenantAsync = createAsyncThunk(
  'superAdmin/createTenant',
  async (tenantData: TenantCreateData, { rejectWithValue }) => {
    try {
      const tenant = await createTenant(tenantData);
      return tenant;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTenantAsync = createAsyncThunk(
  'superAdmin/updateTenant',
  async ({ tenantId, tenantData }: { tenantId: number; tenantData: TenantUpdateData }, { rejectWithValue }) => {
    try {
      const tenant = await updateTenant(tenantId, tenantData);
      return tenant;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTenantAsync = createAsyncThunk(
  'superAdmin/deleteTenant',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      await deleteTenant(tenantId);
      return tenantId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const suspendTenantAsync = createAsyncThunk(
  'superAdmin/suspendTenant',
  async ({ tenantId, reason }: { tenantId: number; reason?: string }, { rejectWithValue }) => {
    try {
      const tenant = await suspendTenant(tenantId, reason);
      return tenant;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const reactivateTenantAsync = createAsyncThunk(
  'superAdmin/reactivateTenant',
  async (tenantId: number, { rejectWithValue }) => {
    try {
      const tenant = await reactivateTenant(tenantId);
      return tenant;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for Analytics & System
export const fetchAnalyticsDataAsync = createAsyncThunk(
  'superAdmin/fetchAnalyticsData',
  async (period: string = 'month', { rejectWithValue }) => {
    try {
      const data = await getAnalyticsData(period);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSystemLogsAsync = createAsyncThunk(
  'superAdmin/fetchSystemLogs',
  async ({ page = 0, size = 10, level, source }: { page?: number; size?: number; level?: string; source?: string }, { rejectWithValue }) => {
    try {
      const response = await getSystemLogs(page, size, level, source);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSystemHealthAsync = createAsyncThunk(
  'superAdmin/fetchSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await getSystemHealth();
      return health;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSystemConfigAsync = createAsyncThunk(
  'superAdmin/fetchSystemConfig',
  async (_, { rejectWithValue }) => {
    try {
      const config = await getSystemConfig();
      return config;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSystemConfigAsync = createAsyncThunk(
  'superAdmin/updateSystemConfig',
  async (config: any, { rejectWithValue }) => {
    try {
      const updatedConfig = await updateSystemConfig(config);
      return updatedConfig;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const backupSystemAsync = createAsyncThunk(
  'superAdmin/backupSystem',
  async (_, { rejectWithValue }) => {
    try {
      const result = await backupSystem();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const restoreSystemAsync = createAsyncThunk(
  'superAdmin/restoreSystem',
  async (backupId: string, { rejectWithValue }) => {
    try {
      await restoreSystem(backupId);
      return backupId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for Permissions
export const fetchAllSystemPermissionsAsync = createAsyncThunk(
  'superAdmin/fetchAllSystemPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const permissions = await getAllSystemPermissions();
      return permissions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPermissionAsync = createAsyncThunk(
  'superAdmin/createPermission',
  async ({ permission, description }: { permission: string; description?: string }, { rejectWithValue }) => {
    try {
      const result = await createPermission(permission, description);
      return result.message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePermissionAsync = createAsyncThunk(
  'superAdmin/deletePermission',
  async (permission: string, { rejectWithValue }) => {
    try {
      const result = await deletePermission(permission);
      return result.message;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for Subscription Plans
export const fetchSubscriptionPlansAsync = createAsyncThunk(
  'superAdmin/fetchSubscriptionPlans',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getSubscriptionPlans(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSubscriptionPlanByIdAsync = createAsyncThunk(
  'superAdmin/fetchSubscriptionPlanById',
  async (planId: number, { rejectWithValue }) => {
    try {
      const plan = await getSubscriptionPlanById(planId);
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSubscriptionPlanAsync = createAsyncThunk(
  'superAdmin/createSubscriptionPlan',
  async (planData: SubscriptionPlanCreateData, { rejectWithValue }) => {
    try {
      const plan = await createSubscriptionPlan(planData);
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSubscriptionPlanAsync = createAsyncThunk(
  'superAdmin/updateSubscriptionPlan',
  async ({ planId, planData }: { planId: number; planData: SubscriptionPlanUpdateData }, { rejectWithValue }) => {
    try {
      const plan = await updateSubscriptionPlan(planId, planData);
      return plan;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSubscriptionPlanAsync = createAsyncThunk(
  'superAdmin/deleteSubscriptionPlan',
  async (planId: number, { rejectWithValue }) => {
    try {
      await deleteSubscriptionPlan(planId);
      return planId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for SubModules
export const fetchSubModulesAsync = createAsyncThunk(
  'superAdmin/fetchSubModules',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getSubModules(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSubModuleAsync = createAsyncThunk(
  'superAdmin/createSubModule',
  async (subModuleData: SubModuleCreateData, { rejectWithValue }) => {
    try {
      console.log('Creating SubModule with payload:', subModuleData);
      const subModule = await createSubModule(subModuleData);
      return subModule;
    } catch (error: any) {
      console.error('SubModule creation API error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create submodule';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateSubModuleAsync = createAsyncThunk(
  'superAdmin/updateSubModule',
  async ({ subModuleId, subModuleData }: { subModuleId: number; subModuleData: SubModuleUpdateData }, { rejectWithValue }) => {
    try {
      console.log('Updating SubModule with payload:', { subModuleId, subModuleData });
      const subModule = await updateSubModule(subModuleId, subModuleData);
      return subModule;
    } catch (error: any) {
      console.error('SubModule update API error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update submodule';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteSubModuleAsync = createAsyncThunk(
  'superAdmin/deleteSubModule',
  async (subModuleId: number, { rejectWithValue }) => {
    try {
      await deleteSubModule(subModuleId);
      return subModuleId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the slice
const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState,
  reducers: {
    setSelectedModule: (state, action: PayloadAction<Module | null>) => {
      state.selectedModule = action.payload;
    },
    setSelectedRole: (state, action: PayloadAction<Role | null>) => {
      state.selectedRole = action.payload;
    },
    setSelectedTenant: (state, action: PayloadAction<Tenant | null>) => {
      state.selectedTenant = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setLogFilters: (state, action: PayloadAction<{ level?: string; source?: string }>) => {
      state.logFilters = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSuperAdminState: (state) => {
      state.currentModule = null;
      state.currentRole = null;
      state.currentTenant = null;
      state.selectedModule = null;
      state.selectedRole = null;
      state.selectedTenant = null;
    },
  },
  extraReducers: (builder) => {
    // Modules
    builder
      .addCase(fetchModulesAsync.pending, (state) => {
        state.modulesLoading = true;
        state.error = null;
      })
      .addCase(fetchModulesAsync.fulfilled, (state, action: PayloadAction<PageableResponse<Module>>) => {
        state.modulesLoading = false;
        state.modules = action.payload.content;
        state.modulesPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchModulesAsync.rejected, (state, action: PayloadAction<any>) => {
        state.modulesLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchModuleByIdAsync.fulfilled, (state, action: PayloadAction<Module>) => {
        state.currentModule = action.payload;
        state.selectedModule = action.payload;
      })
      .addCase(createModuleAsync.pending, (state) => {
        state.creatingModule = true;
        state.error = null;
      })
      .addCase(createModuleAsync.fulfilled, (state, action: PayloadAction<Module>) => {
        state.creatingModule = false;
        state.modules.push(action.payload);
        state.modulesPagination.totalElements += 1;
      })
      .addCase(createModuleAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingModule = false;
        state.error = action.payload;
      })
      .addCase(updateModuleAsync.fulfilled, (state, action: PayloadAction<Module>) => {
        const index = state.modules.findIndex(module => module.moduleId === action.payload.moduleId);
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
        if (state.currentModule?.moduleId === action.payload.moduleId) {
          state.currentModule = action.payload;
        }
        if (state.selectedModule?.moduleId === action.payload.moduleId) {
          state.selectedModule = action.payload;
        }
      })
      .addCase(deleteModuleAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.modules = state.modules.filter(module => module.moduleId !== action.payload);
        state.modulesPagination.totalElements -= 1;
      })
      .addCase(toggleModuleStatusAsync.fulfilled, (state, action: PayloadAction<Module>) => {
        const index = state.modules.findIndex(module => module.moduleId === action.payload.moduleId);
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
      });

    // Roles
    builder
      .addCase(fetchRolesAsync.pending, (state) => {
        state.rolesLoading = true;
        state.error = null;
      })
      .addCase(fetchRolesAsync.fulfilled, (state, action: PayloadAction<PageableResponse<Role>>) => {
        state.rolesLoading = false;
        state.roles = action.payload.content;
        state.rolesPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchRolesAsync.rejected, (state, action: PayloadAction<any>) => {
        state.rolesLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchRoleByIdAsync.fulfilled, (state, action: PayloadAction<Role>) => {
        state.currentRole = action.payload;
        state.selectedRole = action.payload;
      })
      .addCase(createRoleAsync.pending, (state) => {
        state.creatingRole = true;
        state.error = null;
      })
      .addCase(createRoleAsync.fulfilled, (state, action: PayloadAction<Role>) => {
        state.creatingRole = false;
        state.roles.push(action.payload);
        state.rolesPagination.totalElements += 1;
      })
      .addCase(createRoleAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingRole = false;
        state.error = action.payload;
      })
      .addCase(updateRoleAsync.fulfilled, (state, action: PayloadAction<Role>) => {
        const index = state.roles.findIndex(role => role.roleId === action.payload.roleId);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        if (state.currentRole?.roleId === action.payload.roleId) {
          state.currentRole = action.payload;
        }
        if (state.selectedRole?.roleId === action.payload.roleId) {
          state.selectedRole = action.payload;
        }
      })
      .addCase(deleteRoleAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.roles = state.roles.filter(role => role.roleId !== action.payload);
        state.rolesPagination.totalElements -= 1;
      });

    // Tenants
    builder
      .addCase(fetchTenantsAsync.pending, (state) => {
        state.tenantsLoading = true;
        state.error = null;
      })
      .addCase(fetchTenantsAsync.fulfilled, (state, action: PayloadAction<PageableResponse<Tenant>>) => {
        state.tenantsLoading = false;
        state.tenants = action.payload.content;
        state.tenantsPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchTenantsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.tenantsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchTenantByIdAsync.fulfilled, (state, action: PayloadAction<Tenant>) => {
        state.currentTenant = action.payload;
        state.selectedTenant = action.payload;
      })
      .addCase(createTenantAsync.pending, (state) => {
        state.creatingTenant = true;
        state.error = null;
      })
      .addCase(createTenantAsync.fulfilled, (state, action: PayloadAction<Tenant>) => {
        state.creatingTenant = false;
        state.tenants.push(action.payload);
        state.tenantsPagination.totalElements += 1;
      })
      .addCase(createTenantAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingTenant = false;
        state.error = action.payload;
      })
      .addCase(updateTenantAsync.fulfilled, (state, action: PayloadAction<Tenant>) => {
        const index = state.tenants.findIndex(tenant => tenant.tenantId === action.payload.tenantId);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
        if (state.currentTenant?.tenantId === action.payload.tenantId) {
          state.currentTenant = action.payload;
        }
        if (state.selectedTenant?.tenantId === action.payload.tenantId) {
          state.selectedTenant = action.payload;
        }
      })
      .addCase(deleteTenantAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.tenants = state.tenants.filter(tenant => tenant.tenantId !== action.payload);
        state.tenantsPagination.totalElements -= 1;
      });

    // Analytics & System
    builder
      .addCase(fetchAnalyticsDataAsync.pending, (state) => {
        state.analyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsDataAsync.fulfilled, (state, action: PayloadAction<AnalyticsData>) => {
        state.analyticsLoading = false;
        state.analyticsData = action.payload;
      })
      .addCase(fetchAnalyticsDataAsync.rejected, (state, action: PayloadAction<any>) => {
        state.analyticsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSystemLogsAsync.pending, (state) => {
        state.logsLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemLogsAsync.fulfilled, (state, action: PayloadAction<PageableResponse<SystemLog>>) => {
        state.logsLoading = false;
        state.systemLogs = action.payload.content;
        state.logsPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchSystemLogsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.logsLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSystemHealthAsync.fulfilled, (state, action: PayloadAction<any>) => {
        state.systemHealth = action.payload;
      })
      .addCase(fetchSystemConfigAsync.fulfilled, (state, action: PayloadAction<any>) => {
        state.systemConfig = action.payload;
      })
      .addCase(updateSystemConfigAsync.fulfilled, (state, action: PayloadAction<any>) => {
        state.systemConfig = action.payload;
      })
      .addCase(fetchAllSystemPermissionsAsync.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.systemPermissions = action.payload;
      })
      .addCase(createPermissionAsync.fulfilled, (state, action: PayloadAction<string>) => {
        // Permission added successfully, can refresh permissions list if needed
        console.log('Permission created successfully:', action.payload);
      })
      .addCase(deletePermissionAsync.fulfilled, (state, action: PayloadAction<string>) => {
        // Permission deleted successfully, can refresh permissions list if needed
        console.log('Permission deleted successfully:', action.payload);
      })
      .addCase(fetchSubscriptionPlansAsync.pending, (state) => {
        state.subscriptionPlansLoading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlansAsync.fulfilled, (state, action: PayloadAction<PageableResponse<SubscriptionPlan>>) => {
        state.subscriptionPlansLoading = false;
        state.subscriptionPlans = action.payload.content;
      })
      .addCase(fetchSubscriptionPlansAsync.rejected, (state, action: PayloadAction<any>) => {
        state.subscriptionPlansLoading = false;
        state.error = action.payload;
      })
      .addCase(createSubscriptionPlanAsync.pending, (state) => {
        state.creatingTenant = true; // Reuse tenant loading state
        state.error = null;
      })
      .addCase(createSubscriptionPlanAsync.fulfilled, (state, action: PayloadAction<SubscriptionPlan>) => {
        state.creatingTenant = false;
        state.subscriptionPlans.push(action.payload);
      })
      .addCase(createSubscriptionPlanAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingTenant = false;
        state.error = action.payload;
      })
      .addCase(updateSubscriptionPlanAsync.pending, (state) => {
        state.updatingTenant = true; // Reuse tenant loading state
        state.error = null;
      })
      .addCase(updateSubscriptionPlanAsync.fulfilled, (state, action: PayloadAction<SubscriptionPlan>) => {
        state.updatingTenant = false;
        const index = state.subscriptionPlans.findIndex(plan => plan.planId === action.payload.planId);
        if (index !== -1) {
          state.subscriptionPlans[index] = action.payload;
        }
      })
      .addCase(updateSubscriptionPlanAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingTenant = false;
        state.error = action.payload;
      })
      .addCase(deleteSubscriptionPlanAsync.pending, (state) => {
        state.deletingTenant = true; // Reuse tenant loading state
        state.error = null;
      })
      .addCase(deleteSubscriptionPlanAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingTenant = false;
        state.subscriptionPlans = state.subscriptionPlans.filter(plan => plan.planId !== action.payload);
      })
      .addCase(deleteSubscriptionPlanAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingTenant = false;
        state.error = action.payload;
      })
      .addCase(fetchSubModulesAsync.pending, (state) => {
        state.subModulesLoading = true;
        state.error = null;
      })
      .addCase(fetchSubModulesAsync.fulfilled, (state, action: PayloadAction<PageableResponse<SubModule>>) => {
        state.subModulesLoading = false;
        state.subModules = action.payload.content;
      })
      .addCase(fetchSubModulesAsync.rejected, (state, action: PayloadAction<any>) => {
        state.subModulesLoading = false;
        state.error = action.payload;
      })
      .addCase(createSubModuleAsync.pending, (state) => {
        state.creatingSubModule = true;
        state.error = null;
      })
      .addCase(createSubModuleAsync.fulfilled, (state, action: PayloadAction<SubModule>) => {
        state.creatingSubModule = false;
        state.subModules.push(action.payload);
      })
      .addCase(createSubModuleAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingSubModule = false;
        state.error = action.payload;
      })
      .addCase(updateSubModuleAsync.pending, (state) => {
        state.updatingSubModule = true;
        state.error = null;
      })
      .addCase(updateSubModuleAsync.fulfilled, (state, action: PayloadAction<SubModule>) => {
        state.updatingSubModule = false;
        const index = state.subModules.findIndex(subModule => subModule.subModuleId === action.payload.subModuleId);
        if (index !== -1) {
          state.subModules[index] = action.payload;
        }
      })
      .addCase(updateSubModuleAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingSubModule = false;
        state.error = action.payload;
      })
      .addCase(deleteSubModuleAsync.pending, (state) => {
        state.deletingSubModule = true;
        state.error = null;
      })
      .addCase(deleteSubModuleAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingSubModule = false;
        state.subModules = state.subModules.filter(subModule => subModule.subModuleId !== action.payload);
      })
      .addCase(deleteSubModuleAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingSubModule = false;
        state.error = action.payload;
      })
  },
});

export const {
  setSelectedModule,
  setSelectedRole,
  setSelectedTenant,
  setSearchTerm,
  setLogFilters,
  clearError,
  resetSuperAdminState,
} = superAdminSlice.actions;

// Export the slice itself for the root store
export { superAdminSlice };

// Export types
export type SuperAdminRootState = ReturnType<typeof superAdminSlice.reducer>;

// Configure the store (keep for backward compatibility)
export const superAdminStore = configureStore({
  reducer: superAdminSlice.reducer,
});
