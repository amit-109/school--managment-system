import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionPlan, RegisterData, LoginData, getSubscriptionPlans, registerUser, loginUser, logoutUser } from './authService';
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
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const refreshToken = state.auth.refreshToken || TokenManager.getInstance().getRefreshToken();

      if (refreshToken) {
        const result = await logoutUser(refreshToken);
        return result;
      } else {
        throw new Error('No refresh token available');
      }
    } catch (error: any) {
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

        if (responseData?.accessToken && responseData?.refreshToken) {
          state.accessToken = responseData.accessToken;
          state.refreshToken = responseData.refreshToken;
          state.isAuthenticated = true;

          console.log('Login fulfilled - setting tokens:', {
            accessToken: responseData.accessToken.substring(0, 20) + '...',
            refreshToken: responseData.refreshToken.substring(0, 20) + '...',
            isAuthenticated: true
          });
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
      })
      .addCase(logoutUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.loggingOut = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedPlan, setTokens, clearTokens } = authSlice.actions;

// Export the reducer
export const authReducer = authSlice.reducer;

// Configure the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
