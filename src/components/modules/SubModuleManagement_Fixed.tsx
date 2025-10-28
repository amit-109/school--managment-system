import React, { useEffect, useState, useCallback, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchSubModulesAsync,
  fetchModulesAsync,
  fetchRolesAsync,
  createSubModuleAsync,
  updateSubModuleAsync,
  deleteSubModuleAsync,
} from '../Services/superAdminStore';
import { SubModule, SubModuleCreateData, SubModuleUpdateData, Module, Role } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

interface SubModuleFormData {
  moduleId: number;
  subModuleName: string;
  description: string;
  routePath: string;
  orderNo: number;
  isActive: boolean;
  assignedRoleIds: number[];
}

const SubModuleManagement: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    subModules,
    modules,
    roles,
    subModulesLoading,
    modulesLoading,
    rolesLoading,
    creatingSubModule,
    updatingSubModule,
    deletingSubModule,
  } = useSelector((state: RootState) => state.superAdmin);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedSubModule, setSelectedSubModule] = useState<SubModule | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [subModuleForm, setSubModuleForm] = useState<SubModuleFormData>({
    moduleId: 0,
    subModuleName: '',
    description: '',
    routePath: '',
    orderNo: 1,
    isActive: true,
    assignedRoleIds: [],
  });

  useEffect(() => {
    if (!subModulesLoading) {
      dispatch(fetchSubModulesAsync({ page: currentPage, size: pageSize }));
    }
    if (!modulesLoading && (!modules || modules.length === 0)) {
      dispatch(fetchModulesAsync({ page: 0, size: 100 }));
    }
    if (!rolesLoading && (!roles || roles.length === 0)) {
      dispatch(fetchRolesAsync({ page: 0, size: 100 }));
    }
  }, [dispatch, currentPage, pageSize]);

  const loadSubModules = useCallback(() => {
    dispatch(fetchSubModulesAsync({ page: currentPage, size: pageSize }));
  }, [dispatch, currentPage, pageSize]);

  const handleCreateSubModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (subModuleForm.moduleId === 0) {
      toast.error('Please select a module');
      return;
    }
    
    if (!subModuleForm.subModuleName.trim()) {
      toast.error('SubModule name is required');
      return;
    }
    
    if (!subModuleForm.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    try {
      const subModuleData: SubModuleCreateData = {
        moduleId: subModuleForm.moduleId,
        subModuleName: subModuleForm.subModuleName.trim(),
        description: subModuleForm.description.trim(),
        routePath: subModuleForm.routePath.trim() || `/submodule/${subModuleForm.subModuleName.toLowerCase().replace(/\s+/g, '-')}`,
        orderNo: subModuleForm.orderNo || 1,
        isActive: subModuleForm.isActive,
        assignedRoleIds: subModuleForm.assignedRoleIds || [],
      };
      
      console.log('Creating SubModule with data:', subModuleData);
      await dispatch(createSubModuleAsync(subModuleData)).unwrap();
      toast.success('SubModule created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadSubModules();
    } catch (error: any) {
      console.error('SubModule creation error:', error);
      toast.error(`Failed to create submodule: ${error}`);
    }
  };

  const handleUpdateSubModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubModule) return;
    
    // Validation
    if (subModuleForm.moduleId === 0) {
      toast.error('Please select a module');
      return;
    }
    
    if (!subModuleForm.subModuleName.trim()) {
      toast.error('SubModule name is required');
      return;
    }
    
    if (!subModuleForm.description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      const subModuleData: SubModuleUpdateData = {
        subModuleId: selectedSubModule.subModuleId,
        moduleId: subModuleForm.moduleId,
        subModuleName: subModuleForm.subModuleName.trim(),
        description: subModuleForm.description.trim(),
        routePath: subModuleForm.routePath.trim() || `/submodule/${subModuleForm.subModuleName.toLowerCase().replace(/\s+/g, '-')}`,
        orderNo: subModuleForm.orderNo || 1,
        isActive: subModuleForm.isActive,
        createdOn: selectedSubModule.createdOn,
        assignedRoleIds: subModuleForm.assignedRoleIds || [],
      };
      
      console.log('Updating SubModule with data:', subModuleData);
      await dispatch(updateSubModuleAsync({
        subModuleId: selectedSubModule.subModuleId,
        subModuleData
      })).unwrap();
      toast.success('SubModule updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadSubModules();
    } catch (error: any) {
      console.error('SubModule update error:', error);
      toast.error(`Failed to update submodule: ${error}`);
    }
  };

  const handleDeleteSubModule = async (subModule: SubModule) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete submodule "${subModule.subModuleName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteSubModuleAsync(subModule.subModuleId)).unwrap();
        toast.success('SubModule deleted successfully!');
        loadSubModules();
      } catch (error: any) {
        toast.error(`Failed to delete submodule: ${error}`);
      }
    }
  };

  const handleEditSubModule = (subModule: SubModule) => {
    setSelectedSubModule(subModule);
    setSubModuleForm({
      moduleId: subModule.moduleId,
      subModuleName: subModule.subModuleName,
      description: subModule.description,
      routePath: subModule.routePath,
      orderNo: subModule.orderNo,
      isActive: subModule.isActive,
      assignedRoleIds: subModule.assignedRoleIds || [],
    });
    setShowEditModal(true);
  };

  const resetForm = (): void => {
    setSubModuleForm({
      moduleId: 0,
      subModuleName: '',
      description: '',
      routePath: '',
      orderNo: 1,
      isActive: true,
      assignedRoleIds: [],
    });
    setSelectedSubModule(null);
  };

  const getModuleName = (moduleId: number): string => {
    const module = modules?.find((m: Module) => m.moduleId === moduleId);
    return module ? module.moduleName : 'Unknown Module';
  };

  const getRoleNames = (roleIds: number[]): string => {
    if (!roleIds || roleIds.length === 0) return 'No roles assigned';
    const roleNames = roleIds.map(id => {
      const role = roles?.find((r: Role) => r.roleId === id);
      return role ? role.roleName : `Role ${id}`;
    });
    return roleNames.join(', ');
  };

  const subModuleColumns = [
    {
      headerName: 'ID',
      field: 'subModuleId',
      width: 80,
      sortable: true,
    },
    {
      headerName: 'Module',
      field: 'moduleId',
      valueFormatter: (params: any) => getModuleName(params.value),
      sortable: true,
    },
    {
      headerName: 'SubModule Name',
      field: 'subModuleName',
      sortable: true,
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: true,
    },
    {
      headerName: 'Route Path',
      field: 'routePath',
      sortable: true,
    },
    {
      headerName: 'Order',
      field: 'orderNo',
      width: 80,
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
        Add SubModule
      </button>
      <button
        onClick={() => loadSubModules()}
        className="btn-secondary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  );

  return (
    <LoadingOverlay isLoading={subModulesLoading || creatingSubModule || updatingSubModule || deletingSubModule}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">SubModule Management</h1>
          <p className="text-sm text-slate-600">Create, edit, and manage system submodules</p>
        </div>

        <AgGridBox
          title="System SubModules"
          columnDefs={subModuleColumns}
          rowData={Array.isArray(subModules) ? subModules : []}
          onEdit={handleEditSubModule}
          onDelete={handleDeleteSubModule}
          toolbar={toolbarButtons}
        />

        {/* Create SubModule Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Create New SubModule</h3>
              <form onSubmit={handleCreateSubModule} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Module</label>
                    <select
                      required
                      value={subModuleForm.moduleId}
                      onChange={(e) => setSubModuleForm({...subModuleForm, moduleId: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value={0}>Select Module</option>
                      {modules?.map((module: Module) => (
                        <option key={module.moduleId} value={module.moduleId}>
                          {module.moduleName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SubModule Name</label>
                    <input
                      type="text"
                      required
                      value={subModuleForm.subModuleName}
                      onChange={(e) => setSubModuleForm({...subModuleForm, subModuleName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., User List"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={subModuleForm.description}
                    onChange={(e) => setSubModuleForm({...subModuleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={2}
                    placeholder="Describe the submodule's purpose"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Route Path</label>
                    <input
                      type="text"
                      value={subModuleForm.routePath}
                      onChange={(e) => setSubModuleForm({...subModuleForm, routePath: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., /users/list (auto-generated if empty)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Number</label>
                    <input
                      type="number"
                      value={subModuleForm.orderNo}
                      onChange={(e) => setSubModuleForm({...subModuleForm, orderNo: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assigned Roles</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {roles?.map((role: Role) => (
                        <label key={role.roleId} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subModuleForm.assignedRoleIds.includes(role.roleId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubModuleForm({
                                  ...subModuleForm,
                                  assignedRoleIds: [...subModuleForm.assignedRoleIds, role.roleId]
                                });
                              } else {
                                setSubModuleForm({
                                  ...subModuleForm,
                                  assignedRoleIds: subModuleForm.assignedRoleIds.filter(id => id !== role.roleId)
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
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={subModuleForm.isActive}
                    onChange={(e) => setSubModuleForm({...subModuleForm, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create SubModule
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

        {/* Edit SubModule Modal */}
        {showEditModal && selectedSubModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Edit SubModule</h3>
              <form onSubmit={handleUpdateSubModule} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Module</label>
                    <select
                      required
                      value={subModuleForm.moduleId}
                      onChange={(e) => setSubModuleForm({...subModuleForm, moduleId: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value={0}>Select Module</option>
                      {modules?.map((module: Module) => (
                        <option key={module.moduleId} value={module.moduleId}>
                          {module.moduleName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">SubModule Name</label>
                    <input
                      type="text"
                      required
                      value={subModuleForm.subModuleName}
                      onChange={(e) => setSubModuleForm({...subModuleForm, subModuleName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    required
                    value={subModuleForm.description}
                    onChange={(e) => setSubModuleForm({...subModuleForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Route Path</label>
                    <input
                      type="text"
                      value={subModuleForm.routePath}
                      onChange={(e) => setSubModuleForm({...subModuleForm, routePath: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., /users/list (auto-generated if empty)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Number</label>
                    <input
                      type="number"
                      value={subModuleForm.orderNo}
                      onChange={(e) => setSubModuleForm({...subModuleForm, orderNo: parseInt(e.target.value) || 1})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assigned Roles</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {roles?.map((role: Role) => (
                        <label key={role.roleId} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subModuleForm.assignedRoleIds.includes(role.roleId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubModuleForm({
                                  ...subModuleForm,
                                  assignedRoleIds: [...subModuleForm.assignedRoleIds, role.roleId]
                                });
                              } else {
                                setSubModuleForm({
                                  ...subModuleForm,
                                  assignedRoleIds: subModuleForm.assignedRoleIds.filter(id => id !== role.roleId)
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
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={subModuleForm.isActive}
                    onChange={(e) => setSubModuleForm({...subModuleForm, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="editIsActive" className="text-sm font-medium">Active</label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update SubModule
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
            </div>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default SubModuleManagement;