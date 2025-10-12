# School Management System - API Integration Documentation

## 📌 Overview

This document provides comprehensive details about all API integrations implemented in the School Management System frontend application.

## 🔐 Authentication System

### Token Architecture
- **Access Token**: Short-lived (30 minutes), used for API authorization
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens
- **Auto-refresh**: Seamless token renewal before expiration
- **Persistent Sessions**: Tokens survive browser restarts

### Token Storage
- **Browser Storage**: localStorage for token persistence
- **Singleton Manager**: TokenManager class handles all token operations
- **Security**: Automatic cleanup on logout/API failures

---

## 🎯 API Endpoints Integration

### 1. Authentication APIs

#### POST `/api/Auth/register`
**Purpose**: User registration with school and admin details

**Request Body**:
```json
{
  "schoolName": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "planId": 0,
  "isTrial": true,
  "trialDays": 30,
  "adminFirstName": "string",
  "adminLastName": "string",
  "adminUsername": "string",
  "adminEmail": "string",
  "adminPassword": "string",
  "adminPhone": "string"
}
```

**Response**: Registration confirmation
**Frontend Usage**: `Register.jsx` → Redux thunk → API call → Success redirect to login

#### POST `/api/Auth/login`
**Purpose**: User authentication

**Request Body**:
```json
{
  "username": "Ysingh",
  "password": "Admin@1234"
}
```

**Response**:
```json
{
  "access_token": "jwt.access.token",
  "refresh_token": "jwt.refresh.token",
  "expires_in": 1800,
  "user": {...} // Optional user data
}
```

**Frontend Usage**: `Login.jsx` → Redux thunk → API call → Store tokens → Authenticate user

#### POST `/api/auth/refresh`
**Purpose**: Refresh expired access tokens

**Request Body**:
```json
{
  "refreshToken": "jwt.refresh.token"
}
```

**Response**: New access/refresh tokens
**Frontend Usage**: `TokenManager` → Automatic refresh on API 401 errors

#### POST `/api/Auth/logout`
**Purpose**: Secure user logout

**Request Body**:
```json
{
  "refreshToken": "jwt.refresh.token"
}
```

**Response**: Logout confirmation
**Frontend Usage**: `App.jsx` → TokenManager → API call → Clear all tokens → Redirect

### 2. Subscription Plan APIs

#### GET `/api/Auth/subscription/plans`
**Purpose**: Fetch available subscription plans

**Response**:
```json
{
  "success": true,
  "message": "Fetched subscription plans successfully.",
  "data": [
    {
      "planId": 2,
      "planName": "Testing 1",
      "description": "Testing 1",
      "price": 1100,
      "billingCycle": "Yearly",
      "customMonths": 6,
      "isActive": true
    },
    {
      "planId": 8,
      "planName": "Basic",
      "description": "montly plan",
      "price": 500,
      "billingCycle": "Monthly",
      "customMonths": 0,
      "isActive": true
    }
  ]
}
```

**Frontend Usage**: `PricingPage.jsx` → Redux thunk → Display dynamic pricing → Plan selection

---

## 🏗️ Technical Implementation

### File Structure Organization

```
src/
├── components/
│   ├── Auth/
│   │   ├── base.ts                    # Axios configuration, interceptors
│   │   ├── authService.ts             # API service functions
│   │   ├── store.ts                   # Redux store & auth slices
│   │   ├── tokenManager.ts            # Token management logic
│   │   ├── CircularIndeterminate.jsx # Global loading component
│   │   ├── Login.jsx                  # Login form
│   │   └── Register.jsx               # Registration form
│   └── PricingPage.jsx               # Dynamic plans display
├── App.jsx                           # Main app with auth logic
└── main.jsx                          # Redux Provider setup
```

### Redux State Management

#### Auth State Structure
```typescript
interface AuthState {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  selectedPlan: number | null;
  registering: boolean;
  loggingIn: boolean;
}
```

#### Available Actions
- `fetchSubscriptionPlans()` - Load pricing plans
- `loginUserAsync(data)` - Handle login
- `registerUserAsync(data)` - Handle registration

### Loading States Management

#### Button-Level Loading
- Login button: Shows spinner when `loggingIn` state is true
- Register button: Shows spinner when `registering` state is true
- Text changes: "Sign In" → "Signing In..." / "Register" → "Registering..."

#### Global Loading Overlay
- Full-screen loader for all auth operations
- Triggered by `registering || loggingIn` state
- High z-index overlay with semi-transparent background

### Error Handling Strategy

#### Axios Interceptors
```typescript
// Request interceptor: Add auth header
apiClient.interceptors.request.use((config) => {
  const token = TokenManager.getInstance().getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: Handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      TokenManager.getInstance().clearTokens();
      window.location.href = '/'; // Force re-auth
    }
    return Promise.reject(error);
  }
);
```

#### Redux Thunk Error Handling
```typescript
const loginUserAsync = createAsyncThunk(
  'auth/loginUser',
  async (data: LoginData, { rejectWithValue }) => {
    try {
      return await loginUser(data);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
```

### User Activity & Auto-logout System

#### Activity Tracking
- **Monitored Events**: `mousemove`, `keypress`, `click`, `scroll`
- **Inactivity Timeout**: 10 minutes total
- **Warning Period**: 1 minute warning at 9 minutes
- **SweetAlert Integration**: Interactive popup with countdown

#### Implementation
```javascript
const resetTimers = () => {
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => {
    Swal.fire({
      title: 'Inactivity Warning',
      text: 'You will be logged out in 1 minute',
      timer: 60000,
      timerProgressBar: true,
      // ...options
    });
  }, WARNING_TIME);

  logoutTimer = setTimeout(handleLogout, LOGOUT_TIME);
};
```

### Session Persistence

#### Startup Authentication Check
```javascript
useEffect(() => {
  if (TokenManager.getInstance().isAuthenticated()) {
    setAuthenticated(true);
    // Restore user session
  }
}, []);
```

#### Session Recovery
- Tokens loaded from localStorage automatically
- Valid token expiry checked
- Invalid sessions redirect to authentication

---

## 🔄 User Flow Diagrams

### Registration Flow
```
Landing Page → Register Button → Pricing Page → Select Plan → Registration Form
↓
Submit API → POST /api/Auth/register → Success Response
↓
SweetAlert → Redirect to Login Page
```

### Login Flow
```
Login Page → Submit Credentials → POST /api/Auth/login
↓
Store Access/Refresh Tokens → Authenticate User
↓
Auto-redirect to Dashboard
```

### Token Refresh Flow
```
API Call → 401 Unauthorized → Automatic Refresh
↓
POST /api/auth/refresh → New Tokens → Retry Original API Call
↓
Success Response → Continue Normal Operation
```

### Auto-logout Flow
```
User Activity → Reset 10min Timer
↓
9min Mark → SweetAlert Warning (1min countdown)
↓
Continue: Reset Timer | Logout: Force Logout
↓
10min Mark: POST /api/Auth/logout → Clear Session
```

---

## 🎨 UI/UX Integration

### Loading States
- **Button Spinners**: Tailwind `animate-spin` with icon + text changes
- **Global Overlay**: Fixed position with `z-50`, semi-transparent background
- **Pricing Loader**: Page-level loading for plan fetching

### User Feedback
- **SweetAlert Modals**: Success/error/confirmation dialogs
- **Toast Notifications**: Instant feedback for actions
- **Progress Indicators**: Visual countdown timers

### Error Recovery
- **Graceful Degradation**: App continues with local state on API failures
- **User Guidance**: Clear error messages with actionable steps
- **Retry Mechanisms**: Automatic token refresh, manual retry options

---

## 🔧 Configuration & Environment

### API Base URL
```javascript
const API_BASE_URL = '/api'; // Proxied to actual server
```

### Vite Proxy Configuration
```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://schoolmgmt-api-vvfv.onrender.com',
      changeOrigin: true,
      secure: true,
    },
  },
}
```

### CORS Handling
- Development: Vite proxy handles CORS
- Production: Server-side CORS configuration required

### Token Security
- **Secure Storage**: localStorage (consider HTTP-only cookies in production)
- **Auto-cleanup**: Tokens removed on logout/expiry
- **Encryption**: No additional encryption (rely on HTTPS)

---

## 📊 Performance Optimizations

### Request Minimization
- **Axios Interceptors**: Efficient header management
- **Token Caching**: Prevent unnecessary API calls
- **Request Deduplication**: Singleton token operations

### State Optimization
- **Selective Re-renders**: Redux state targeting
- **Memoized Components**: React useCallback/useMemo usage
- **Efficient Updates**: Minimal state change triggers

---

## 🐛 Troubleshooting Guide

### Common Issues

#### 1. CORS Errors
**Problem**: Browser blocks API requests
**Solution**: Check Vite proxy configuration in `vite.config.js`

#### 2. Auth State Not Persisting
**Problem**: User loses session on refresh
**Solution**: Check TokenManager `isAuthenticated()` method

#### 3. Token Not Refreshing
**Problem**: User logged out unexpectedly
**Solution**: Verify token expiry times and API responses

#### 4. Loaders Not Showing
**Problem**: UI doesn't show loading states
**Solution**: Check Redux state updates and component re-renders

### Debug Commands
```bash
# Check localStorage tokens
localStorage.getItem('tokens')

# Monitor Redux state
console.log(store.getState())

# Check API network requests
# Open browser DevTools → Network tab
```

---

## 🚀 Future Enhancements

### Planned API Integrations
- Student management endpoints
- Staff/faculty APIs
- Fee payment systems
- Reporting analytics

### Security Improvements
- Implement HTTP-only cookies for token storage
- Add CSRF protection
- Implement rate limiting

### Performance Optimizations
- API response caching
- Lazy loading for components
- Service worker integration

---

## 📞 Support & Maintenance

### Key Files to Monitor
- `src/components/Auth/` - Authentication logic
- `src/App.jsx` - Main auth flow
- `vite.config.js` - API proxy configuration

### Regular Maintenance Tasks
- Token structure validation
- API endpoint testing
- Error rate monitoring
- Performance optimization

---

*This documentation covers all API integrations as of the latest implementation. Please update this file when adding new API endpoints or modifying existing integrations.*
