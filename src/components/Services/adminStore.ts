import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  User,
  UserCreateData,
  UserUpdateData,
  PageableResponse,
  DashboardStats,
  SubscriptionDetails,
  Class,
  ClassCreateData,
  ClassUpdateData,
  Section,
  SectionCreateData,
  SectionUpdateData,
  Fee,
  FeeCreateData,
  Subject,
  SubjectCreateData,
  SubjectUpdateData,
  Session,
  SessionCreateData,
  SessionUpdateData,
  FeeStructure,
  FeeStructureCreateData,
  FeeStructureUpdateData,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserSubscription,
  updateUserSubscription,
  getAllSubscriptions,
  getDashboardStats,
  getDashboardOverview,
  getUserPermissions,
  updateUserPermissions,
  getAllPermissions,
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getSections,
  getSectionsByClass,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
  getFees,
  getFeeById,
  createFee,
  deleteFee,
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
} from './adminService';

// Define admin state interface
interface AdminState {
  users: User[];
  currentUser: User | null;
  subscriptions: SubscriptionDetails[];
  classes: Class[];
  sections: Section[];
  fees: Fee[];
  subjects: Subject[];
  sessions: Session[];
  feeStructures: FeeStructure[];
  dashboardStats: DashboardStats | null;
  permissions: string[];
  userPermissions: Record<number, string[]>;

  // Loading states
  loading: boolean;
  usersLoading: boolean;
  userLoading: boolean;
  creatingUser: boolean;
  updatingUser: boolean;
  deletingUser: boolean;
  subscriptionsLoading: boolean;
  classesLoading: boolean;
  creatingClass: boolean;
  updatingClass: boolean;
  deletingClass: boolean;
  sectionsLoading: boolean;
  creatingSection: boolean;
  updatingSection: boolean;
  deletingSection: boolean;
  feesLoading: boolean;
  creatingFee: boolean;
  deletingFee: boolean;
  subjectsLoading: boolean;
  creatingSubject: boolean;
  updatingSubject: boolean;
  deletingSubject: boolean;
  sessionsLoading: boolean;
  creatingSession: boolean;
  updatingSession: boolean;
  deletingSession: boolean;
  feeStructuresLoading: boolean;
  creatingFeeStructure: boolean;
  updatingFeeStructure: boolean;
  deletingFeeStructure: boolean;
  dashboardLoading: boolean;
  permissionsLoading: boolean;

  // Pagination
  usersPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  subscriptionsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  classesPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  sectionsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  sessionsPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
  feeStructuresPagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };

  // Errors
  error: string | null;
  searchTerm: string;
  selectedUser: User | null;
  selectedClass: Class | null;
  selectedSection: Section | null;
  selectedSession: Session | null;
  selectedFeeStructure: FeeStructure | null;
}

// Initial state
const initialState: AdminState = {
  users: [],
  currentUser: null,
  subscriptions: [],
  classes: [],
  sections: [],
  fees: [],
  subjects: [],
  sessions: [],
  feeStructures: [],
  dashboardStats: null,
  permissions: [],
  userPermissions: {},

  loading: false,
  usersLoading: false,
  userLoading: false,
  creatingUser: false,
  updatingUser: false,
  deletingUser: false,
  subscriptionsLoading: false,
  classesLoading: false,
  creatingClass: false,
  updatingClass: false,
  deletingClass: false,
  sectionsLoading: false,
  creatingSection: false,
  updatingSection: false,
  deletingSection: false,
  feesLoading: false,
  creatingFee: false,
  deletingFee: false,
  dashboardLoading: false,
  permissionsLoading: false,
  subjectsLoading: false,
  creatingSubject: false,
  updatingSubject: false,
  deletingSubject: false,
  sessionsLoading: false,
  creatingSession: false,
  updatingSession: false,
  deletingSession: false,
  feeStructuresLoading: false,
  creatingFeeStructure: false,
  updatingFeeStructure: false,
  deletingFeeStructure: false,

  usersPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  subscriptionsPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  classesPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  sectionsPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  sessionsPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  feeStructuresPagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },

  error: null,
  searchTerm: '',
  selectedUser: null,
  selectedClass: null,
  selectedSection: null,
  selectedSession: null,
  selectedFeeStructure: null,
};

// Async thunks
export const fetchUsersAsync = createAsyncThunk(
  'admin/fetchUsers',
  async ({ page = 0, size = 10, search }: { page?: number; size?: number; search?: string }, { rejectWithValue }) => {
    try {
      const response = await getUsers(page, size, search);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserByIdAsync = createAsyncThunk(
  'admin/fetchUserById',
  async (userId: number, { rejectWithValue }) => {
    try {
      const user = await getUserById(userId);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUserAsync = createAsyncThunk(
  'admin/createUser',
  async (userData: UserCreateData, { rejectWithValue }) => {
    try {
      const user = await createUser(userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserAsync = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }: { userId: number; userData: UserUpdateData }, { rejectWithValue }) => {
    try {
      const user = await updateUser(userId, userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUserAsync = createAsyncThunk(
  'admin/deleteUser',
  async (userId: number, { rejectWithValue }) => {
    try {
      await deleteUser(userId);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleUserStatusAsync = createAsyncThunk(
  'admin/toggleUserStatus',
  async ({ userId, isActive }: { userId: number; isActive: boolean }, { rejectWithValue }) => {
    try {
      const user = await toggleUserStatus(userId, isActive);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserSubscriptionAsync = createAsyncThunk(
  'admin/fetchUserSubscription',
  async (userId: number, { rejectWithValue }) => {
    try {
      const subscription = await getUserSubscription(userId);
      return { userId, subscription };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserSubscriptionAsync = createAsyncThunk(
  'admin/updateUserSubscription',
  async ({ userId, subscriptionData }: { userId: number; subscriptionData: Partial<SubscriptionDetails> }, { rejectWithValue }) => {
    try {
      const subscription = await updateUserSubscription(userId, subscriptionData);
      return { userId, subscription };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllSubscriptionsAsync = createAsyncThunk(
  'admin/fetchAllSubscriptions',
  async ({ page = 0, size = 10, status }: { page?: number; size?: number; status?: string }, { rejectWithValue }) => {
    try {
      const response = await getAllSubscriptions(page, size, status);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardStatsAsync = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await getDashboardStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardOverviewAsync = createAsyncThunk(
  'admin/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const overview = await getDashboardOverview();
      return overview;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserPermissionsAsync = createAsyncThunk(
  'admin/fetchUserPermissions',
  async (userId: number, { rejectWithValue }) => {
    try {
      const permissions = await getUserPermissions(userId);
      return { userId, permissions };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPermissionsAsync = createAsyncThunk(
  'admin/updateUserPermissions',
  async ({ userId, permissions }: { userId: number; permissions: string[] }, { rejectWithValue }) => {
    try {
      const updatedPermissions = await updateUserPermissions(userId, permissions);
      return { userId, permissions: updatedPermissions };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllPermissionsAsync = createAsyncThunk(
  'admin/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const permissions = await getAllPermissions();
      return permissions;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Class async thunks
export const fetchClassesAsync = createAsyncThunk(
  'admin/fetchClasses',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getClasses(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchClassByIdAsync = createAsyncThunk(
  'admin/fetchClassById',
  async (classId: number, { rejectWithValue }) => {
    try {
      const classData = await getClassById(classId);
      return classData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createClassAsync = createAsyncThunk(
  'admin/createClass',
  async (classData: ClassCreateData, { rejectWithValue }) => {
    try {
      const classResult = await createClass(classData);
      return classResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateClassAsync = createAsyncThunk(
  'admin/updateClass',
  async ({ classId, classData }: { classId: number; classData: ClassUpdateData }, { rejectWithValue }) => {
    try {
      const classResult = await updateClass(classId, classData);
      return classResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteClassAsync = createAsyncThunk(
  'admin/deleteClass',
  async (classId: number, { rejectWithValue }) => {
    try {
      await deleteClass(classId);
      return classId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Section async thunks
export const fetchSectionsAsync = createAsyncThunk(
  'admin/fetchSections',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getSections(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSectionsByClassAsync = createAsyncThunk(
  'admin/fetchSectionsByClass',
  async ({ classId, page = 0, size = 10 }: { classId: number; page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getSectionsByClass(classId, page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSectionByIdAsync = createAsyncThunk(
  'admin/fetchSectionById',
  async (sectionId: number, { rejectWithValue }) => {
    try {
      const sectionData = await getSectionById(sectionId);
      return sectionData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSectionAsync = createAsyncThunk(
  'admin/createSection',
  async (sectionData: SectionCreateData, { rejectWithValue }) => {
    try {
      const classId = sectionData.classId;
      const sectionResult = await createSection(classId, sectionData);
      return sectionResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSectionAsync = createAsyncThunk(
  'admin/updateSection',
  async ({ sectionId, sectionData }: { sectionId: number; sectionData: SectionUpdateData }, { rejectWithValue }) => {
    try {
      const sectionResult = await updateSection(sectionId, sectionData);
      return sectionResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSectionAsync = createAsyncThunk(
  'admin/deleteSection',
  async (sectionId: number, { rejectWithValue }) => {
    try {
      await deleteSection(sectionId);
      return sectionId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);



// Fee async thunks
export const fetchFeesAsync = createAsyncThunk(
  'admin/fetchFees',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getFees(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFeeByIdAsync = createAsyncThunk(
  'admin/fetchFeeById',
  async (feeId: number, { rejectWithValue }) => {
    try {
      const feeData = await getFeeById(feeId);
      return feeData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createFeeAsync = createAsyncThunk(
  'admin/createFee',
  async (feeData: FeeCreateData, { rejectWithValue }) => {
    try {
      const feeResult = await createFee(feeData);
      return feeResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fee async thunks
export const deleteFeeAsync = createAsyncThunk(
  'admin/deleteFee',
  async (feeId: number, { rejectWithValue }) => {
    try {
      await deleteFee(feeId);
      return feeId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Subject async thunks
export const fetchSubjectsAsync = createAsyncThunk(
  'admin/fetchSubjects',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getSubjects(page, size);
      // Return raw API response - Redux state will handle it
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSubjectByIdAsync = createAsyncThunk(
  'admin/fetchSubjectById',
  async (subjectId: number, { rejectWithValue }) => {
    try {
      const subjectData = await getSubjectById(subjectId);
      return subjectData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSubjectAsync = createAsyncThunk(
  'admin/createSubject',
  async (subjectData: SubjectCreateData, { rejectWithValue }) => {
    try {
      const subjectResult = await createSubject(subjectData);
      return subjectResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSubjectAsync = createAsyncThunk(
  'admin/updateSubject',
  async ({ subjectId, subjectData }: { subjectId: number; subjectData: SubjectUpdateData }, { rejectWithValue }) => {
    try {
      const subjectResult = await updateSubject(subjectId, subjectData);
      return subjectResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSubjectAsync = createAsyncThunk(
  'admin/deleteSubject',
  async (subjectId: number, { rejectWithValue }) => {
    try {
      await deleteSubject(subjectId);
      return subjectId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Session async thunks
export const fetchSessionsAsync = createAsyncThunk(
  'admin/fetchSessions',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await getSessions(page, size);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSessionByIdAsync = createAsyncThunk(
  'admin/fetchSessionById',
  async (sessionId: number, { rejectWithValue }) => {
    try {
      const sessionData = await getSessionById(sessionId);
      return sessionData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSessionAsync = createAsyncThunk(
  'admin/createSession',
  async (sessionData: SessionCreateData, { rejectWithValue }) => {
    try {
      const sessionResult = await createSession(sessionData);
      return sessionResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSessionAsync = createAsyncThunk(
  'admin/updateSession',
  async ({ sessionId, sessionData }: { sessionId: number; sessionData: SessionUpdateData }, { rejectWithValue }) => {
    try {
      const sessionResult = await updateSession(sessionId, sessionData);
      return sessionResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSessionAsync = createAsyncThunk(
  'admin/deleteSession',
  async (sessionId: number, { rejectWithValue }) => {
    try {
      await deleteSession(sessionId);
      return sessionId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fee Structure async thunks
export const fetchFeeStructuresAsync = createAsyncThunk(
  'admin/fetchFeeStructures',
  async ({ page = 0, size = 10, classId, sessionId }: { page?: number; size?: number; classId?: number; sessionId?: number }, { rejectWithValue }) => {
    try {
      const response = await getFeeStructures(page, size, classId, sessionId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFeeStructureByIdAsync = createAsyncThunk(
  'admin/fetchFeeStructureById',
  async (feeStructureId: number, { rejectWithValue }) => {
    try {
      const feeStructureData = await getFeeStructureById(feeStructureId);
      return feeStructureData;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createFeeStructureAsync = createAsyncThunk(
  'admin/createFeeStructure',
  async (feeStructureData: FeeStructureCreateData, { rejectWithValue }) => {
    try {
      const feeStructureResult = await createFeeStructure(feeStructureData);
      return feeStructureResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateFeeStructureAsync = createAsyncThunk(
  'admin/updateFeeStructure',
  async ({ feeStructureId, feeStructureData }: { feeStructureId: number; feeStructureData: FeeStructureUpdateData }, { rejectWithValue }) => {
    try {
      const feeStructureResult = await updateFeeStructure(feeStructureId, feeStructureData);
      return feeStructureResult;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteFeeStructureAsync = createAsyncThunk(
  'admin/deleteFeeStructure',
  async (feeStructureId: number, { rejectWithValue }) => {
    try {
      await deleteFeeStructure(feeStructureId);
      return feeStructureId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Create the slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUserState: (state) => {
      state.currentUser = null;
      state.selectedUser = null;
      state.userPermissions = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsersAsync.fulfilled, (state, action: PayloadAction<PageableResponse<User>>) => {
        state.usersLoading = false;
        state.users = action.payload.content;
        state.usersPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchUsersAsync.rejected, (state, action: PayloadAction<any>) => {
        state.usersLoading = false;
        state.error = action.payload;
      });

    // Fetch User by ID
    builder
      .addCase(fetchUserByIdAsync.pending, (state) => {
        state.userLoading = true;
        state.error = null;
      })
      .addCase(fetchUserByIdAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.userLoading = false;
        state.currentUser = action.payload;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.userLoading = false;
        state.error = action.payload;
      });

    // Create User
    builder
      .addCase(createUserAsync.pending, (state) => {
        state.creatingUser = true;
        state.error = null;
      })
      .addCase(createUserAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.creatingUser = false;
        state.users.push(action.payload);
        state.usersPagination.totalElements += 1;
      })
      .addCase(createUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingUser = false;
        state.error = action.payload;
      });

    // Update User
    builder
      .addCase(updateUserAsync.pending, (state) => {
        state.updatingUser = true;
        state.error = null;
      })
      .addCase(updateUserAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.updatingUser = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingUser = false;
        state.error = action.payload;
      });

    // Delete User
    builder
      .addCase(deleteUserAsync.pending, (state) => {
        state.deletingUser = true;
        state.error = null;
      })
      .addCase(deleteUserAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingUser = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.usersPagination.totalElements -= 1;
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUserAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingUser = false;
        state.error = action.payload;
      });

    // Toggle User Status
    builder
      .addCase(toggleUserStatusAsync.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      });

    // Subscriptions
    builder
      .addCase(fetchUserSubscriptionAsync.fulfilled, (state, action: PayloadAction<{ userId: number; subscription: SubscriptionDetails }>) => {
        // Handle user subscription data
        console.log('User subscription:', action.payload);
      })
      .addCase(fetchAllSubscriptionsAsync.pending, (state) => {
        state.subscriptionsLoading = true;
        state.error = null;
      })
      .addCase(fetchAllSubscriptionsAsync.fulfilled, (state, action: PayloadAction<PageableResponse<SubscriptionDetails>>) => {
        state.subscriptionsLoading = false;
        state.subscriptions = action.payload.content;
        state.subscriptionsPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchAllSubscriptionsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.subscriptionsLoading = false;
        state.error = action.payload;
      });

    // Dashboard
    builder
      .addCase(fetchDashboardStatsAsync.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStatsAsync.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStatsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      });

    // Permissions
    builder
      .addCase(fetchUserPermissionsAsync.fulfilled, (state, action: PayloadAction<{ userId: number; permissions: string[] }>) => {
        state.userPermissions[action.payload.userId] = action.payload.permissions;
      })
      .addCase(fetchAllPermissionsAsync.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.permissions = action.payload;
      });

    // Classes
    builder
      .addCase(fetchClassesAsync.pending, (state) => {
        console.log('Redux: fetchClassesAsync.pending')
        state.classesLoading = true;
        state.error = null;
      })
      .addCase(fetchClassesAsync.fulfilled, (state, action: PayloadAction<any>) => {
        console.log('Redux: fetchClassesAsync.fulfilled with payload:', action.payload)
        console.log('Redux: action.payload?.data:', action.payload?.data)
        state.classesLoading = false;
        // API returns array directly from adminService.ts getClasses()
        state.classes = action.payload || [];
        console.log('Redux: state.classes set to:', state.classes)
      })
      .addCase(fetchClassesAsync.rejected, (state, action: PayloadAction<any>) => {
        console.log('Redux: fetchClassesAsync.rejected with error:', action.payload)
        state.classesLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchClassByIdAsync.pending, (state) => {
        state.classesLoading = true;
        state.error = null;
      })
      .addCase(fetchClassByIdAsync.fulfilled, (state, action: PayloadAction<Class>) => {
        state.classesLoading = false;
        state.selectedClass = action.payload;
      })
      .addCase(fetchClassByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.classesLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createClassAsync.pending, (state) => {
        state.creatingClass = true;
        state.error = null;
      })
      .addCase(createClassAsync.fulfilled, (state, action: PayloadAction<Class>) => {
        state.creatingClass = false;
        state.classes.push(action.payload);
        state.classesPagination.totalElements += 1;
      })
      .addCase(createClassAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingClass = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateClassAsync.pending, (state) => {
        state.updatingClass = true;
        state.error = null;
      })
      .addCase(updateClassAsync.fulfilled, (state, action: PayloadAction<Class>) => {
        state.updatingClass = false;
        const index = state.classes.findIndex(classItem => classItem.classId === action.payload.classId);
        if (index !== -1) {
          state.classes[index] = action.payload;
        }
        if (state.selectedClass?.classId === action.payload.classId) {
          state.selectedClass = action.payload;
        }
      })
      .addCase(updateClassAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingClass = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteClassAsync.pending, (state) => {
        state.deletingClass = true;
        state.error = null;
      })
      .addCase(deleteClassAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingClass = false;
        state.classes = state.classes.filter(classItem => classItem.classId !== action.payload);
        state.classesPagination.totalElements -= 1;
        if (state.selectedClass?.classId === action.payload) {
          state.selectedClass = null;
        }
      })
      .addCase(deleteClassAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingClass = false;
        state.error = action.payload;
      });

    // Sections
    builder
      .addCase(fetchSectionsByClassAsync.pending, (state) => {
        state.sectionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSectionsByClassAsync.fulfilled, (state, action: PayloadAction<PageableResponse<Section>>) => {
        state.sectionsLoading = false;
        state.sections = action.payload.content;
        state.sectionsPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchSectionsByClassAsync.rejected, (state, action: PayloadAction<any>) => {
        state.sectionsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchSectionByIdAsync.pending, (state) => {
        state.sectionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSectionByIdAsync.fulfilled, (state, action: PayloadAction<Section>) => {
        state.sectionsLoading = false;
        state.selectedSection = action.payload;
      })
      .addCase(fetchSectionByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.sectionsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createSectionAsync.pending, (state) => {
        state.creatingSection = true;
        state.error = null;
      })
      .addCase(createSectionAsync.fulfilled, (state, action: PayloadAction<Section>) => {
        state.creatingSection = false;
        state.sections.push(action.payload);
        state.sectionsPagination.totalElements += 1;
      })
      .addCase(createSectionAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingSection = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateSectionAsync.pending, (state) => {
        state.updatingSection = true;
        state.error = null;
      })
      .addCase(updateSectionAsync.fulfilled, (state, action: PayloadAction<Section>) => {
        state.updatingSection = false;
        const index = state.sections.findIndex(section => section.sectionId === action.payload.sectionId);
        if (index !== -1) {
          state.sections[index] = action.payload;
        }
        if (state.selectedSection?.sectionId === action.payload.sectionId) {
          state.selectedSection = action.payload;
        }
      })
      .addCase(updateSectionAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingSection = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteSectionAsync.pending, (state) => {
        state.deletingSection = true;
        state.error = null;
      })
      .addCase(deleteSectionAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingSection = false;
        state.sections = state.sections.filter(section => section.sectionId !== action.payload);
        state.sectionsPagination.totalElements -= 1;
        if (state.selectedSection?.sectionId === action.payload) {
          state.selectedSection = null;
        }
      })
      .addCase(deleteSectionAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingSection = false;
        state.error = action.payload;
      });

    // Fees
    builder
      .addCase(fetchFeesAsync.pending, (state) => {
        state.feesLoading = true;
        state.error = null;
      })
      .addCase(fetchFeesAsync.fulfilled, (state, action: PayloadAction<PageableResponse<Fee>>) => {
        state.feesLoading = false;
        state.fees = action.payload.content;
      })
      .addCase(fetchFeesAsync.rejected, (state, action: PayloadAction<any>) => {
        state.feesLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createFeeAsync.pending, (state) => {
        state.creatingFee = true;
        state.error = null;
      })
      .addCase(createFeeAsync.fulfilled, (state, action: PayloadAction<Fee>) => {
        state.creatingFee = false;
        state.fees.push(action.payload);
      })
      .addCase(createFeeAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingFee = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteFeeAsync.pending, (state) => {
        state.deletingFee = true;
        state.error = null;
      })
      .addCase(deleteFeeAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingFee = false;
        state.fees = state.fees.filter(fee => fee.feeId !== action.payload);
      })
      .addCase(deleteFeeAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingFee = false;
        state.error = action.payload;
      });

    // Subjects
    builder
      .addCase(fetchSubjectsAsync.pending, (state) => {
        state.subjectsLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjectsAsync.fulfilled, (state, action: PayloadAction<any>) => {
        state.subjectsLoading = false;
        // API returns data wrapped in: { success, message, data: { records: [...], ... }}
        state.subjects = action.payload?.data?.records || action.payload?.records || [];
      })
      .addCase(fetchSubjectsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.subjectsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchSubjectByIdAsync.pending, (state) => {
        state.subjectsLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjectByIdAsync.fulfilled, (state, action: PayloadAction<Subject>) => {
        state.subjectsLoading = false;
        // Handle individual subject data if needed
      })
      .addCase(fetchSubjectByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.subjectsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createSubjectAsync.pending, (state) => {
        state.creatingSubject = true;
        state.error = null;
      })
      .addCase(createSubjectAsync.fulfilled, (state, action: PayloadAction<Subject>) => {
        state.creatingSubject = false;
        state.subjects.push(action.payload);
      })
      .addCase(createSubjectAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingSubject = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateSubjectAsync.pending, (state) => {
        state.updatingSubject = true;
        state.error = null;
      })
      .addCase(updateSubjectAsync.fulfilled, (state, action: PayloadAction<Subject>) => {
        state.updatingSubject = false;
        const index = state.subjects.findIndex(subject => subject.subjectId === action.payload.subjectId);
        if (index !== -1) {
          state.subjects[index] = action.payload;
        }
      })
      .addCase(updateSubjectAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingSubject = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteSubjectAsync.pending, (state) => {
        state.deletingSubject = true;
        state.error = null;
      })
      .addCase(deleteSubjectAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingSubject = false;
        state.subjects = state.subjects.filter(subject => subject.subjectId !== action.payload);
      })
      .addCase(deleteSubjectAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingSubject = false;
        state.error = action.payload;
      });

    // Sessions
    builder
      .addCase(fetchSessionsAsync.pending, (state) => {
        state.sessionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionsAsync.fulfilled, (state, action: PayloadAction<PageableResponse<Session>>) => {
        state.sessionsLoading = false;
        state.sessions = action.payload.content;
        state.sessionsPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchSessionsAsync.rejected, (state, action: PayloadAction<any>) => {
        state.sessionsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchSessionByIdAsync.pending, (state) => {
        state.sessionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionByIdAsync.fulfilled, (state, action: PayloadAction<Session>) => {
        state.sessionsLoading = false;
        state.selectedSession = action.payload;
      })
      .addCase(fetchSessionByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.sessionsLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createSessionAsync.pending, (state) => {
        state.creatingSession = true;
        state.error = null;
      })
      .addCase(createSessionAsync.fulfilled, (state, action: PayloadAction<Session>) => {
        state.creatingSession = false;
        state.sessions.push(action.payload);
        state.sessionsPagination.totalElements += 1;
      })
      .addCase(createSessionAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingSession = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateSessionAsync.pending, (state) => {
        state.updatingSession = true;
        state.error = null;
      })
      .addCase(updateSessionAsync.fulfilled, (state, action: PayloadAction<Session>) => {
        state.updatingSession = false;
        const index = state.sessions.findIndex(session => session.sessionId === action.payload.sessionId);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.selectedSession?.sessionId === action.payload.sessionId) {
          state.selectedSession = action.payload;
        }
      })
      .addCase(updateSessionAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingSession = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteSessionAsync.pending, (state) => {
        state.deletingSession = true;
        state.error = null;
      })
      .addCase(deleteSessionAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingSession = false;
        state.sessions = state.sessions.filter(session => session.sessionId !== action.payload);
        state.sessionsPagination.totalElements -= 1;
        if (state.selectedSession?.sessionId === action.payload) {
          state.selectedSession = null;
        }
      })
      .addCase(deleteSessionAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingSession = false;
        state.error = action.payload;
      });

    // Fee Structures
    builder
      .addCase(fetchFeeStructuresAsync.pending, (state) => {
        state.feeStructuresLoading = true;
        state.error = null;
      })
      .addCase(fetchFeeStructuresAsync.fulfilled, (state, action: PayloadAction<PageableResponse<FeeStructure>>) => {
        state.feeStructuresLoading = false;
        state.feeStructures = action.payload.content;
        state.feeStructuresPagination = {
          page: action.payload.number,
          size: action.payload.size,
          totalElements: action.payload.totalElements,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchFeeStructuresAsync.rejected, (state, action: PayloadAction<any>) => {
        state.feeStructuresLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchFeeStructureByIdAsync.pending, (state) => {
        state.feeStructuresLoading = true;
        state.error = null;
      })
      .addCase(fetchFeeStructureByIdAsync.fulfilled, (state, action: PayloadAction<FeeStructure>) => {
        state.feeStructuresLoading = false;
        state.selectedFeeStructure = action.payload;
      })
      .addCase(fetchFeeStructureByIdAsync.rejected, (state, action: PayloadAction<any>) => {
        state.feeStructuresLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createFeeStructureAsync.pending, (state) => {
        state.creatingFeeStructure = true;
        state.error = null;
      })
      .addCase(createFeeStructureAsync.fulfilled, (state, action: PayloadAction<FeeStructure>) => {
        state.creatingFeeStructure = false;
        state.feeStructures.push(action.payload);
        state.feeStructuresPagination.totalElements += 1;
      })
      .addCase(createFeeStructureAsync.rejected, (state, action: PayloadAction<any>) => {
        state.creatingFeeStructure = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateFeeStructureAsync.pending, (state) => {
        state.updatingFeeStructure = true;
        state.error = null;
      })
      .addCase(updateFeeStructureAsync.fulfilled, (state, action: PayloadAction<FeeStructure>) => {
        state.updatingFeeStructure = false;
        const index = state.feeStructures.findIndex(feeStructure => feeStructure.feeStructureId === action.payload.feeStructureId);
        if (index !== -1) {
          state.feeStructures[index] = action.payload;
        }
        if (state.selectedFeeStructure?.feeStructureId === action.payload.feeStructureId) {
          state.selectedFeeStructure = action.payload;
        }
      })
      .addCase(updateFeeStructureAsync.rejected, (state, action: PayloadAction<any>) => {
        state.updatingFeeStructure = false;
        state.error = action.payload;
      });

    builder
      .addCase(deleteFeeStructureAsync.pending, (state) => {
        state.deletingFeeStructure = true;
        state.error = null;
      })
      .addCase(deleteFeeStructureAsync.fulfilled, (state, action: PayloadAction<number>) => {
        state.deletingFeeStructure = false;
        state.feeStructures = state.feeStructures.filter(feeStructure => feeStructure.feeStructureId !== action.payload);
        state.feeStructuresPagination.totalElements -= 1;
        if (state.selectedFeeStructure?.feeStructureId === action.payload) {
          state.selectedFeeStructure = null;
        }
      })
      .addCase(deleteFeeStructureAsync.rejected, (state, action: PayloadAction<any>) => {
        state.deletingFeeStructure = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedUser, setSearchTerm, clearError, resetUserState } = adminSlice.actions;

// Export the slice itself for the root store
export { adminSlice };

// Export types
export type AdminRootState = ReturnType<typeof adminSlice.reducer>;

// Configure the store (keep for backward compatibility)
export const adminStore = configureStore({
  reducer: adminSlice.reducer,
});
