import React from 'react';

export default function LandingPage({ onSignIn, onRegister }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:flex lg:px-8">
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl">
            <div className="flex items-center gap-4 mt-8 lg:mt-4">
              <img src="/imglandingpage.png" alt="EduManage Pro Logo" className="w-12 h-12 rounded-full shadow-lg" />
              <a href="#" className="inline-flex space-x-6">
                <span className="rounded-full bg-blue-600/10 px-3 py-1 text-sm font-semibold leading-6 text-blue-600 ring-1 ring-inset ring-blue-600/10">
                  We're hiring
                </span>
                <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-600 dark:text-slate-400">
                  <span>Just shipped v2.0</span>
                </span>
              </a>
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-4xl lg:text-5xl">
              Streamline Your School Management
            </h1>
            <p className="mt-4 text-lg leading-7 text-gray-600 dark:text-slate-400">
              EduManage Pro revolutionizes school administration with powerful, intuitive tools for managing students, staff, fees, and operations - all in one comprehensive platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-x-6">
              <button
                onClick={onRegister}
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get Started Free
              </button>
              <button
                onClick={onSignIn}
                className="text-base font-semibold leading-6 text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Sign In <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
          <div className="mx-auto mt-12 flex max-w-2xl lg:ml-8 lg:mr-0 lg:mt-8 lg:max-w-none">
            <div className="max-w-3xl flex-none">
              <img
                src="/imglandingpage.png"
                alt="School Management Dashboard Preview"
                className="h-[24rem] w-full rounded-xl shadow-xl object-cover ring-1 ring-inset ring-gray-900/10 dark:ring-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100 sm:text-4xl">
              Powerful Features for Modern Schools
            </p>
            <p className="mt-4 text-lg leading-7 text-gray-600 dark:text-slate-400">
              Comprehensive school management solution designed to scale with your institution's needs.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl lg:mt-16 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-slate-100">
                  <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
                  </svg>
                  Student Management
                </dt>
                <dd className="mt-2 text-base leading-6 text-gray-600 dark:text-slate-400">
                  Complete student profiles with enrollment, grades, attendance, and performance tracking.
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-slate-100">
                  <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  Fee Management
                </dt>
                <dd className="mt-2 text-base leading-6 text-gray-600 dark:text-slate-400">
                  Automated fee collection with flexible structures, payment tracking, and financial reporting.
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-slate-100">
                  <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4.632 3.533A2 2 0 016.577 2h6.846a2 2 0 011.945 1.533l1.976 8.234A3.489 3.489 0 0016 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234z" />
                    <path fillRule="evenodd" d="M4 13a2 2 0 100 4h12a2 2 0 100-4H4zm11.24 2a.75.75 0 01.75-.75H16a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V15zm-2.25-.75a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75h-.01z" clipRule="evenodd" />
                  </svg>
                  Staff & Classes
                </dt>
                <dd className="mt-2 text-base leading-6 text-gray-600 dark:text-slate-400">
                  Manage teachers, administrative staff, class schedules, subjects, and academic sessions.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="px-6 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your school?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-blue-100">
              Join hundreds of educational institutions already using EduManage Pro to streamline their operations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
              <button
                onClick={onRegister}
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Free Trial
              </button>
              <button
                onClick={onSignIn}
                className="text-base font-semibold leading-6 text-white hover:text-blue-200"
              >
                Schedule Demo <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h3 className="text-sm font-semibold leading-6 text-white">EduManage Pro</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              © 2024 EduManage Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
