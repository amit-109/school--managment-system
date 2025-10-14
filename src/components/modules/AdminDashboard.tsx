// components/modules/AdminDashboard.tsx
import React, { useEffect, useState, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import StatCard from '../layout/StatCard';
import { AppDispatch, RootState } from '../../store';
import {
  fetchDashboardStatsAsync,
  fetchUsersAsync,
  fetchAllSubscriptionsAsync,
  fetchDashboardOverviewAsync,
} from '../Services/adminStore';
import { User, SubscriptionDetails, DashboardStats } from '../Services/adminService';
import LoadingOverlay from '../shared/LoadingOverlay';

interface AdminDashboardProps {
  // Props can be added here if needed in the future
}

const AdminDashboard: FC<AdminDashboardProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, subscriptions, dashboardStats } = useSelector((state: RootState) => state.admin);
  const dashboardLoading = useSelector((state: RootState) => state.admin.dashboardLoading);
  const usersLoading = useSelector((state: RootState) => state.admin.usersLoading);
  const subscriptionsLoading = useSelector((state: RootState) => state.admin.subscriptionsLoading);

  const [overviewData, setOverviewData] = useState<any>(null);

  useEffect(() => {
    // Fetch all required data
    dispatch(fetchDashboardStatsAsync());
    dispatch(fetchUsersAsync({ page: 0, size: 1000 }));
    dispatch(fetchAllSubscriptionsAsync({ page: 0, size: 1000 }));

    // Fetch overview data (custom implementation)
    const loadOverview = async (): Promise<void> => {
      try {
        const result = await dispatch(fetchDashboardOverviewAsync()).unwrap();
        setOverviewData(result);
      } catch (error) {
        console.error('Failed to load dashboard overview:', error);
      }
    };

    loadOverview();
  }, [dispatch]);

  const activeUsersCount = Array.isArray(users) ? users.filter((user: User) => user.isActive).length : 0;
  const expiredSubscriptionsCount = Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) =>
    new Date(sub.endDate) < new Date() && sub.status === 'active'
  ).length : 0;

  const totalRevenue = Array.isArray(subscriptions) ? subscriptions.reduce((sum: number, sub: SubscriptionDetails) =>
    sum + (sub.status === 'active' ? sub.price : 0), 0
  ) : 0;

  const pendingPayments = overviewData?.pendingPayments || (dashboardStats as DashboardStats)?.pendingPayments || 0;

  return (
    <LoadingOverlay isLoading={dashboardLoading || usersLoading || subscriptionsLoading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Manage users, subscriptions, and system analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={Array.isArray(users) ? users.length : 0}
            sub={`Active: ${activeUsersCount}`}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Active Subscriptions"
            value={Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) => sub.status === 'active').length : 0}
            sub="Paid plans"
            icon="💎"
            color="green"
          />
          <StatCard
            title="Expired Subscriptions"
            value={expiredSubscriptionsCount}
            sub="Need renewal"
            icon="⚠️"
            color="orange"
          />
          <StatCard
            title="Monthly Revenue"
            value={`₹ ${totalRevenue.toLocaleString()}`}
            sub="From subscriptions"
            icon="💰"
            color="purple"
          />
        </div>

        {/* Pending Payments */}
        {pendingPayments > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">Pending Payments</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">₹ {pendingPayments.toLocaleString()}</span>
                <span className="text-sm text-slate-500">Outstanding</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent User Registrations</h3>
            <div className="space-y-3">
              {Array.isArray(users) && users.slice(0, 5).map((user: User) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-slate-500 ml-2">({user.username})</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-slate-500">No recent registrations</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Subscription Status Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Subscriptions</span>
                <span className="text-sm font-semibold text-green-600">
                  {Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) => sub.status === 'active').length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Expired</span>
                <span className="text-sm font-semibold text-red-600">
                  {expiredSubscriptionsCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cancelled</span>
                <span className="text-sm font-semibold text-gray-600">
                  {Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) => sub.status === 'cancelled').length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Trial</span>
                <span className="text-sm font-semibold text-blue-600">
                  {Array.isArray(subscriptions) ? subscriptions.filter((sub: SubscriptionDetails) => sub.status === 'trial').length : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => toast('Navigate to User Management')}
              className="btn-primary text-sm"
            >
              Add New User
            </button>
            <button
              onClick={() => toast('Navigate to Subscriptions')}
              className="btn-secondary text-sm"
            >
              View All Subscriptions
            </button>
            <button
              onClick={() => toast('Navigate to Reports')}
              className="btn-secondary text-sm"
            >
              Generate Reports
            </button>
            <button
              onClick={() => toast('Navigate to Settings')}
              className="btn-secondary text-sm"
            >
              System Settings
            </button>
          </div>
        </div>
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default AdminDashboard;
