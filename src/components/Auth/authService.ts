import apiClient from './base';

export interface SubscriptionPlan {
  planId: number;
  planName: string;
  description: string;
  price: number;
  billingCycle: string;
  customMonths: number;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RegisterData {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  planId: number;
  isTrial: boolean;
  trialDays: number;
  adminFirstName: string;
  adminLastName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export const registerUser = async (data: RegisterData): Promise<any> => {
  const response = await apiClient.post('/Auth/register', data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<any> => {
  const response = await apiClient.post('/Auth/login', data);
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<any> => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};

export const logoutUser = async (refreshToken: string): Promise<any> => {
  const response = await apiClient.post('/Auth/logout', { refreshToken });
  return response.data;
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get<ApiResponse<SubscriptionPlan[]>>('/Auth/subscription/plans');
  return response.data.data;
};
