import apiClient from '../Auth/base';

// Classes API
export const getClasses = async () => {
  const response = await apiClient.get('/admin/classes');
  return response.data;
};

export const createClass = async (classData) => {
  const response = await apiClient.post('/admin/classes', classData);
  return response.data;
};

export const updateClass = async (classId, classData) => {
  const response = await apiClient.put(`/admin/classes/${classId}`, classData);
  return response.data;
};

export const deleteClass = async (classId) => {
  const response = await apiClient.delete(`/admin/classes/${classId}`);
  return response.data;
};

// Sections API
export const getSections = async (classId) => {
  const response = await apiClient.get(`/admin/classes/${classId}/sections`);
  return response.data;
};

export const createSection = async (classId, sectionData) => {
  const response = await apiClient.post(`/admin/classes/${classId}/sections`, sectionData);
  return response.data;
};

export const updateSection = async (sectionId, sectionData) => {
  const response = await apiClient.put(`/admin/classes/sections/${sectionId}`, sectionData);
  return response.data;
};

export const deleteSection = async (sectionId) => {
  const response = await apiClient.delete(`/admin/classes/sections/${sectionId}`);
  return response.data;
};

// Teachers API
export const getTeachers = async () => {
  const response = await apiClient.get('/admin/classes/teachers');
  return response.data;
};

// Class Subjects API
export const getClassSubjects = async (classId) => {
  const response = await apiClient.get(`/admin/classes/${classId}/subjects`);
  return response.data;
};

export const assignSubjectToClass = async (classId, subjectId) => {
  const response = await apiClient.post(`/admin/classes/${classId}/subjects/${subjectId}`);
  return response.data;
};

export const removeSubjectFromClass = async (classId, classSubjectId) => {
  const response = await apiClient.delete(`/admin/classes/${classId}/subjects/${classSubjectId}`);
  return response.data;
};

// Teacher Subjects API
export const getTeacherSubjects = async (teacherId) => {
  const response = await apiClient.get(`/admin/teachers/${teacherId}/subjects`);
  return response.data;
};

export const assignSubjectToTeacher = async (teacherId, assignmentData) => {
  const response = await apiClient.post(`/admin/teachers/${teacherId}/subjects`, assignmentData);
  return response.data;
};

export const removeSubjectFromTeacher = async (teacherId, teacherSubjectId) => {
  const response = await apiClient.delete(`/admin/teachers/${teacherId}/subjects/${teacherSubjectId}`);
  return response.data;
};

// Get Subjects (for dropdowns)
export const getSubjects = async () => {
  const response = await apiClient.get('/admin/subjects?pageNumber=1&pageSize=100');
  return response.data;
};

// User Management API
export const getUsers = async (pageNumber = 1, pageSize = 10, search = '', statusFilter = '') => {
  const params = new URLSearchParams();
  params.append('PageNumber', pageNumber.toString());
  params.append('PageSize', pageSize.toString());
  if (search) params.append('Search', search);
  if (statusFilter) params.append('StatusFilter', statusFilter);
  
  const response = await apiClient.get(`/admin/users?${params.toString()}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await apiClient.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (userData) => {
  const response = await apiClient.put('/admin/users', userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getAvailableRoles = async () => {
  const response = await apiClient.get('/admin/roles/available');
  return response.data;
};

// Get Parents (for student creation)
export const getParents = async () => {
  const response = await apiClient.get('/admin/users?PageNumber=1&PageSize=100&StatusFilter=Parent');
  return response.data;
};

// Additional User Management API exports
export const getUserById = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

export const toggleUserStatus = async (userId, isActive) => {
  const response = await apiClient.put(`/admin/users/${userId}/status`, { isActive });
  return response.data;
};

export const getUserSubscription = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}/subscription`);
  return response.data;
};

export const updateUserSubscription = async (userId, subscriptionData) => {
  const response = await apiClient.put(`/admin/users/${userId}/subscription`, subscriptionData);
  return response.data;
};

export const getAllSubscriptions = async (page = 0, size = 10, status = '') => {
  const params = new URLSearchParams();
  params.append('PageNumber', page.toString());
  params.append('PageSize', size.toString());
  if (status) params.append('Status', status);
  
  const response = await apiClient.get(`/admin/subscriptions?${params.toString()}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await apiClient.get('/admin/dashboard/stats');
  return response.data;
};

export const getDashboardOverview = async () => {
  const response = await apiClient.get('/admin/dashboard/overview');
  return response.data;
};

export const getUserPermissions = async (userId) => {
  const response = await apiClient.get(`/admin/users/${userId}/permissions`);
  return response.data;
};

export const updateUserPermissions = async (userId, permissions) => {
  const response = await apiClient.put(`/admin/users/${userId}/permissions`, { permissions });
  return response.data;
};

export const getAllPermissions = async () => {
  const response = await apiClient.get('/admin/permissions');
  return response.data;
};

// Additional Class API exports
export const getClassById = async (classId) => {
  const response = await apiClient.get(`/admin/classes/${classId}`);
  return response.data;
};

// Additional Section API exports
export const getSectionsByClass = async (classId, page = 0, size = 10) => {
  const response = await apiClient.get(`/admin/classes/${classId}/sections?PageNumber=${page}&PageSize=${size}`);
  return response.data;
};

export const getSectionById = async (sectionId) => {
  const response = await apiClient.get(`/admin/sections/${sectionId}`);
  return response.data;
};

// Fee Management API exports
export const getFees = async (page = 0, size = 10) => {
  const response = await apiClient.get(`/admin/fees?PageNumber=${page}&PageSize=${size}`);
  return response.data;
};

export const getFeeById = async (feeId) => {
  const response = await apiClient.get(`/admin/fees/${feeId}`);
  return response.data;
};

export const createFee = async (feeData) => {
  const response = await apiClient.post('/admin/fees', feeData);
  return response.data;
};

export const deleteFee = async (feeId) => {
  const response = await apiClient.delete(`/admin/fees/${feeId}`);
  return response.data;
};

// Additional Subject API exports
export const getSubjectById = async (subjectId) => {
  const response = await apiClient.get(`/admin/subjects/${subjectId}`);
  return response.data;
};

export const createSubject = async (subjectData) => {
  const response = await apiClient.post('/admin/subjects', subjectData);
  return response.data;
};

export const updateSubject = async (subjectId, subjectData) => {
  const response = await apiClient.put(`/admin/subjects/${subjectId}`, subjectData);
  return response.data;
};

export const deleteSubject = async (subjectId) => {
  const response = await apiClient.delete(`/admin/subjects/${subjectId}`);
  return response.data;
};

// Session Management API exports
export const getSessions = async (page = 0, size = 10) => {
  const response = await apiClient.get(`/admin/sessions?PageNumber=${page}&PageSize=${size}`);
  return response.data;
};

export const getSessionById = async (sessionId) => {
  const response = await apiClient.get(`/admin/sessions/${sessionId}`);
  return response.data;
};

export const createSession = async (sessionData) => {
  const response = await apiClient.post('/admin/sessions', sessionData);
  return response.data;
};

export const updateSession = async (sessionId, sessionData) => {
  const response = await apiClient.put(`/admin/sessions/${sessionId}`, sessionData);
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const response = await apiClient.delete(`/admin/sessions/${sessionId}`);
  return response.data;
};

// Fee Structure Management API exports
export const getFeeStructures = async (page = 0, size = 10, classId = null, sessionId = null) => {
  const params = new URLSearchParams();
  params.append('PageNumber', page.toString());
  params.append('PageSize', size.toString());
  if (classId) params.append('ClassId', classId.toString());
  if (sessionId) params.append('SessionId', sessionId.toString());
  
  const response = await apiClient.get(`/admin/fee-structures?${params.toString()}`);
  return response.data;
};

export const getFeeStructureById = async (feeStructureId) => {
  const response = await apiClient.get(`/admin/fee-structures/${feeStructureId}`);
  return response.data;
};

export const createFeeStructure = async (feeStructureData) => {
  const response = await apiClient.post('/admin/fee-structures', feeStructureData);
  return response.data;
};

export const updateFeeStructure = async (feeStructureId, feeStructureData) => {
  const response = await apiClient.put(`/admin/fee-structures/${feeStructureId}`, feeStructureData);
  return response.data;
};

export const deleteFeeStructure = async (feeStructureId) => {
  const response = await apiClient.delete(`/admin/fee-structures/${feeStructureId}`);
  return response.data;
};

// Permission Management APIs - Exactly as per specification
export const getAdminEffectivePermissions = async (adminId) => {
  const response = await apiClient.get(`/admin/permissions/user/${adminId}/effective`);
  return response.data;
};

export const getUserPermissionsForAssignment = async (userId) => {
  const response = await apiClient.get(`/admin/permissions/user/${userId}`);
  return response.data;
};

export const updateUserPermissionsForAssignment = async (userId, permissions) => {
  const response = await apiClient.post(`/admin/permissions/user/${userId}`, permissions);
  return response.data;
};

export const getUserLoginPermissions = async (userId) => {
  const response = await apiClient.get(`/admin/permissions/user/${userId}/login`);
  return response.data;
};