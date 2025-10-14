import axios from 'axios';
import TokenManager from './tokenManager';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include access token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getInstance().getAccessToken();
    if (token) {
      console.log('API Client: Adding Bearer token to request:', config.method?.toUpperCase(), config.url);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('API Client: No token available for request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized, clear tokens and redirect
      console.log('API Client: 401 error detected, clearing tokens');
      TokenManager.getInstance().clearTokens();
      // Don't auto-redirect during development - let Redux handle state
      // window.location.href = '/'; // redirect to landing
    }
    return Promise.reject(error);
  }
);

export default apiClient;
