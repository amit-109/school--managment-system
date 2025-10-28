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