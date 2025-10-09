import React, { useState } from "react";

export default function Register({ onRegister, onSwitch }) {
  const [form, setForm] = useState({
    schooldetails: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (form.schooldetails && form.username && form.email && form.password) {
      onRegister(form);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-pink-900/10">
      {/* Left Side Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
        <img
          src="/imgRL.jpg"
          alt="School Illustration"
          className="relative z-10 w-4/5 rounded-3xl shadow-2xl border-4 border-white object-cover"
        />
        <div className="absolute bottom-10 left-10 z-10">
          <h1 className="text-white text-4xl font-bold tracking-wide drop-shadow-lg">
            School Admission
          </h1>
          <p className="text-white/90 mt-2 text-lg font-medium">
            Join and manage your school digitally
          </p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-800/90 rounded-3xl shadow-2xl border border-white/30 dark:border-slate-700 p-8 space-y-6 backdrop-blur-md">
          <h2 className="text-center text-3xl font-bold text-slate-800 dark:text-white">
            Create an Account
          </h2>
          <p className="text-center text-slate-500 dark:text-slate-400">
            Please fill in the details to get started
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              {
                label: "School/Organization Name",
                type: "text",
                name: "schooldetails",
                placeholder: "Enter school name",
              },
              {
                label: "Username",
                type: "text",
                name: "username",
                placeholder: "Enter username",
              },
              {
                label: "Email",
                type: "email",
                name: "email",
                placeholder: "Enter email",
              },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.name]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.name]: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 transition-all duration-200"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 transition-all duration-200"
              >
                <option value="admin">School Admin</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            {/* Password Fields */}
            {[
              {
                label: "Password",
                type: "password",
                name: "password",
                placeholder: "Enter password",
              },
              {
                label: "Confirm Password",
                type: "password",
                name: "confirmPassword",
                placeholder: "Confirm password",
              },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={form[field.name]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field.name]: e.target.value }))
                  }
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 transition-all duration-200"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              Register
            </button>
          </form>

          <p className="text-center text-slate-600 dark:text-slate-300 text-sm">
            Already have an account?{" "}
            <button
              onClick={onSwitch}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
