import React, { useState } from "react";
import { useSelector } from "react-redux";

export default function Login({ onLogin, onSwitch }) {
  const { loggingIn } = useSelector((state) => state.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username && password) {
      onLogin({ username, password });
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/10">
      {/* Left Side Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-500 to-green-500 opacity-80"></div>
        <img
          src="/imgRL.jpg"
          alt="School Management Illustration"
          className="relative z-10 w-4/5 rounded-3xl shadow-2xl border-4 border-white object-cover"
        />
        <div className="absolute bottom-10 left-10 z-10">
          <h1 className="text-white text-4xl font-bold tracking-wide drop-shadow-lg">
            Welcome Back 👋
          </h1>
          <p className="text-white/90 mt-2 text-lg font-medium">
            Manage your school from one place
          </p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-800/90 rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700 p-8 space-y-6 backdrop-blur-md">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
             Login
            </h1>
            
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 transition-all duration-200"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 transition-all duration-200"
                placeholder="Enter password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-indigo-500 rounded"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-300 text-sm">
            Don’t have an account?{" "}
            <button
              onClick={onSwitch}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
