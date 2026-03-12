import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { token, loginAction, registerAction } = useAuth();
  const navigate = useNavigate();

  // Already logged in — redirect to dashboard
  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        await loginAction(username, password);
      } else {
        await registerAction(username, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const googleOAuthUrl = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cream-100">
            Tutor<span className="text-coffee-300">Rev</span>
          </h1>
          <p className="text-cream-300/60 mt-2">Review tutorials. Learn better.</p>
        </div>

        {/* Card */}
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'login'
                  ? 'bg-coffee-500 text-cream-100'
                  : 'text-cream-300/60 hover:text-cream-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'register'
                  ? 'bg-coffee-500 text-cream-100'
                  : 'text-cream-300/60 hover:text-cream-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cream-300/80 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>

            {activeTab === 'register' && (
              <div>
                <label className="block text-sm text-cream-300/80 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-cream-300/80 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Please wait...'
                : activeTab === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-dark-600" />
            <span className="px-3 text-sm text-cream-300/40">or</span>
            <div className="flex-1 border-t border-dark-600" />
          </div>

          {/* Google OAuth */}
          <a
            href={googleOAuthUrl}
            className="w-full flex items-center justify-center gap-2 bg-cream-200 text-dark-900 font-medium py-2.5 rounded-lg hover:bg-cream-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}
