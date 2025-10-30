import React, { useEffect, useState, useCallback, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchModulesAsync,
  fetchRolesAsync,
  createModuleAsync,
  updateModuleAsync,
  deleteModuleAsync,
  toggleModuleStatusAsync,
  setSelectedModule,
  setSearchTerm,
} from '../Services/superAdminStore';
import { Module, ModuleCreateData, ModuleUpdateData, Role } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

interface ModuleFormData {
  moduleName: string;
  description: string;
  icon: string;
  routePath: string;
  orderNo: number;
  assignedRoleIds: number[];
}

interface ModuleManagementProps {
  // Props can be added here if needed in the future
}

const ModuleManagement: FC<ModuleManagementProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    modules,
    modulesPagination,
    modulesLoading,
    creatingModule,
    updatingModule,
    deletingModule,
    searchTerm,
    selectedModule,
    roles,
    rolesLoading,
    error,
  } = useSelector((state: RootState) => state.superAdmin);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>({
    moduleName: '',
    description: '',
    icon: '',
    routePath: '',
    orderNo: 1,
    assignedRoleIds: [],
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);


  useEffect(() => {
    if (!modulesLoading) {
      dispatch(fetchModulesAsync({ page: currentPage, size: pageSize, search: searchTerm }));
    }
    if (!rolesLoading && (!roles || roles.length === 0)) {
      dispatch(fetchRolesAsync({ page: 0, size: 100 }));
    }
  }, [dispatch, currentPage, pageSize, searchTerm, rolesLoading, roles]);

  const loadModules = useCallback(() => {
    dispatch(fetchModulesAsync({ page: currentPage, size: pageSize, search: searchTerm }));
  }, [dispatch, currentPage, pageSize, searchTerm]);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const moduleData: ModuleCreateData = {
        moduleName: moduleForm.moduleName.trim(),
        description: moduleForm.description.trim(),
        icon: moduleForm.icon.trim() || '🧩',
        routePath: moduleForm.routePath.trim() || `/${moduleForm.moduleName.toLowerCase().replace(/\s+/g, '-')}`,
        orderNo: moduleForm.orderNo || 1,
        assignedRoleIds: moduleForm.assignedRoleIds,
      };
      await dispatch(createModuleAsync(moduleData)).unwrap();
      toast.success('Module created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadModules();
    } catch (error: any) {
      toast.error(`Failed to create module: ${error}`);
    }
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    try {
      const moduleData: ModuleUpdateData = {
        moduleName: moduleForm.moduleName.trim(),
        description: moduleForm.description.trim(),
        icon: moduleForm.icon.trim() || '🧩',
        routePath: moduleForm.routePath.trim() || `/${moduleForm.moduleName.toLowerCase().replace(/\s+/g, '-')}`,
        orderNo: moduleForm.orderNo || 1,
        isActive: selectedModule.isActive,
        assignedRoleIds: moduleForm.assignedRoleIds,
      };
      await dispatch(updateModuleAsync({
        moduleId: selectedModule.moduleId,
        moduleData
      })).unwrap();
      toast.success('Module updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadModules();
    } catch (error: any) {
      toast.error(`Failed to update module: ${error}`);
    }
  };

  const handleDeleteModule = async (module: Module) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete module "${module.moduleName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteModuleAsync(module.moduleId)).unwrap();
        toast.success('Module deleted successfully!');
        loadModules();
      } catch (error: any) {
        toast.error(`Failed to delete module: ${error}`);
      }
    }
  };

  const handleToggleModuleStatus = async (module: Module) => {
    try {
      await dispatch(toggleModuleStatusAsync({ moduleId: module.moduleId, isEnabled: !module.isActive })).unwrap();
      toast.success(`Module ${module.isActive ? 'disabled' : 'enabled'} successfully!`);
      loadModules();
    } catch (error: any) {
      toast.error(`Failed to ${module.isActive ? 'disable' : 'enable'} module: ${error}`);
    }
  };

  const handleEditModule = (module: Module) => {
    dispatch(setSelectedModule(module));
    setModuleForm({
      moduleName: module.moduleName,
      description: module.description,
      icon: module.icon || '',
      routePath: module.routePath || '',
      orderNo: module.orderNo || 1,
      assignedRoleIds: Array.isArray(module.assignedRoleIds) ? module.assignedRoleIds : [],
    });
    setShowEditModal(true);
  };

  const resetForm = (): void => {
    setModuleForm({
      moduleName: '',
      description: '',
      icon: '',
      routePath: '',
      orderNo: 1,
      assignedRoleIds: [],
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchTerm(value));
    setCurrentPage(0);
  };



  const moduleColumns = [
    {
      headerName: 'ID',
      field: 'moduleId',
      width: 80,
      sortable: true,
    },
    {
      headerName: 'Module Name',
      field: 'moduleName',
      sortable: true,
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="max-w-xs truncate" title={params.value}>
          {params.value}
        </div>
      ),
    },
    {
      headerName: 'Icon',
      field: 'icon',
      width: 80,
      cellRenderer: (params: any) => (
        <div className="text-lg">{params.value || '🧩'}</div>
      ),
    },
    {
      headerName: 'Route Path',
      field: 'routePath',
      sortable: true,
    },
    {
      headerName: 'Assigned Roles',
      field: 'assignedRoleIds',
      valueFormatter: (params: any) => getRoleNames(params.value),
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="max-w-xs truncate" title={getRoleNames(params.value)}>
          {getRoleNames(params.value)}
        </div>
      ),
    },
    {
      headerName: 'Status',
      field: 'isActive',
      sortable: true,
      cellRenderer: (params: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          params.value
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      headerName: 'Created',
      field: 'createdOn',
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      sortable: true,
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowCreateModal(true)}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Module
      </button>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search modules..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
    </div>
  );

  const getRoleNames = (roleIds: number[]): string => {
    if (!roleIds || roleIds.length === 0) return 'No roles assigned';
    const roleNames = roleIds.map(id => {
      const role = roles?.find((r: Role) => r.roleId === id);
      return role ? role.roleName : `Role ${id}`;
    });
    return roleNames.join(', ');
  };

  return (
    <LoadingOverlay isLoading={modulesLoading || rolesLoading || creatingModule || updatingModule || deletingModule}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Module Management</h1>
          <p className="text-sm text-slate-600">Create, edit, and manage system modules and their permissions</p>
        </div>

        <AgGridBox
          title="System Modules"
          columnDefs={moduleColumns}
          rowData={Array.isArray(modules) ? modules : []}
          onEdit={handleEditModule}
          onDelete={handleDeleteModule}
          toolbar={toolbarButtons}
        />

        {/* Create Module Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New Module</h3>
              <form onSubmit={handleCreateModule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Module Name</label>
                  <input
                    type="text"
                    required
                    value={moduleForm.moduleName}
                    onChange={(e) => setModuleForm({...moduleForm, moduleName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g., UserManagement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={2}
                    placeholder="Describe the module's purpose"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      value={moduleForm.icon}
                      onChange={(e) => setModuleForm({...moduleForm, icon: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="🧩 (emoji or icon)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Number</label>
                    <input
                      type="number"
                      value={moduleForm.orderNo}
                      onChange={(e) => setModuleForm({...moduleForm, orderNo: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Route Path</label>
                  <input
                    type="text"
                    value={moduleForm.routePath}
                    onChange={(e) => setModuleForm({...moduleForm, routePath: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="/module-path (auto-generated if empty)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assigned Roles</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {roles?.map((role: Role) => (
                        <label key={role.roleId} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={moduleForm.assignedRoleIds.includes(role.roleId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setModuleForm({
                                  ...moduleForm,
                                  assignedRoleIds: [...moduleForm.assignedRoleIds, role.roleId]
                                });
                              } else {
                                setModuleForm({
                                  ...moduleForm,
                                  assignedRoleIds: moduleForm.assignedRoleIds.filter(id => id !== role.roleId)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{role.roleName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Module
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

        {/* Edit Module Modal */}
        {showEditModal && selectedModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit Module</h3>
              <form onSubmit={handleUpdateModule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Module Name</label>
                  <input
                    type="text"
                    required
                    value={moduleForm.moduleName}
                    onChange={(e) => setModuleForm({...moduleForm, moduleName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      value={moduleForm.icon}
                      onChange={(e) => setModuleForm({...moduleForm, icon: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="🧩 (emoji or icon)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Number</label>
                    <input
                      type="number"
                      value={moduleForm.orderNo}
                      onChange={(e) => setModuleForm({...moduleForm, orderNo: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Route Path</label>
                  <input
                    type="text"
                    value={moduleForm.routePath}
                    onChange={(e) => setModuleForm({...moduleForm, routePath: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="/module-path (auto-generated if empty)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assigned Roles</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {roles?.map((role: Role) => (
                        <label key={role.roleId} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={moduleForm.assignedRoleIds.includes(role.roleId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setModuleForm({
                                  ...moduleForm,
                                  assignedRoleIds: [...moduleForm.assignedRoleIds, role.roleId]
                                });
                              } else {
                                setModuleForm({
                                  ...moduleForm,
                                  assignedRoleIds: moduleForm.assignedRoleIds.filter(id => id !== role.roleId)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{role.roleName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Module
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
                  onClick={() => selectedModule && handleToggleModuleStatus(selectedModule)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                    selectedModule.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {selectedModule.isActive ? 'Disable Module' : 'Enable Module'}
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

export default ModuleManagement;
