import React, { FC } from 'react';
import StatCard from '../layout/StatCard';
import { demoEmployees } from '../../data/employees.js';
import { demoStudents } from '../../data/students.js';
import { demoFees } from '../../data/fees.js';

interface DashboardProps {
  role: 'superadmin' | 'admin' | 'operator';
}

const Dashboard: FC<DashboardProps> = ({ role }) => {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600">{{
          superadmin: 'Full access: employees, sessions, fee rules',
          admin: 'View-only analytics & records',
          operator: 'Add students, submit fees'
        }[role]}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Employees" value={demoEmployees.length} sub="Active" icon="👨‍🏫" color="blue" />
        <StatCard title="Students" value={demoStudents.length} sub="Enrolled" icon="🎓" color="green" />
        <StatCard title="Fees (Apr)" value={'₹ ' + demoFees.reduce((a: any,b: any)=>a+b.amount,0)} sub="Collected" icon="💰" color="orange" />
        <StatCard title="Pending" value="₹ 12,500" sub="Est." icon="⏳" color="purple" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">New student Aarav Gupta enrolled in 10-A</span>
              <span className="text-xs text-slate-500 ml-auto">2h ago</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Fee payment received for Isha Singh</span>
              <span className="text-xs text-slate-500 ml-auto">5h ago</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Teacher Kabir Khan updated timetable</span>
              <span className="text-xs text-slate-500 ml-auto">1d ago</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Classes</span>
              <span className="text-sm font-semibold">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Subjects</span>
              <span className="text-sm font-semibold">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Streams</span>
              <span className="text-sm font-semibold">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Attendance Today</span>
              <span className="text-sm font-semibold text-green-600">95%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
