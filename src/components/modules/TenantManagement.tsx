import React, { useEffect, useState, useCallback, FC, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchTenantsAsync,
  createTenantAsync,
  updateTenantAsync,
  deleteTenantAsync,
  suspendTenantAsync,
  reactivateTenantAsync,
  setSelectedTenant,
  setSearchTerm,
} from '../Services/superAdminStore';
import { Tenant, TenantCreateData, TenantUpdateData } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

interface TenantFormData {
  tenantName: string;
  domain: string;
  contactEmail: string;
  contactPhone?: string;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial';
}

interface TenantManagementProps {
  // Props can be added here if needed in the future
}

const TenantManagement: FC<TenantManagementProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    tenants,
    tenantsPagination,
    tenantsLoading,
    creatingTenant,
    updatingTenant,
    deletingTenant,
    searchTerm,
    selectedTenant,
    error,
  } = useSelector((state: RootState) => state.superAdmin);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [tenantForm, setTenantForm] = useState<TenantFormData>({
    tenantName: '',
    domain: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionPlan: 'Basic',
    subscriptionStatus: 'trial',
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadTenants();
  }, [currentPage, pageSize, statusFilter]);

  const loadTenants = useCallback(() => {
    dispatch(fetchTenantsAsync({
      page: currentPage,
      size: pageSize,
      search: searchTerm,
      status: statusFilter || undefined
    }));
  }, [dispatch, currentPage, pageSize, searchTerm, statusFilter]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tenantData: TenantCreateData = {
        tenantName: tenantForm.tenantName,
        domain: tenantForm.domain,
        contactEmail: tenantForm.contactEmail,
        contactPhone: tenantForm.contactPhone || undefined,
        subscriptionPlan: tenantForm.subscriptionPlan,
        subscriptionStatus: tenantForm.subscriptionStatus,
      };
      await dispatch(createTenantAsync(tenantData)).unwrap();
      toast.success('Tenant created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadTenants();
    } catch (error: any) {
      toast.error(`Failed to create tenant: ${error}`);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      const tenantData: TenantUpdateData = {
        tenantName: tenantForm.tenantName,
        domain: tenantForm.domain,
        contactEmail: tenantForm.contactEmail,
        contactPhone: tenantForm.contactPhone || undefined,
        subscriptionPlan: tenantForm.subscriptionPlan,
        subscriptionStatus: tenantForm.subscriptionStatus,
      };
      await dispatch(updateTenantAsync({
        tenantId: selectedTenant.tenantId,
        tenantData
      })).unwrap();
      toast.success('Tenant updated successfully!');
      setShowEditModal(false);
      resetForm();
      loadTenants();
    } catch (error: any) {
      toast.error(`Failed to update tenant: ${error}`);
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete tenant "${tenant.tenantName}"? This will permanently remove all associated data.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteTenantAsync(tenant.tenantId)).unwrap();
        toast.success('Tenant deleted successfully!');
        loadTenants();
      } catch (error: any) {
        toast.error(`Failed to delete tenant: ${error}`);
      }
    }
  };

  const handleSuspendTenant = async (tenant: Tenant) => {
    const { value: reason } = await Swal.fire({
      title: 'Suspension Reason',
      input: 'textarea',
      inputPlaceholder: 'Enter reason for suspension...',
      inputValidator: (value) => {
        if (!value) {
          return 'Reason is required!';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Suspend',
      cancelButtonText: 'Cancel',
    });

    if (reason) {
      try {
        await dispatch(suspendTenantAsync({ tenantId: tenant.tenantId, reason })).unwrap();
        toast.success('Tenant suspended successfully!');
        loadTenants();
      } catch (error: any) {
        toast.error(`Failed to suspend tenant: ${error}`);
      }
    }
  };

  const handleReactivateTenant = async (tenant: Tenant) => {
    try {
      await dispatch(reactivateTenantAsync(tenant.tenantId)).unwrap();
      toast.success('Tenant reactivated successfully!');
      loadTenants();
    } catch (error: any) {
      toast.error(`Failed to reactivate tenant: ${error}`);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setTenantForm({
      tenantName: tenant.tenantName,
      domain: tenant.domain,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone || '',
      subscriptionPlan: tenant.subscriptionPlan,
      subscriptionStatus: tenant.subscriptionStatus,
    });
    setShowEditModal(true);
  };

  const resetForm = (): void => {
    setTenantForm({
      tenantName: '',
      domain: '',
      contactEmail: '',
      contactPhone: '',
      subscriptionPlan: 'Basic',
      subscriptionStatus: 'trial',
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchTerm(value));
    setCurrentPage(0);
  };

  const handleStatusFilter = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const plans: string[] = ['Basic', 'Standard', 'Premium', 'Enterprise'];

  const tenantColumns = [
    {
      headerName: 'ID',
      field: 'tenantId',
      width: 80,
      sortable: true,
    },
    {
      headerName: 'Tenant Name',
      field: 'tenantName',
      sortable: true,
    },
    {
      headerName: 'Domain',
      field: 'domain',
      sortable: true,
    },
    {
      headerName: 'Contact Email',
      field: 'contactEmail',
      sortable: true,
    },
    {
      headerName: 'Contact Phone',
      field: 'contactPhone',
      sortable: true,
    },
    {
      headerName: 'Plan',
      field: 'subscriptionPlan',
      sortable: true,
      cellRenderer: (params: any) => {
        const plan = params.value;
        const colorClass =
          plan === 'Basic' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
          plan === 'Standard' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          plan === 'Premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {plan}
          </span>
        );
      },
    },
    {
      headerName: 'Status',
      field: 'subscriptionStatus',
      sortable: true,
      cellRenderer: (params: any) => {
        const status = params.value;
        const colorClass =
          status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          status === 'suspended' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        );
      },
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
      <button
        onClick={() => setShowCreateModal(true)}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Tenant
      </button>
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
        </select>
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        />
      </div>
    </div>
  );

  // Calculate summary stats
  const activeTenants = Array.isArray(tenants) ? tenants.filter((tenant: Tenant) => tenant.subscriptionStatus === 'active').length : 0;
  const suspendedTenants = Array.isArray(tenants) ? tenants.filter((tenant: Tenant) => tenant.subscriptionStatus === 'suspended').length : 0;
  const trialTenants = Array.isArray(tenants) ? tenants.filter((tenant: Tenant) => tenant.subscriptionStatus === 'trial').length : 0;

  return (
    <LoadingOverlay isLoading={tenantsLoading || creatingTenant || updatingTenant || deletingTenant}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Tenant Management</h1>
          <p className="text-sm text-slate-600">Manage multi-tenant operations, subscriptions, and system access</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Active Tenants</h3>
            <div className="text-2xl font-bold">{activeTenants}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">Suspended Tenants</h3>
            <div className="text-2xl font-bold">{suspendedTenants}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Trial Tenants</h3>
            <div className="text-2xl font-bold">{trialTenants}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Total Tenants</h3>
            <div className="text-2xl font-bold">{Array.isArray(tenants) ? tenants.length : 0}</div>
          </div>
        </div>

        <AgGridBox
          title="Tenants"
          columnDefs={tenantColumns}
          rowData={Array.isArray(tenants) ? tenants : []}
          onEdit={handleEditTenant}
          onDelete={handleDeleteTenant}
          toolbar={toolbarButtons}
        />

        {/* Create Tenant Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create New Tenant</h3>
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant Name</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.tenantName}
                    onChange={(e) => setTenantForm({...tenantForm, tenantName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="School/Organization Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.domain}
                    onChange={(e) => setTenantForm({...tenantForm, domain: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="tenant.domain.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={tenantForm.contactEmail}
                    onChange={(e) => setTenantForm({...tenantForm, contactEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={tenantForm.contactPhone}
                    onChange={(e) => setTenantForm({...tenantForm, contactPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                  <select
                    value={tenantForm.subscriptionPlan}
                    onChange={(e) => setTenantForm({...tenantForm, subscriptionPlan: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {plans.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={tenantForm.subscriptionStatus}
                    onChange={(e) => setTenantForm({...tenantForm, subscriptionStatus: e.target.value as 'active' | 'inactive' | 'suspended' | 'trial'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Tenant
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

        {/* Edit Tenant Modal */}
        {showEditModal && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Tenant</h3>
              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant Name</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.tenantName}
                    onChange={(e) => setTenantForm({...tenantForm, tenantName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Domain</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.domain}
                    onChange={(e) => setTenantForm({...tenantForm, domain: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={tenantForm.contactEmail}
                    onChange={(e) => setTenantForm({...tenantForm, contactEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={tenantForm.contactPhone}
                    onChange={(e) => setTenantForm({...tenantForm, contactPhone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                  <select
                    value={tenantForm.subscriptionPlan}
                    onChange={(e) => setTenantForm({...tenantForm, subscriptionPlan: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {plans.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={tenantForm.subscriptionStatus}
                    onChange={(e) => setTenantForm({...tenantForm, subscriptionStatus: e.target.value as 'active' | 'inactive' | 'suspended' | 'trial'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Tenant
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

              {/* Tenant Actions */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 space-y-3">
                {selectedTenant.subscriptionStatus !== 'suspended' && (
                  <button
                    type="button"
                    onClick={() => handleSuspendTenant(selectedTenant)}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                  >
                    Suspend Tenant
                  </button>
                )}
                {selectedTenant.subscriptionStatus === 'suspended' && (
                  <button
                    type="button"
                    onClick={() => handleReactivateTenant(selectedTenant)}
                    className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                  >
                    Reactivate Tenant
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => selectedTenant && handleDeleteTenant(selectedTenant)}
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  Delete Tenant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => toast('Generate tenant reports')}
              className="btn-primary text-sm"
            >
              Export Reports
            </button>
            <button
              onClick={() => toast('Bulk tenant operations')}
              className="btn-secondary text-sm"
            >
              Bulk Operations
            </button>
            <button
              onClick={() => toast('Send tenant notifications')}
              className="btn-secondary text-sm"
            >
              Send Notifications
            </button>
          </div>
        </div>
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default TenantManagement;
