import React, { useEffect, useState, FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import StatCard from '../layout/StatCard';
import {
  fetchAnalyticsDataAsync,
  fetchTenantsAsync,
  fetchModulesAsync,
  fetchRolesAsync,
  fetchSystemHealthAsync,
} from '../Services/superAdminStore';
import { Tenant, Module } from '../Services/superAdminService';
import LoadingOverlay from '../shared/LoadingOverlay';
import { AppDispatch, RootState } from '../../store';

interface SuperAdminDashboardProps {
  // Props can be added here if needed in the future
}

const SuperAdminDashboard: FC<SuperAdminDashboardProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    analyticsData,
    tenants,
    modules,
    roles,
    systemHealth,
    analyticsLoading,
    tenantsLoading,
    modulesLoading,
    rolesLoading,
  } = useSelector((state: RootState) => state.superAdmin);

  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  useEffect(() => {
    // Fetch all required data
    dispatch(fetchAnalyticsDataAsync(selectedPeriod));
    dispatch(fetchTenantsAsync({ page: 0, size: 1000 }));
    dispatch(fetchModulesAsync({ page: 0, size: 1000 }));
    dispatch(fetchRolesAsync({ page: 0, size: 1000 }));
    dispatch(fetchSystemHealthAsync());
  }, [dispatch, selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const activeTenants = Array.isArray(tenants) ? tenants.filter((tenant: Tenant) => tenant.subscriptionStatus === 'active').length : 0;
  const totalTenants = Array.isArray(tenants) ? tenants.length : 0;
  const enabledModules = Array.isArray(modules) ? modules.filter((module: Module) => (module as any).isEnabled).length : 0;
  const totalModules = Array.isArray(modules) ? modules.length : 0;

  const totalRevenue = analyticsData?.revenueData?.totalRevenue || 0;
  const monthlyRevenue = analyticsData?.revenueData?.monthlyRevenue?.[0] || 0;
  const systemUptime = analyticsData?.systemUptime || 0;
  const apiRequestCount = analyticsData?.apiRequestCount || 0;
  const errorRate = analyticsData?.errorRate || 0;

  const recentTenants = Array.isArray(tenants) ? tenants.slice(0, 5) : [];

  return (
    <LoadingOverlay isLoading={analyticsLoading || tenantsLoading || modulesLoading || rolesLoading}>
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">SuperAdmin Dashboard</h1>
          <p className="text-sm text-slate-600">Full system overview and analytics</p>
        </div>

        {/* Period Selection */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Analytics Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-slate-100"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            sub={`Active: ${activeTenants}`}
            icon="🏢"
            color="blue"
          />
          <StatCard
            title="System Modules"
            value={totalModules}
            sub={`Enabled: ${enabledModules}`}
            icon="🔧"
            color="green"
          />
          <StatCard
            title="System Roles"
            value={Array.isArray(roles) ? roles.length : 0}
            sub="Total roles"
            icon="👥"
            color="purple"
          />
          <StatCard
            title="System Uptime"
            value={`${systemUptime}%`}
            sub="Current status"
            icon="⚡"
            color="orange"
          />
        </div>

        {/* Revenue & Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Revenue"
            value={`₹ ${totalRevenue.toLocaleString()}`}
            sub="All time"
            icon="💰"
            color="green"
          />
          <StatCard
            title="Monthly Revenue"
            value={`₹ ${monthlyRevenue.toLocaleString()}`}
            sub={`Last ${selectedPeriod}`}
            icon="📈"
            color="blue"
          />
          <StatCard
            title="API Requests"
            value={apiRequestCount.toLocaleString()}
            sub={`Last ${selectedPeriod}`}
            icon="🔄"
            color="purple"
          />
        </div>

        {/* System Health & Errors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-semibold text-green-600">{systemUptime}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Error Rate</span>
                <span className="text-sm font-semibold text-red-600">{errorRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">API Requests</span>
                <span className="text-sm font-semibold text-blue-600">{apiRequestCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Modules</span>
                <span className="text-sm font-semibold text-purple-600">{enabledModules}/{totalModules}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Tenant Registrations</h3>
            <div className="space-y-3">
              {recentTenants.map((tenant: Tenant) => (
                <div key={tenant.tenantId} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{tenant.tenantName}</span>
                    <span className="text-xs text-slate-500 ml-2">({tenant.domain})</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-slate-500">No recent registrations</p>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        {analyticsData?.revenueData?.subscriptionBreakdown && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(analyticsData.revenueData.subscriptionBreakdown).map(([plan, amount]) => (
                <div key={plan} className="text-center">
                  <div className="text-lg font-bold text-green-600">₹{(amount as number).toLocaleString()}</div>
                  <div className="text-sm text-slate-600 capitalize">{plan}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tenant Status Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Tenant Status Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(tenants) ? tenants.filter((t: Tenant) => t.subscriptionStatus === 'active').length : 0}
              </div>
              <div className="text-sm text-slate-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Array.isArray(tenants) ? tenants.filter((t: Tenant) => t.subscriptionStatus === 'trial').length : 0}
              </div>
              <div className="text-sm text-slate-600">Trial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Array.isArray(tenants) ? tenants.filter((t: Tenant) => t.subscriptionStatus === 'inactive').length : 0}
              </div>
              <div className="text-sm text-slate-600">Inactive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Array.isArray(tenants) ? tenants.filter((t: Tenant) => t.subscriptionStatus === 'suspended').length : 0}
              </div>
              <div className="text-sm text-slate-600">Suspended</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => toast('Navigate to System Settings')}
              className="btn-primary text-sm"
            >
              System Config
            </button>
            <button
              onClick={() => toast('Navigate to Analytics Dashboard')}
              className="btn-secondary text-sm"
            >
              View Analytics
            </button>
            <button
              onClick={() => toast('Navigate to System Logs')}
              className="btn-secondary text-sm"
            >
              System Logs
            </button>
            <button
              onClick={() => toast('Backup system data')}
              className="btn-secondary text-sm"
            >
              Backup System
            </button>
          </div>
        </div>
      </section>
      <Toaster position="top-right" />
    </LoadingOverlay>
  );
};

export default SuperAdminDashboard;
