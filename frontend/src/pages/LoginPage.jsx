import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  // Already logged in → go to dashboard
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;

    try {
      const result = await dispatch(login(form));
      if (login.fulfilled.match(result)) {
        toast.success('Welcome back!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error('Something went wrong. Check the console.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-orange-600/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div className="w-full max-w-md mx-4 relative">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500 rounded-xl mb-4 shadow-lg shadow-amber-500/30">
              <span className="text-slate-900 font-display font-bold text-lg">B</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1 font-body">Sign in to your blog admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm font-body placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm font-body placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* Show error inline too */}
            {error && (
              <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-2.5 text-sm text-red-400 font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-slate-900 font-body font-semibold py-2.5 rounded-lg transition-all mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          {/* Dev helper — shows API URL so you can verify it's correct */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-center text-slate-700 text-xs font-mono mt-4">
              API → {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
