import React, { useState, useEffect } from 'react';

const AnimatedDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { title: "Student Management", icon: "👨‍🎓", color: "blue" },
    { title: "Fee Collection", icon: "💰", color: "green" },
    { title: "Class Scheduling", icon: "📅", color: "purple" },
    { title: "Reports & Analytics", icon: "📊", color: "orange" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Browser Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 border-b">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        </div>
        <div className="flex-1 mx-4 bg-white dark:bg-slate-600 rounded px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
          edumanage.pro/dashboard
        </div>
      </div>

      {/* Animated Dashboard */}
      <div className="p-6 min-h-[400px] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              EduManage Pro Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">John Doe</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl transition-all duration-500 transform ${
                currentStep === index
                  ? `bg-${step.color}-500 text-white scale-105 shadow-lg`
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{step.icon}</div>
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-lg font-bold mt-1">
                {index === 0 ? '1,234' : index === 1 ? '₹45,678' : index === 2 ? '24' : '89%'}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-2 bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
              {steps[currentStep].title} Overview
            </h3>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r from-${steps[currentStep].color}-400 to-${steps[currentStep].color}-600 rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.random() * 80 + 20}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {Math.floor(Math.random() * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white">
              <h4 className="font-semibold mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full bg-white/20 hover:bg-white/30 rounded-lg p-2 text-sm transition-colors">
                  Add New Student
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 rounded-lg p-2 text-sm transition-colors">
                  Generate Report
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Activity</h4>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      New {steps[currentStep].title.toLowerCase()} added
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-10 left-10 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse"></div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentStep === index ? 'bg-blue-500 w-6' : 'bg-gray-300'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedDemo;