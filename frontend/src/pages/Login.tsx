import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, User, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/15 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary-600 rounded-xl shadow-lg shadow-primary-500/30 mb-3">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Sign In</h2>
          <p className="text-slate-400 text-sm mt-1">Audit policies with PolicyGuard AI</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg mb-6 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-slate-950/40 border border-slate-700/60 text-slate-100 placeholder-slate-500 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-slate-950/40 border border-slate-700/60 text-slate-100 placeholder-slate-500 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors focus:ring-1 focus:ring-accent-blue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white rounded-lg py-3 text-sm font-semibold tracking-wide shadow-lg shadow-primary-800/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-slate-400 text-xs text-center mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-blue hover:text-accent-blue/80 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
