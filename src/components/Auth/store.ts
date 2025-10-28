import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionPlan, RegisterData, LoginData, PermissionsData, getSubscriptionPlans, registerUser, loginUser, logoutUser } from './authService';
import TokenManager from './tokenManager';

// Define the state interface
interface AuthState {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  selectedPlan: number | null;
  registering: boolean;
  loggingIn: boolean;
  loggingOut: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  userRole: string | null;
  userRoles: string[];
  permissions: PermissionsData | null;
}

// Initial state
const initialState: AuthState = {
  plans: [],
  loading: false,
  error: null,
  selectedPlan: null,
  registering: false,
  loggingIn: false,
  loggingOut: false,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  userRole: null,
  userRoles: [],
  permissions: null,
};

// Async thunk for fetching subscription plans
export const fetchSubscriptionPlans = createAsyncThunk(
  'auth/fetchSubscriptionPlans',
  async (_, { rejectWithValue }) => {
    try {
      const plans = await getSubscriptionPlans();
      return plans;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for registering user
export const registerUserAsync = createAsyncThunk(
  'auth/registerUser',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const result = await registerUser(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logging in user
export const loginUserAsync = createAsyncThunk(
  'auth/loginUser',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      const result = await loginUser(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logging out user
export const logoutUserAsync = createAsyncThunk(
  'auth/logoutUser',
  async (refreshToken?: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const token = refreshToken || state.auth.refreshToken || TokenManager.getInstance().getRefreshToken();

      if (token) {
        const result = await logoutUser(token);
        // Clear TokenManager after successful API call
        TokenManager.getInstance().clearTokens();
        return result;
      } else {
        // No token available, just clear local state
        TokenManager.getInstance().clearTokens();
        return { message: 'Logged out locally' };
      }
    } catch (error: any) {
      // Even if API fails, clear local tokens
      TokenManager.getInstance().clearTokens();
      return rejectWithValue(error.message);
    }
  }
);

// Create the slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSelectedPlan: (state, action: PayloadAction<number>) => {
      state.selectedPlan = action.payload;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; isAuthenticated: boolean }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = action.payload.isAuthenticated;
    },
    clearTokens: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscriptionPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action: PayloadAction<SubscriptionPlan[]>) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUserAsync.pending, (state) => {
        state.registering = true;
        state.error = null;
      })
      .addCase(registerUserAsync.fulfilled, (state) => {
        state.registering = false;
      })
      .addCase(registerUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.registering = false;
        state.error = action.payload;
      })
      .addCase(loginUserAsync.pending, (state) => {
        state.loggingIn = true;
        state.error = null;
      })
      .addCase(loginUserAsync.fulfilled, (state, action: PayloadAction<any>) => {
        state.loggingIn = false;

        // Handle both direct response and nested data structure
        const responseData = action.payload?.data || action.payload;

        // Check for both old format (accessToken) and new format (access_token)
        const accessToken = responseData?.accessToken || responseData?.access_token;
        const refreshToken = responseData?.refreshToken || responseData?.refresh_token;

        if (accessToken && refreshToken) {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;

          // Extract permissions from response
          const permissions = responseData?.permissions;
          if (permissions && typeof permissions === 'object') {
            state.permissions = permissions;
          } else {
            state.permissions = null;
          }

          // Extract roles from response - check multiple possible locations
          let roles = responseData?.roles || responseData?.role || responseData?.userRoles;

          if (roles) {
            if (Array.isArray(roles)) {
              state.userRoles = roles;
              state.userRole = roles[0] || null; // Use first role as primary
            } else {
              state.userRoles = [roles];
              state.userRole = roles;
            }
          } else {
            state.userRole = 'Operator'; // Default role
            state.userRoles = ['Operator'];
          }
        } else {
          console.log('Login fulfilled - no valid token data:', responseData);
        }
      })
      .addCase(loginUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.loggingIn = false;
        state.error = action.payload;
      })
      .addCase(logoutUserAsync.pending, (state) => {
        state.loggingOut = true;
        state.error = null;
      })
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.loggingOut = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.userRole = null;
        state.userRoles = [];
        state.permissions = null;
        state.error = null;
      })
      .addCase(logoutUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.loggingOut = false;
        // Clear auth state even on rejection since tokens are cleared
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.userRole = null;
        state.userRoles = [];
        state.permissions = null;
        state.error = action.payload;
      });
  },
});

export const { setSelectedPlan, setTokens, clearTokens } = authSlice.actions;

// Export the reducer
export const authReducer = authSlice.reducer;

// Permission checking utility functions
export const hasPermission = (state: RootState, permissionName: string): boolean => {
  const { permissions } = state.auth;
  if (!permissions?.modules) return false;

  // Search through all modules, submodules, and permissions
  for (const module of permissions.modules) {
    for (const subModule of module.subModules) {
      const foundPermission = subModule.permissions.find(
        permission => permission.permissionName === permissionName
      );
      if (foundPermission) {
        return true;
      }
    }
  }
  return false;
};

export const getAccessibleModules = (state: RootState): { moduleName: string; displayName?: string }[] => {
  const { permissions } = state.auth;
  if (!permissions?.modules) return [];

  // Return modules the user has access to (based on having at least one permission in a submodule)
  return permissions.modules
    .filter(module =>
      module.subModules.some(subModule =>
        subModule.permissions.length > 0
      )
    )
    .map(module => ({
      moduleName: module.moduleName,
      displayName: module.displayName || module.moduleName
    }));
};

// Configure the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
