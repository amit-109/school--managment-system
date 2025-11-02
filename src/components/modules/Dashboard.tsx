import React, { FC, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import LoadingOverlay from '../shared/LoadingOverlay';
import TokenManager from '../Auth/tokenManager';

interface DashboardProps {
  role: 'superadmin' | 'admin' | 'operator';
}

interface DashboardData {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  totalParents: number;
  activeParents: number;
  inactiveParents: number;
  totalCourses: number;
  totalClasses: number;
}

const Dashboard: FC<DashboardProps> = ({ role }) => {
  const { accessToken } = useSelector((state: any) => state.auth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const token = accessToken || TokenManager.getInstance().getAccessToken();
      
      if (!token) {
        toast.error('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('https://sfms-api.abhiworld.in/api/admin/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': '*/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard API error:', error);
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to load dashboard data');
      }
      // Set fallback data
      setData({
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        totalTeachers: 0,
        activeTeachers: 0,
        inactiveTeachers: 0,
        totalParents: 0,
        activeParents: 0,
        inactiveParents: 0,
        totalCourses: 0,
        totalClasses: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay isLoading={true} />;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {{
            superadmin: 'Complete system overview and analytics',
            admin: 'School management dashboard',
            operator: 'Daily operations overview'
          }[role]}
        </p>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Students Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 dark:from-blue-900/30 dark:via-blue-800/20 dark:to-blue-700/10 rounded-3xl p-6 border border-blue-200/50 dark:border-blue-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <span className="text-2xl">🎓</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Students</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{data?.totalStudents || 0}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">{data?.activeStudents || 0}</span> active • 
                <span className="font-semibold">{data?.inactiveStudents || 0}</span> inactive
              </div>
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:via-emerald-800/20 dark:to-emerald-700/10 rounded-3xl p-6 border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl">
                <span className="text-2xl">👨🏫</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">Teachers</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{data?.totalTeachers || 0}</div>
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                <span className="font-semibold">{data?.activeTeachers || 0}</span> active • 
                <span className="font-semibold">{data?.inactiveTeachers || 0}</span> inactive
              </div>
            </div>
          </div>
        </div>

        {/* Parents Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 dark:from-purple-900/30 dark:via-purple-800/20 dark:to-purple-700/10 rounded-3xl p-6 border border-purple-200/50 dark:border-purple-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl">
                <span className="text-2xl">👨👩👧👦</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Parents</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{data?.totalParents || 0}</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                <span className="font-semibold">{data?.activeParents || 0}</span> active • 
                <span className="font-semibold">{data?.inactiveParents || 0}</span> inactive
              </div>
            </div>
          </div>
        </div>

        {/* Classes Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 dark:from-orange-900/30 dark:via-orange-800/20 dark:to-orange-700/10 rounded-3xl p-6 border border-orange-200/50 dark:border-orange-700/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-2xl">
                <span className="text-2xl">🏫</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">Academic</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{data?.totalClasses || 0}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                <span className="font-semibold">{data?.totalCourses || 0}</span> courses available
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="text-xl">📈</span>
            Activity Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {Math.round(((data?.activeStudents || 0) / (data?.totalStudents || 1)) * 100)}%
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Student Activity</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {Math.round(((data?.activeTeachers || 0) / (data?.totalTeachers || 1)) * 100)}%
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Teacher Activity</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="text-xl">🏫</span>
            Academic Summary
          </h3>
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {data?.totalClasses || 0}
              </div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Total Classes</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl">
              <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                {data?.totalCourses || 0}
              </div>
              <div className="text-indigo-600 dark:text-indigo-400 font-medium">Total Courses</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;