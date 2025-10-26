import React, { useEffect, useState, useCallback, FC, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchSubscriptionPlansAsync,
  fetchSubscriptionPlanByIdAsync,
  createSubscriptionPlanAsync,
  updateSubscriptionPlanAsync,
  deleteSubscriptionPlanAsync,
} from '../Services/superAdminStore';
import { SubscriptionPlan, SubscriptionPlanCreateData, SubscriptionPlanUpdateData } from '../Services/superAdminService';
import { AppDispatch, RootState } from '../../store';

const SubscriptionPlans: FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { subscriptionPlans, subscriptionPlansLoading } = useSelector(
    (state: RootState) => state.superAdmin
  );

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<SubscriptionPlan | null>(null);
  const [loadingView, setLoadingView] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<SubscriptionPlanCreateData>({
    planId: 0,
    planName: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    customMonths: 0,
    isActive: true,
  });
  const [editForm, setEditForm] = useState<SubscriptionPlanUpdateData>({
    planName: '',
    description: '',
    price: undefined,
    billingCycle: undefined,
    customMonths: undefined,
    isActive: undefined,
  });

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = useCallback(() => {
    dispatch(fetchSubscriptionPlansAsync({ page: 0, size: 1000 }));
  }, [dispatch]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await dispatch(createSubscriptionPlanAsync(createForm)).unwrap();
      toast.success('Subscription plan created successfully!');
      setShowCreateModal(false);
      resetCreateForm();
      loadSubscriptionPlans();
    } catch (error: any) {
      toast.error(`Failed to create plan: ${error}`);
    }
  };

  const handleEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const result = await dispatch(updateSubscriptionPlanAsync({
        planId: editingPlan.planId,
        planData: editForm,
      })).unwrap();
      toast.success('Subscription plan updated successfully!');
      setShowEditModal(false);
      setEditingPlan(null);
      resetEditForm();
      loadSubscriptionPlans();
    } catch (error: any) {
      toast.error(`Failed to update plan: ${error}`);
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete subscription plan "${plan.planName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteSubscriptionPlanAsync(plan.planId)).unwrap();
        toast.success('Subscription plan deleted successfully!');
        loadSubscriptionPlans();
      } catch (error: any) {
        toast.error(`Failed to delete plan: ${error}`);
      }
    }
  };

  const handleEditClick = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditForm({
      planName: plan.planName,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      customMonths: plan.customMonths,
      isActive: plan.isActive,
    });
    setShowEditModal(true);
  };

  const handleViewClick = async (plan: SubscriptionPlan) => {
    setLoadingView(true);
    try {
      const planDetails = await dispatch(fetchSubscriptionPlanByIdAsync(plan.planId)).unwrap();
      setViewingPlan(planDetails);
      setShowViewModal(true);
    } catch (error: any) {
      toast.error(`Failed to load plan details: ${error}`);
    } finally {
      setLoadingView(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      planName: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      customMonths: undefined,
      isActive: true,
    });
  };

  const resetEditForm = () => {
    setEditForm({
      planName: '',
      description: '',
      price: undefined,
      billingCycle: undefined,
      customMonths: undefined,
      isActive: undefined,
    });
  };

  const billingCycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' },
  ];

  const subscriptionPlanColumns = [
    {
      headerName: 'Plan ID',
      field: 'planId',
      width: 100,
      sortable: true,
    },
    {
      headerName: 'Plan Name',
      field: 'planName',
      sortable: true,
      cellRenderer: (params: any) => (
        <span className="font-medium text-slate-900 dark:text-slate-100">
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Description',
      field: 'description',
      cellRenderer: (params: any) => (
        <span className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {params.value}
        </span>
      ),
    },
    {
      headerName: 'Price',
      field: 'price',
      sortable: true,
      cellRenderer: (params: any) => {
        const price = params.value;
        return (
          <span className="font-semibold text-green-600">
            ₹{price ? price.toLocaleString() : '0'}
          </span>
        );
      },
    },
    {
      headerName: 'Billing Cycle',
      field: 'billingCycle',
      sortable: true,
      cellRenderer: (params: any) => {
        const cycle = params.value;
        return (
          <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
            {cycle}
          </span>
        );
      },
    },
    {
      headerName: 'Custom Months',
      field: 'customMonths',
      cellRenderer: (params: any) => (
        <span>{params.value || '-'}</span>
      ),
    },
    {
      headerName: 'Status',
      field: 'isActive',
      sortable: true,
      cellRenderer: (params: any) => {
        const isActive = params.value;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
  ];

  const toolbarButtons = (
    <button
      onClick={() => setShowCreateModal(true)}
      className="btn-primary text-sm flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Create Plan
    </button>
  );

  // Calculate summary stats
  const activePlans = subscriptionPlans?.filter((plan: SubscriptionPlan) => plan.isActive) || [];
  const totalPlans = subscriptionPlans?.length || 0;
  const averagePrice = activePlans.length > 0
    ? activePlans.reduce((sum: number, plan: SubscriptionPlan) => sum + plan.price, 0) / activePlans.length
    : 0;

  return (
    <LoadingOverlay isLoading={subscriptionPlansLoading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Create and manage subscription plans for your tenants
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Total Plans</h3>
            <div className="text-2xl font-bold">{totalPlans}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Active Plans</h3>
            <div className="text-2xl font-bold">{activePlans.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-600 mb-2">Average Price</h3>
            <div className="text-2xl font-bold">₹{averagePrice.toFixed(0)}</div>
          </div>
        </div>

        <AgGridBox
          title="Subscription Plans"
          columnDefs={subscriptionPlanColumns}
          rowData={subscriptionPlans || []}
          onView={handleViewClick}
          onEdit={handleEditClick}
          onDelete={handleDeletePlan}
          toolbar={toolbarButtons}
        />

        {/* Create Plan Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">Create Subscription Plan</h3>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.planName}
                    onChange={(e) => setCreateForm({...createForm, planName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="e.g., Basic Plan, Premium Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={3}
                    placeholder="Describe the plan features..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({...createForm, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Cycle *</label>
                  <select
                    required
                    value={createForm.billingCycle}
                    onChange={(e) => {
                      const billingCycle = e.target.value as 'monthly' | 'quarterly' | 'yearly' | 'custom';
                      setCreateForm({
                        ...createForm,
                        billingCycle,
                        customMonths: billingCycle !== 'custom' ? undefined : createForm.customMonths
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    {billingCycleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {createForm.billingCycle === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Months *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={createForm.customMonths}
                      onChange={(e) => setCreateForm({
                        ...createForm,
                        customMonths: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                      placeholder="e.g., 6 for 6 months"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActiveCreate"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm({...createForm, isActive: e.target.checked})}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="isActiveCreate" className="text-sm font-medium">
                    Active plan
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
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

        {/* Edit Plan Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Subscription Plan</h3>
              <form onSubmit={handleEditPlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editForm.planName}
                    onChange={(e) => setEditForm({...editForm, planName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price || ''}
                    onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || undefined})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                  <select
                    value={editForm.billingCycle || ''}
                    onChange={(e) => {
                      const billingCycle = e.target.value as 'monthly' | 'quarterly' | 'yearly' | 'custom';
                      setEditForm({
                        ...editForm,
                        billingCycle,
                        customMonths: billingCycle !== 'custom' ? editForm.customMonths : editForm.customMonths
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Keep current</option>
                    {billingCycleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(editForm.billingCycle === 'custom' || editingPlan?.billingCycle === 'custom') && editForm.billingCycle !== undefined && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom Months</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={editForm.customMonths || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        customMonths: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={editForm.isActive !== undefined ? editForm.isActive : editingPlan?.isActive}
                    onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="isActiveEdit" className="text-sm font-medium">
                    Active plan
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPlan(null);
                      resetEditForm();
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

        {/* View Plan Modal */}
        {showViewModal && viewingPlan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <LoadingOverlay isLoading={loadingView}>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Subscription Plan Details</h3>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewingPlan(null);
                    }}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all duration-200"
                    title="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {viewingPlan.planName}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-semibold">
                      Plan ID: #{viewingPlan.planId}
                    </p>
                  </div>

                  {/* Price & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border shadow-sm">
                      <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Price</h5>
                      <p className="text-2xl font-bold text-green-600">₹{(viewingPlan.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border shadow-sm">
                      <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Status</h5>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewingPlan.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {viewingPlan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Billing Details */}
                  <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border shadow-sm">
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Billing Configuration</h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Billing Cycle:</span>
                        <span className="font-medium capitalize px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs">
                          {viewingPlan.billingCycle}
                        </span>
                      </div>
                      {viewingPlan.billingCycle === 'custom' && viewingPlan.customMonths && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Custom Period:</span>
                          <span className="font-medium">{viewingPlan.customMonths} months</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border shadow-sm">
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Description</h5>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {viewingPlan.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Close Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setViewingPlan(null);
                      }}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </LoadingOverlay>
          </div>
        )}
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default SubscriptionPlans;
