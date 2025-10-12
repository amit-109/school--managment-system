import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionPlan, RegisterData, LoginData, getSubscriptionPlans, registerUser, loginUser, logoutUser } from './authService';

// Define the state interface
interface AuthState {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  selectedPlan: number | null;
  registering: boolean;
  loggingIn: boolean;
  loggingOut: boolean;
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
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('tokens') ?
        JSON.parse(localStorage.getItem('tokens')!).refreshToken : null;
      if (refreshToken) {
        const result = await logoutUser(refreshToken);
        return result;
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
      .addCase(loginUserAsync.fulfilled, (state) => {
        state.loggingIn = false;
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
        // Optionally clear errors or update state
      })
      .addCase(logoutUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.loggingOut = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedPlan } = authSlice.actions;

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
