import axios from 'axios';
import TokenManager from './tokenManager';

// const API_BASE_URL = '/api';
// const API_BASE_URL = 'https://schoolmgmt-api-vvfv.onrender.com/api';
// const API_BASE_URL = "https://sfms-api.abhiworld.in/api";
const API_BASE_URL = "https://erp.kpmic.in//api";

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
      config.headers.Authorization = `Bearer ${token}`;
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
      TokenManager.getInstance().clearTokens();
      // Don't auto-redirect during development - let Redux handle state
      // window.location.href = '/'; // redirect to landing
    }
    return Promise.reject(error);
  }
);

export default apiClient;
