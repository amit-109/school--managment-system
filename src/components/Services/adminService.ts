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

  const response = await apiClient.get<ApiResponse<PageableResponse<SubscriptionDetails>>>(`/superadmin/subscription/plans?${params}`);
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

// Class Management Interfaces
export interface Class {
  classId: number;
  className: string;
  description: string;
  classTeacherId: number;
  classTeacherName: string;
  academicYear: string;
  orderNo: number;
  isActive: boolean;
}

export interface ClassCreateData {
  classId: number;
  className: string;
  description: string;
  classTeacherId: number;
  classTeacherName: string;
  academicYear: string;
  orderNo: number;
  isActive?: boolean;
}

export interface ClassUpdateData {
  classId: number;
  className: string;
  description: string;
  classTeacherId: number;
  classTeacherName: string;
  academicYear: string;
  orderNo: number;
  isActive: boolean;
}

// Class Management APIs
export const getClasses = async (page = 0, size = 10): Promise<PageableResponse<Class>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<PageableResponse<Class>>>(`/admin/classes?${params}`);
  return response.data.data;
};

export const getClassById = async (classId: number): Promise<Class> => {
  const response = await apiClient.get<ApiResponse<Class>>(`/admin/classes/${classId}`);
  return response.data.data;
};

export const createClass = async (classData: ClassCreateData): Promise<Class> => {
  const response = await apiClient.post<ApiResponse<Class>>('/admin/classes', classData);
  return response.data.data;
};

export const updateClass = async (classId: number, classData: ClassUpdateData): Promise<Class> => {
  const response = await apiClient.put<ApiResponse<Class>>(`/admin/classes/${classId}`, classData);
  return response.data.data;
};

export const deleteClass = async (classId: number): Promise<void> => {
  await apiClient.delete(`/admin/classes/${classId}`);
};

// Section Management Interfaces
export interface Section {
  sectionId: number;
  classId: number;
  sectionName: string;
  description: string;
  classTeacherId: number;
  classTeacherName: string;
  capacity: number;
  isActive: boolean;
}

export interface SectionCreateData {
  sectionId: number;
  classId: number;
  sectionName: string;
  description: string;
  classTeacherId: number;
  classTeacherName: string;
  capacity: number;
  isActive?: boolean;
}

export interface SectionUpdateData {
  sectionId: number;
  classId: number;
  sectionName: string;
  description: string;
  classTeacherId: number;
  classTeacherName: string;
  capacity: number;
  isActive: boolean;
}

// Section Management APIs
export const getSections = async (page = 0, size = 10): Promise<PageableResponse<Section>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<PageableResponse<Section>>>(`/admin/classes/sections?${params}`);
  return response.data.data;
};

export const getSectionsByClass = async (classId: number, page = 0, size = 10): Promise<PageableResponse<Section>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<PageableResponse<Section>>>(`/admin/classes/${classId}/sections?${params}`);
  return response.data.data;
};

export const getSectionById = async (sectionId: number): Promise<Section> => {
  const response = await apiClient.get<ApiResponse<Section>>(`/admin/classes/sections/${sectionId}`);
  return response.data.data;
};

export const createSection = async (classId: number, sectionData: SectionCreateData): Promise<Section> => {
  const response = await apiClient.post<ApiResponse<Section>>(`/admin/classes/${classId}/sections`, sectionData);
  return response.data.data;
};

export const updateSection = async (sectionId: number, sectionData: SectionUpdateData): Promise<Section> => {
  const response = await apiClient.put<ApiResponse<Section>>(`/admin/classes/sections/${sectionId}`, sectionData);
  return response.data.data;
};

export const deleteSection = async (sectionId: number): Promise<void> => {
  await apiClient.delete(`/admin/classes/sections/${sectionId}`);
};

// Fee Management Interfaces
export interface Fee {
  feeId: number;
  organizationId: number;
  classId: number;
  feeType: string;
  amount: number;
  dueDate: string;
  term: string;
  session: string;
  status: string;
}

export interface FeeCreateData {
  feeId: number;
  organizationId: number;
  classId: number;
  feeType: string;
  amount: number;
  dueDate: string;
  term: string;
  session: string;
  status?: string;
}

// Fee Management APIs
export const getFees = async (page = 0, size = 10): Promise<PageableResponse<Fee>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<PageableResponse<Fee>>>(`/admin/fees?${params}`);
  return response.data.data;
};

export const getFeeById = async (feeId: number): Promise<Fee> => {
  const response = await apiClient.get<ApiResponse<Fee>>(`/admin/fees/${feeId}`);
  return response.data.data;
};

export const createFee = async (feeData: FeeCreateData): Promise<Fee> => {
  const response = await apiClient.post<ApiResponse<Fee>>('/admin/fees', feeData);
  return response.data.data;
};

export const deleteFee = async (feeId: number): Promise<void> => {
  await apiClient.delete(`/admin/fees/${feeId}`);
};

// Subject Management Interfaces
export interface Subject {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  description: string;
  isActive: boolean;
}

export interface SubjectCreateData {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  description: string;
  isActive?: boolean;
}

export interface SubjectUpdateData {
  subjectId: number;
  subjectName: string;
  subjectCode: string;
  description: string;
  isActive: boolean;
}

// Subject Management APIs
export const getSubjects = async (page = 0, size = 10): Promise<PageableResponse<Subject>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<PageableResponse<Subject>>>(`/admin/subjects?${params}`);
  return response.data.data;
};

export const getSubjectById = async (subjectId: number): Promise<Subject> => {
  const response = await apiClient.get<ApiResponse<Subject>>(`/admin/subjects/${subjectId}`);
  return response.data.data;
};

export const createSubject = async (subjectData: SubjectCreateData): Promise<Subject> => {
  const response = await apiClient.post<ApiResponse<Subject>>('/admin/subjects', subjectData);
  return response.data.data;
};

export const updateSubject = async (subjectId: number, subjectData: SubjectUpdateData): Promise<Subject> => {
  const response = await apiClient.put<ApiResponse<Subject>>(`/admin/subjects/${subjectId}`, subjectData);

  // Handle different API response formats
  if (response.data && response.data.data) {
    // Standard API response: { success: true, message: "...", data: SUBJECT }
    return response.data.data;
  } else if (response.data && (response.data as any).subjectId) {
    // API returns subject directly under response.data instead of response.data.data
    return response.data as any as Subject;
  } else {
    // Fallback - return the subjectData we just sent (for cases where API returns success but no data)
    return { ...subjectData, subjectId };
  }
};

export const deleteSubject = async (subjectId: number): Promise<void> => {
  await apiClient.delete(`/admin/subjects/${subjectId}`);
};

// Session Management Interfaces
export interface Session {
  sessionId: number;
  sessionName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed' | 'Upcoming';
  description: string;
  isActive: boolean;
}

export interface SessionCreateData {
  sessionId: number;
  sessionName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status?: 'Active' | 'Closed' | 'Upcoming';
  description: string;
  isActive?: boolean;
}

export interface SessionUpdateData {
  sessionId: number;
  sessionName: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed' | 'Upcoming';
  description: string;
  isActive: boolean;
}

// Session Management APIs
export const getSessions = async (page = 0, size = 10): Promise<PageableResponse<Session>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<ApiResponse<PageableResponse<Session>>>(`/admin/sessions?${params}`);
  return response.data.data;
};

export const getSessionById = async (sessionId: number): Promise<Session> => {
  const response = await apiClient.get<ApiResponse<Session>>(`/admin/sessions/${sessionId}`);
  return response.data.data;
};

export const createSession = async (sessionData: SessionCreateData): Promise<Session> => {
  const response = await apiClient.post<ApiResponse<Session>>('/admin/sessions', sessionData);
  return response.data.data;
};

export const updateSession = async (sessionId: number, sessionData: SessionUpdateData): Promise<Session> => {
  const response = await apiClient.put<ApiResponse<Session>>(`/admin/sessions/${sessionId}`, sessionData);
  return response.data.data;
};

export const deleteSession = async (sessionId: number): Promise<void> => {
  await apiClient.delete(`/admin/sessions/${sessionId}`);
};

// Fee Structure Management Interfaces
export interface FeeComponent {
  feeComponentId: number;
  name: string;
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual';
  description?: string;
}

export interface FeeStructure {
  feeStructureId: number;
  classId: number;
  className: string;
  sessionId: number;
  sessionName: string;
  stream: string;
  feeComponents: FeeComponent[];
  totalAnnualAmount: number;
  description: string;
  isActive: boolean;
}

export interface FeeStructureCreateData {
  feeStructureId: number;
  classId: number;
  sessionId: number;
  stream: string;
  feeComponents: Omit<FeeComponent, 'feeComponentId'>[];
  description: string;
  isActive?: boolean;
}

export interface FeeStructureUpdateData {
  feeStructureId: number;
  classId: number;
  sessionId: number;
  stream: string;
  feeComponents: FeeComponent[];
  description: string;
  isActive: boolean;
}

// Fee Structure Management APIs
export const getFeeStructures = async (page = 0, size = 10, classId?: number, sessionId?: number): Promise<PageableResponse<FeeStructure>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (classId) params.append('classId', classId.toString());
  if (sessionId) params.append('sessionId', sessionId.toString());

  const response = await apiClient.get<ApiResponse<PageableResponse<FeeStructure>>>(`/admin/fee-structures?${params}`);
  return response.data.data;
};

export const getFeeStructureById = async (feeStructureId: number): Promise<FeeStructure> => {
  const response = await apiClient.get<ApiResponse<FeeStructure>>(`/admin/fee-structures/${feeStructureId}`);
  return response.data.data;
};

export const createFeeStructure = async (feeStructureData: FeeStructureCreateData): Promise<FeeStructure> => {
  const response = await apiClient.post<ApiResponse<FeeStructure>>('/admin/fee-structures', feeStructureData);
  return response.data.data;
};

export const updateFeeStructure = async (feeStructureId: number, feeStructureData: FeeStructureUpdateData): Promise<FeeStructure> => {
  const response = await apiClient.put<ApiResponse<FeeStructure>>(`/admin/fee-structures/${feeStructureId}`, feeStructureData);
  return response.data.data;
};

export const deleteFeeStructure = async (feeStructureId: number): Promise<void> => {
  await apiClient.delete(`/admin/fee-structures/${feeStructureId}`);
};
