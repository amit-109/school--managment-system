import React, { useEffect, useState, useCallback, FC, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import AgGridBox from '../shared/AgGridBox';
import LoadingOverlay from '../shared/LoadingOverlay';
import {
  fetchAllSubscriptionsAsync,
  fetchUsersAsync,
  updateUserSubscriptionAsync,
} from '../Services/adminStore';
import { SubscriptionDetails, User } from '../Services/adminService';
import { AppDispatch, RootState } from '../../store';

interface SubscriptionFormData {
  userId: number;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  price: number;
}

interface SubscriptionManagementProps {
  // Props can be added here if needed in the future
}

const SubscriptionManagement: FC<SubscriptionManagementProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    subscriptions,
    subscriptionsPagination,
    users,
    subscriptionsLoading,
    usersLoading,
  } = useSelector((state: RootState) => state.admin);

  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionFormData>({
    userId: 0,
    planName: '',
    status: 'active',
    billingCycle: 'monthly',
    price: 0,
  });

  useEffect(() => {
    loadSubscriptions();
    loadUsers();
  }, [currentPage, pageSize, statusFilter]);

  const loadSubscriptions = useCallback(() => {
    dispatch(fetchAllSubscriptionsAsync({
      page: currentPage,
      size: pageSize,
      status: statusFilter || undefined
    }));
  }, [dispatch, currentPage, pageSize, statusFilter]);

  const loadUsers = useCallback(() => {
    dispatch(fetchUsersAsync({ page: 0, size: 1000 })); // Load all users for reference
  }, [dispatch]);

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscriptionForm.userId) return;

    try {
      await dispatch(updateUserSubscriptionAsync({
        userId: subscriptionForm.userId,
        subscriptionData: {
          planName: subscriptionForm.planName,
          status: subscriptionForm.status,
          billingCycle: subscriptionForm.billingCycle,
          price: subscriptionForm.price,
        }
      })).unwrap();
      toast.success('Subscription updated successfully!');
      setShowUpdateModal(false);
      resetForm();
      loadSubscriptions();
    } catch (error: any) {
      toast.error(`Failed to update subscription: ${error}`);
    }
  };

  const handleEditSubscription = (subscription: SubscriptionDetails) => {
    setSubscriptionForm({
      userId: subscription.userId,
      planName: subscription.planName,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      price: subscription.price,
    });
    setShowUpdateModal(true);
  };

  const getUserName = (userId: number): string => {
    if (!Array.isArray(users)) return 'Unknown User';
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getUserEmail = (userId: number): string => {
    if (!Array.isArray(users)) return 'Unknown Email';
    const user = users.find((u: User) => u.id === userId);
    return user ? user.email : 'Unknown Email';
  };

  const resetForm = (): void => {
    setSubscriptionForm({
      userId: 0,
      planName: '',
      status: 'active',
      billingCycle: 'monthly',
      price: 0,
    });
  };

  const handleStatusFilter = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const plans: string[] = [
    'Basic', 'Standard', 'Premium', 'Enterprise'
  ];

  const subscriptionColumns = [
    {
      headerName: 'ID',
      field: 'subscriptionId',
      width: 80,
      sortable: true,
    },
    {
      headerName: 'User',
      field: 'userId',
      valueFormatter: (params: any) => getUserName(params.value),
      sortable: true,
    },
    {
      headerName: 'Email',
      field: 'userId',
      valueFormatter: (params: any) => getUserEmail(params.value),
      sortable: true,
    },
    {
      headerName: 'Plan',
      field: 'planName',
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
      field: 'status',
      sortable: true,
      cellRenderer: (params: any) => {
        const status = params.value;
        const colorClass =
          status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          status === 'expired' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          status === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        );
      },
    },
    {
      headerName: 'Billing Cycle',
      field: 'billingCycle',
      sortable: true,
      cellRenderer: (params: any) => (
        <span className="capitalize">{params.value}</span>
      ),
    },
    {
      headerName: 'Price',
      field: 'price',
      sortable: true,
      cellRenderer: (params: any) => (
        <span className="font-medium">₹{params.value.toLocaleString()}</span>
      ),
    },
    {
      headerName: 'Start Date',
      field: 'startDate',
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      sortable: true,
    },
    {
      headerName: 'End Date',
      field: 'endDate',
      valueFormatter: (params: any) => new Date(params.value).toLocaleDateString(),
      sortable: true,
      cellRenderer: (params: any) => {
        const endDate = new Date(params.value);
        const now = new Date();
        const isExpired = endDate < now;
        return (
          <span className={isExpired ? 'text-red-600 font-medium' : ''}>
            {endDate.toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  const toolbarButtons = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={handleStatusFilter}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="trial">Trial</option>
        </select>
      </div>
    </div>
  );

  // Calculate summary stats
  const activeSubscriptions = Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) => sub.status === 'active').length : 0;
  const expiredSubscriptions = Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) => sub.status === 'expired' || (new Date(sub.endDate) < new Date() && sub.status === 'active')).length : 0;
  const totalRevenue = Array.isArray(subscriptions) ? subscriptions.reduce((sum: number, sub: SubscriptionDetails) =>
    sum + (sub.status === 'active' ? sub.price : 0), 0
  ) : 0;

  return (
    <LoadingOverlay isLoading={subscriptionsLoading || usersLoading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Subscription Management</h1>
          <p className="text-sm text-slate-600">Manage user subscriptions, billing cycles, and payment tracking</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-green-600 mb-2">Active Subscriptions</h3>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Expired Subscriptions</h3>
            <div className="text-2xl font-bold">{expiredSubscriptions}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Monthly Revenue</h3>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <AgGridBox
          title="Subscriptions"
          columnDefs={subscriptionColumns}
          rowData={Array.isArray(subscriptions) ? subscriptions : []}
          onEdit={handleEditSubscription}
          toolbar={toolbarButtons}
        />

        {/* Update Subscription Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Update Subscription</h3>
              <form onSubmit={handleUpdateSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <select
                    value={subscriptionForm.planName}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, planName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    required
                  >
                    <option value="">Select Plan</option>
                    {plans.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={subscriptionForm.status}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, status: e.target.value as 'active' | 'expired' | 'cancelled' | 'trial'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Billing Cycle</label>
                  <select
                    value={subscriptionForm.billingCycle}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, billingCycle: e.target.value as 'monthly' | 'quarterly' | 'yearly'})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={subscriptionForm.price}
                    onChange={(e) => setSubscriptionForm({...subscriptionForm, price: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUpdateModal(false);
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

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => toast('Export subscriptions to CSV')}
              className="btn-primary text-sm"
            >
              Export Report
            </button>
            <button
              onClick={() => toast('Bulk subscription updates')}
              className="btn-secondary text-sm"
            >
              Bulk Update
            </button>
            <button
              onClick={() => toast('Send renewal reminders')}
              className="btn-secondary text-sm"
            >
              Send Reminders
            </button>
          </div>
        </div>
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default SubscriptionManagement;
