import apiClient from '../Auth/base';

// Type Definitions
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'operator' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  role: 'admin' | 'operator' | 'user';
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'operator' | 'user';
  isActive?: boolean;
}

export interface PageableResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

export interface SubscriptionDetails {
  subscriptionId: number;
  userId: number;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  price: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// User Management APIs
export const getUsers = async (page = 0, size = 10, search?: string): Promise<PageableResponse<User>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) params.append('search', search);

  const response = await apiClient.get<ApiResponse<PageableResponse<User>>>(`/admin/users?${params}`);
  return response.data.data;
};

export const getUserById = async (userId: number): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>(`/Admin/users/${userId}`);
  return response.data.data;
};

export const createUser = async (userData: UserCreateData): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>('/Admin/users', userData);
  return response.data.data;
};

export const updateUser = async (userId: number, userData: UserUpdateData): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>(`/Admin/users/${userId}`, userData);
  return response.data.data;
};

export const deleteUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/Admin/users/${userId}`);
};

export const toggleUserStatus = async (userId: number, isActive: boolean): Promise<User> => {
  const response = await apiClient.patch<ApiResponse<User>>(`/Admin/users/${userId}/status`, { isActive });
  return response.data.data;
};

// Subscription Management APIs
export const getUserSubscription = async (userId: number): Promise<SubscriptionDetails> => {
  const response = await apiClient.get<ApiResponse<SubscriptionDetails>>(`/Admin/users/${userId}/subscription`);
  return response.data.data;
};

export const updateUserSubscription = async (userId: number, subscriptionData: Partial<SubscriptionDetails>): Promise<SubscriptionDetails> => {
  const response = await apiClient.put<ApiResponse<SubscriptionDetails>>(`/Admin/users/${userId}/subscription`, subscriptionData);
  return response.data.data;
};

export const getAllSubscriptions = async (page = 0, size = 10, status?: string): Promise<PageableResponse<SubscriptionDetails>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) params.append('status', status);

  const response = await apiClient.get<ApiResponse<PageableResponse<SubscriptionDetails>>>(`/Admin/subscriptions?${params}`);
  return response.data.data;
};

// Dashboard APIs
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<ApiResponse<DashboardStats>>('/Admin/dashboard/stats');
  return response.data.data;
};

export const getDashboardOverview = async (): Promise<any> => {
  const response = await apiClient.get<ApiResponse<any>>('/Admin/dashboard/overview');
  return response.data.data;
};

// Permissions APIs
export const getUserPermissions = async (userId: number): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>(`/Admin/users/${userId}/permissions`);
  return response.data.data;
};

export const updateUserPermissions = async (userId: number, permissions: string[]): Promise<string[]> => {
  const response = await apiClient.put<ApiResponse<string[]>>(`/Admin/users/${userId}/permissions`, { permissions });
  return response.data.data;
};

export const getAllPermissions = async (): Promise<string[]> => {
  const response = await apiClient.get<ApiResponse<string[]>>('/Admin/permissions');
  return response.data.data;
};
