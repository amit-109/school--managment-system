import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  User,
  UserCreateData,
  UserUpdateData,
  PageableResponse,
  DashboardStats,
  SubscriptionDetails,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserSubscription,
  updateUserSubscription,
  getAllSubscriptions,
  getDashboardStats,
  getDashboardOverview,
  getUserPermissions,
  updateUserPermissions,
  getAllPermissions,
} from './adminService';

// Define admin state interface
interface AdminState {
  users: User[];
  currentUser: User | null;
  subscriptions: SubscriptionDetails[];
  dashboardStats: DashboardStats | null;
  permissions: string[];
  userPermissions: Record<number, string[]>;

  // Loading states
  loading: boolean;
  usersLoading: boolean;
  userLoading: boolean;
  creatingUser: boolean;
  updatingUser: boolean;
  deletingUser: boolean;
  subscriptionsLoading: boolean;
  dashboardLoading: boolean;
  permissionsLoading: boolean;

  // Pagination
  usersPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  subscriptionsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };

  // Errors
  error: string | null;
  searchTerm: string;
  selectedUser: User | null;
}

// Initial state
const initialState: AdminState = {
  users: [],
  currentUser: null,
  subscriptions: [],
  dashboardStats: null,
  permissions: [],
  userPermissions: {},

  loading: false,
  usersLoading: false,
  userLoading: false,
  creatingUser: false,
  updatingUser: false,
  deletingUser: false,
  subscriptionsLoading: false,
  dashboardLoading: false,
  permissionsLoading: false,

  usersPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  subscriptionsPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },

  error: null,
  searchTerm: '',
  selectedUser: null,
};

// Async thunks
export const fetchUsersAsync = createAsyncThunk(
  'admin/fetchUsers',
  async ({ page = 0, size = 10, search }: { page?: number; size?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await getUsers(page, size, search);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserByIdAsync = createAsyncThunk(
  'admin/fetchUserById',
  async (userId: number, { rejectWithValue }) => {
    try {
      const user = await getUserById(userId);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUserAsync = createAsyncThunk(
  'admin/createUser',
  async (userData: UserCreateData, { rejectWithValue }) => {
    try {
      const user = await createUser(userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserAsync = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }: { userId: number; userData: UserUpdateData }, { rejectWithValue }) => {
    try {
      const user = await updateUser(userId, userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUserAsync = createAsyncThunk(
  'admin/deleteUser',
  async (userId: number, { rejectWithValue }) => {
    try {
      await deleteUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleUserStatusAsync = createAsyncThunk(
  'admin/toggleUserStatus',
  async ({ userId, isActive }: { userId: number; isActive: boolean }, { rejectWithValue }) => {
    try {
      const user = await toggleUserStatus(userId, isActive);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserSubscriptionAsync = createAsyncThunk(
  'admin/fetchUserSubscription',
  async (userId: number, { rejectWithValue }) => {
    try {
      const subscription = await getUserSubscription(userId);
      return { userId, subscription };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserSubscriptionAsync = createAsyncThunk(
  'admin/updateUserSubscription',
  async ({ userId, subscriptionData }: { userId: number; subscriptionData: Partial<SubscriptionDetails> }, { rejectWithValue }) => {
    try {
      const subscription = await updateUserSubscription(userId, subscriptionData);
      return { userId, subscription };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllSubscriptionsAsync = createAsyncThunk(
  'admin/fetchAllSubscriptions',
  async ({ page = 0, size = 10, status }: { page?: number; size?: number; status?: string }, { rejectWithValue }) => {
    try {
      const response = await getAllSubscriptions(page, size, status);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardStatsAsync = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await getDashboardStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardOverviewAsync = createAsyncThunk(
  'admin/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const overview = await getDashboardOverview();
      return overview;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserPermissionsAsync = createAsyncThunk(
  'admin/fetchUserPermissions',
  async (userId: number, { rejectWithValue }) => {
    try {
      const permissions = await getUserPermissions(userId);
      return { userId, permissions };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPermissionsAsync = createAsyncThunk(
  'admin/updateUserPermissions',
  async ({ userId, permissions }: { userId: number; permissions: string[] }, { rejectWithValue }) => {
    try {
      const updatedPermissions = await updateUserPermissions(userId, permissions);
      return { userId, permissions: updatedPermissions };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllPermissionsAsync = createAsyncThunk(
  'admin/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const permissions = await getAllPermissions();
      return permissions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUserState: (state) => {
      state.currentUser = null;
      state.selectedUser = null;
      state.userPermissions = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsersAsync.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersAsync.fulfilled, (state, action: PayloadAction<PageableResponse<User>>) => {
        state.usersLoading = false;
        state.users = action.payload.content;
        state.usersPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchUsersAsync.rejected, (state, action: PayloadAction<any>) => {
        state.usersLoading = false;
        state.error = action.payload;
      });

    // Fetch User by ID
    builder
      .addCase(fetchUserByIdAsync.pending, (state) => {
        state.userLoading = true;
        state.error = null;
      })
      .addCase(fetchUserByIdAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.userLoading = false;
        state.currentUser = action.payload;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.userLoading = false;
        state.error = action.payload;
      });

    // Create User
    builder
      .addCase(createUserAsync.pending, (state) => {
        state.creatingUser = true;
        state.error = null;
      })
      .addCase(createUserAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.creatingUser = false;
        state.users.push(action.payload);
        state.usersPagination.totalElements += 1;
      })
      .addCase(createUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingUser = false;
        state.error = action.payload;
      });

    // Update User
    builder
      .addCase(updateUserAsync.pending, (state) => {
        state.updatingUser = true;
        state.error = null;
      })
      .addCase(updateUserAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.updatingUser = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingUser = false;
        state.error = action.payload;
      });

    // Delete User
    builder
      .addCase(deleteUserAsync.pending, (state) => {
        state.deletingUser = true;
        state.error = null;
      })
      .addCase(deleteUserAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingUser = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.usersPagination.totalElements -= 1;
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingUser = false;
        state.error = action.payload;
      });

    // Toggle User Status
    builder
      .addCase(toggleUserStatusAsync.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      });

    // Subscriptions
    builder
      .addCase(fetchUserSubscriptionAsync.fulfilled, (state, action: PayloadAction<{ userId: number; subscription: SubscriptionDetails }>) => {
        // Handle user subscription data
        console.log('User subscription:', action.payload);
      })
      .addCase(fetchAllSubscriptionsAsync.pending, (state) => {
        state.subscriptionsLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSubscriptionsAsync.fulfilled, (state, action: PayloadAction<PageableResponse<SubscriptionDetails>>) => {
        state.subscriptionsLoading = false;
        state.subscriptions = action.payload.content;
        state.subscriptionsPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAllSubscriptionsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.subscriptionsLoading = false;
        state.error = action.payload;
      });

    // Dashboard
    builder
      .addCase(fetchDashboardStatsAsync.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStatsAsync.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStatsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      });

    // Permissions
    builder
      .addCase(fetchUserPermissionsAsync.fulfilled, (state, action: PayloadAction<{ userId: number; permissions: string[] }>) => {
        state.userPermissions[action.payload.userId] = action.payload.permissions;
      })
      .addCase(fetchAllPermissionsAsync.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.permissions = action.payload;
      });
  },
});

export const { setSelectedUser, setSearchTerm, clearError, resetUserState } = adminSlice.actions;

// Export the slice itself for the root store
export { adminSlice };

// Export types
export type AdminRootState = ReturnType<typeof adminSlice.reducer>;

// Configure the store (keep for backward compatibility)
export const adminStore = configureStore({
  reducer: adminSlice.reducer,
});
