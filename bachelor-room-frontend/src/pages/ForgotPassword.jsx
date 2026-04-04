import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiCheckCircle, FiMail } from 'react-icons/fi';
import { apiService } from '../services/api';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.forgotPassword(email);
      setSuccess(response.data?.message || 'Password reset link sent to your email.');
    } catch (requestError) {
      setError(requestError.response?.data?.errors?.email?.[0] || requestError.response?.data?.message || 'Unable to send reset email right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.2),_transparent_30%),linear-gradient(180deg,_#07130f_0%,_#0d1b16_48%,_#050807_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#111b17]/90 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200">
            <FiArrowLeft size={16} />
            Back to login
          </Link>

          <h1 className="text-2xl font-bold text-white">Forgot password</h1>
          <p className="mt-2 text-sm leading-6 text-emerald-50/70">
            Enter your account email and we will send a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-emerald-50/85">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`w-full rounded-2xl border bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-emerald-100/30 focus:outline-none focus:ring-2 ${
                    error ? 'border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/30' : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-400/25'
                  }`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:from-emerald-400 hover:to-green-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
