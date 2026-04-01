import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const { login } = useAuth();

  const showValidationToast = (message) => {
    toast(message, {
      icon: '!',
      style: {
        background: '#3b1f0f',
        color: '#fed7aa',
        border: '1px solid #f97316',
      },
    });
  };

  const showAuthFailureToast = (message) => {
    toast.error(message, {
      style: {
        background: '#3b0d18',
        color: '#ffe4e6',
        border: '1px solid #fb7185',
      },
    });
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setAuthError('');
      setFieldErrors(nextErrors);
      showValidationToast(nextErrors.email || nextErrors.password);
      return;
    }
    
    setAuthError('');
    setFieldErrors({});
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      const message = result.message || 'Wrong email or password. Please try again.';
      setAuthError(message);
      setFieldErrors({
        email: 'Check your login details.',
        password: 'Wrong password or account details.',
      });
      showAuthFailureToast(message);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setAuthError('');

    setFieldErrors((current) => ({
      ...current,
      email: value
        ? !isValidEmail(value)
          ? 'Enter a valid email address.'
          : ''
        : current.email === 'Check your login details.'
          ? ''
          : current.email,
    }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setAuthError('');

    setFieldErrors((current) => ({
      ...current,
      password: value ? '' : current.password === 'Wrong password or account details.' ? '' : current.password,
    }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.28),_transparent_30%),linear-gradient(180deg,_#07130f_0%,_#0d1b16_48%,_#050807_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-8 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="mx-auto max-w-xl lg:mx-0">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              Bachelor Room
            </div>

            <h1 className="max-w-lg font-['Space_Grotesk'] text-4xl font-bold leading-tight text-white sm:text-5xl">
              Room finance, now smoother on mobile.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-emerald-50/70 sm:text-base">
              Track contributions, expenses, and room balance from a cleaner dashboard with stronger error feedback.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { title: 'Fast Login', value: 'Secure access' },
                { title: 'Live Wallet', value: 'Room balance' },
                { title: 'Mobile First', value: 'Smooth layout' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{item.title}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#111b17]/90 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-300">Welcome back</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Sign in</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-900/40">
                <span className="text-xl font-bold text-white">R</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {fieldErrors.email && fieldErrors.email !== 'Check your login details.' && (
                <div className="flex items-start gap-3 rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
                  <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                  <span>{fieldErrors.email}</span>
                </div>
              )}

              {authError && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                  <span>{authError}</span>
                </div>
              )}

            <div>
              <label className="mb-2 block text-sm font-medium text-emerald-50/85">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full rounded-2xl border bg-white/5 py-3 pl-12 pr-4 text-white placeholder:text-emerald-100/30 focus:outline-none focus:ring-2 ${
                    authError
                      ? 'border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/30'
                      : fieldErrors.email
                      ? 'border-orange-400/70 focus:border-orange-400 focus:ring-orange-400/30'
                      : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-400/25'
                  }`}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && fieldErrors.email !== 'Check your login details.' && (
                <p className="mt-2 text-sm text-orange-300">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-emerald-50/85">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm text-emerald-300 transition-colors hover:text-emerald-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full rounded-2xl border bg-white/5 py-3 pl-12 pr-12 text-white placeholder:text-emerald-100/30 focus:outline-none focus:ring-2 ${
                    authError || fieldErrors.password
                      ? 'border-rose-400/70 focus:border-rose-400 focus:ring-rose-400/30'
                      : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-400/25'
                  }`}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-100/40 transition-colors hover:text-emerald-100/70"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-2 text-sm text-rose-300">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-emerald-50/75">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="ml-2">Remember me</span>
              </label>
              <button type="button" className="text-emerald-300 transition-colors hover:text-emerald-200">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:from-emerald-400 hover:to-green-400 disabled:cursor-not-allowed disabled:opacity-70"
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

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="mt-0.5 text-emerald-300" size={18} />
                <div>
                  <p className="text-sm font-medium text-white">Better feedback added</p>
                  <p className="mt-1 text-sm text-emerald-50/60">
                    Invalid email format shows an orange warning. Wrong credentials show a red error state.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
