import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

const parseApiError = (err: unknown): string => {
  const axiosErr = err as { response?: { data?: Record<string, unknown> } };
  const data = axiosErr.response?.data;
  if (!data || typeof data !== 'object') return 'Registration failed. Please try again.';

  const messages: string[] = [];
  Object.entries(data).forEach(([, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => { if (typeof v === 'string') messages.push(v); });
    } else if (typeof value === 'string') {
      messages.push(value);
    }
  });
  return messages.length ? messages.join(' ') : 'Registration failed. Please try again.';
};

const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register({ email, username, password, password_confirm: passwordConfirm });
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="text-xs uppercase tracking-wider font-semibold text-emerald-600 text-center mb-2">Join platform</p>
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-7">Create account</h2>

        <form className="space-y-5" onSubmit={onSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="reg-username" className="block text-sm font-medium text-slate-700 mb-1">
              Username <span className="text-slate-400 font-normal">(min 3 characters)</span>
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              minLength={3}
              autoComplete="username"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password <span className="text-slate-400 font-normal">(min 8 characters)</span>
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {password.length > 0 && password.length < 8 && (
              <p className="mt-1 text-xs text-amber-600">
                {8 - password.length} more character{8 - password.length !== 1 ? 's' : ''} needed
              </p>
            )}
          </div>

          <div>
            <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
            <input
              id="reg-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            {passwordConfirm.length > 0 && password !== passwordConfirm && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 font-medium hover:text-emerald-800">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
