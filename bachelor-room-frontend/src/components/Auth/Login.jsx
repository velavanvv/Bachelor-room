import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Bachelor Room Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Sign in to manage contributions and expenses
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="input-label">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loader w-5 h-5 mr-2 border-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

         
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Bachelor Room Management. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;