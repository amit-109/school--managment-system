import React, { useEffect, useState, useCallback, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import { AppDispatch, RootState } from '../../store';
import { usePermissions } from '../Auth/usePermissions';
import {
  fetchUsersAsync,
  createUserAsync,
  updateUserAsync,
  deleteUserAsync,
  toggleUserStatusAsync,
  setSelectedUser,
  setSearchTerm,

} from '../Services/adminStore';
import { User, UserUpdateData } from '../Services/adminService';

interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  role: 'admin' | 'operator' | 'user';
}

interface UserManagementProps {
  // Props can be added here if needed in the future
}

const UserManagement: FC<UserManagementProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { canCreate, canUpdate, canDelete, canRead } = usePermissions();
  const {
    users,
    usersPagination,
    usersLoading,
    creatingUser,
    updatingUser,
    deletingUser,
    searchTerm,
    selectedUser,
    error,
  } = useSelector((state: RootState) => state.admin);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    role: 'user',
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    console.log('UserManagement: Loading users...');
    loadUsers();
  }, [currentPage, pageSize, searchTerm]);

  // Add authentication check
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    console.log('UserManagement: Auth status changed:', isAuthenticated);
    if (!isAuthenticated) {
      console.log('UserManagement: Not authenticated, component should not render');
    }
  }, [isAuthenticated]);

  const loadUsers = useCallback(() => {
    console.log('UserManagement: Calling fetchUsersAsync with params:', {
      page: currentPage,
      size: pageSize,
      search: searchTerm
    });
    dispatch(fetchUsersAsync({
      page: currentPage,
      size: pageSize,
      search: searchTerm || undefined
    }));
  }, [dispatch, currentPage, pageSize, searchTerm]);

  useEffect(() => {
    console.log('UserManagement: Component mounted, state:', {
      usersLoading,
      creatingUser,
      updatingUser,
      users: Array.isArray(users) ? users.length : 'not array',
      error
    });
  }, [usersLoading, creatingUser, updatingUser, users, error]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(createUserAsync(userForm)).unwrap();
      toast.success('User created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(`Failed to create user: ${error}`);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const userData: UserUpdateData = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        phone: userForm.phone || undefined,
        role: userForm.role,
      };
      await dispatch(updateUserAsync({
        userId: selectedUser.id,
        userData
      })).unwrap();
      toast.success('User updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(`Failed to update user: ${error}`);
    }
  };

  const handleDeleteUser = useCallback(async (user: User) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete user "${user.firstName} ${user.lastName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteUserAsync(user.id)).unwrap();
        toast.success('User deleted successfully!');
        loadUsers();
      } catch (error: any) {
        toast.error(`Failed to delete user: ${error}`);
      }
    }
  }, [dispatch, loadUsers]);

  const handleToggleUserStatus = async (user: User) => {
    try {
      await dispatch(toggleUserStatusAsync({ userId: user.id, isActive: !user.isActive })).unwrap();
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`);
      loadUsers();
    } catch (error: any) {
      toast.error(`Failed to ${user.isActive ? 'deactivate' : 'activate'} user: ${error}`);
    }
  };

  const handleEditUser = useCallback((user: User) => {
    dispatch(setSelectedUser(user));
    setUserForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      password: '',
      role: user.role,
    });
    setShowEditModal(true);
  }, [dispatch]);

  const resetForm = (): void => {
    setUserForm({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      role: 'user',
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchTerm(value));
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const userColumns = [
    {
      headerName: 'ID',
      field: 'id',
      width: 80,
      sortable: true,
    },
    {
      headerName: 'Name',
      field: 'firstName',
      valueFormatter: (params: any) => `${params.data.firstName} ${params.data.lastName}`,
      sortable: true,
    },
    {
      headerName: 'Username',
      field: 'username',
      sortable: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      sortable: true,
    },
    {
      headerName: 'Role',
      field: 'role',
      cellClass: 'capitalize',
      sortable: true,
      cellRenderer: (params: any) => {
        const role = params.value;
        const colorClass =
          role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          role === 'operator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {role}
          </span>
        );
      },
    },
    {
      headerName: 'Status',
      field: 'isActive',
      cellRenderer: (params: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      ),
      sortable: true,
    },
    {
      headerName: 'Created',
      field: 'createdAt',
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      sortable: true,
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-3">
      {canCreate('UserManagement') && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
    </div>
  );

  return (
    <LoadingOverlay isLoading={usersLoading || creatingUser || updatingUser || deletingUser}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-slate-600">Create, edit, and manage user accounts and permissions</p>
        </div>

        <AgGridBox
          title="Users"
          columnDefs={userColumns}
          rowData={Array.isArray(users) ? users : []}
          onEdit={canUpdate('UserManagement') ? handleEditUser : undefined}
          onDelete={canDelete('UserManagement') ? handleDeleteUser : undefined}
          toolbar={toolbarButtons}
        />

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New User</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as 'admin' | 'operator' | 'user'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="user">User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit User</h3>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as 'admin' | 'operator' | 'user'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="user">User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <button
                  type="button"
                  onClick={() => selectedUser && handleToggleUserStatus(selectedUser)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                    selectedUser.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {selectedUser.isActive ? 'Deactivate User' : 'Activate User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default UserManagement;
