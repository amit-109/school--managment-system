import { configureStore, combineReducers, ThunkAction, Action } from '@reduxjs/toolkit';
import { authReducer } from './components/Auth/store';
import { adminSlice } from './components/Services/adminStore';
import { superAdminSlice } from './components/Services/superAdminStore';

// Combine all reducers
export const rootReducer = combineReducers({
  auth: authReducer,
  admin: adminSlice.reducer,
  superAdmin: superAdminSlice.reducer,
});

// Create the main store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Export the store for use in components
export default store;
