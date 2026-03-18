import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { containsProfanity } from '../utils/profanityFilter';
import {
  verifyCode as verifyCodeApi,
  resendCode as resendCodeApi,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
} from '../api/auth';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verification state
  const [showVerify, setShowVerify] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  // Forgot password state
  const [forgotView, setForgotView] = useState(null); // null | 'email' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { token, loginAction, registerAction } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isBanned = searchParams.get('error') === 'banned';

  if (token) return <Navigate to="/dashboard" replace />;

  function clearMessages() {
    setError('');
    setSuccessMessage('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (activeTab === 'register' && containsProfanity(username)) {
      setError('Username contains inappropriate language');
      return;
    }

    setSubmitting(true);

    try {
      if (activeTab === 'login') {
        await loginAction(username, password);
        navigate('/dashboard');
      } else {
        const result = await registerAction(username, email, password);
        setVerifyEmail(email);
        setShowVerify(true);
        setSuccessMessage(result.message);
      }
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.error || 'Something went wrong';
      setError(errorMsg);

      // If login blocked because email not verified — show verify form
      if (status === 403 && err.response?.data?.email) {
        setVerifyEmail(err.response.data.email);
        setShowVerify(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    clearMessages();
    setSubmitting(true);

    try {
      const res = await verifyCodeApi(verifyEmail, verifyCode);
      setSuccessMessage(res.data.message);
      setShowVerify(false);
      setVerifyCode('');
      setActiveTab('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    clearMessages();

    try {
      const res = await resendCodeApi(verifyEmail);
      setSuccessMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
    }
  }

  // Forgot password — step 1: send reset code
  async function handleForgotSubmit(e) {
    e.preventDefault();
    clearMessages();
    setSubmitting(true);

    try {
      const res = await forgotPasswordApi(forgotEmail);
      setSuccessMessage(res.data.message);
      setForgotView('reset');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // Forgot password — step 2: verify code + set new password
  async function handleResetSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const res = await resetPasswordApi(forgotEmail, resetCode, newPassword);
      setSuccessMessage(res.data.message);
      // Return to login
      setForgotView(null);
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  function openForgotPassword() {
    clearMessages();
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotView('email');
  }

  function backToLogin() {
    clearMessages();
    setForgotView(null);
  }

  const googleOAuthUrl = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;

  // Determine which view to render
  const renderContent = () => {
    // Email verification view
    if (showVerify) {
      return (
        <>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-coffee-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-cream-100 mb-1">Verify your email</h2>
            <p className="text-cream-300/60 text-sm">
              We sent a 6-digit code to <span className="text-cream-200">{verifyEmail}</span>
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm text-cream-300/80 mb-1">Verification Code</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors text-center text-lg tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || verifyCode.length !== 6}
              className="w-full bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleResend}
              className="text-coffee-300 hover:text-coffee-400 text-sm underline"
            >
              Resend code
            </button>
            <button
              onClick={() => { setShowVerify(false); clearMessages(); }}
              className="text-cream-300/40 hover:text-cream-300/60 text-sm"
            >
              Back to login
            </button>
          </div>
        </>
      );
    }

    // Forgot password — step 1: enter email
    if (forgotView === 'email') {
      return (
        <>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-coffee-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-cream-100 mb-1">Reset your password</h2>
            <p className="text-cream-300/60 text-sm">
              Enter your email and we'll send you a reset code
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cream-300/80 mb-1">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !forgotEmail.trim()}
              className="w-full bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={backToLogin}
              className="text-cream-300/40 hover:text-cream-300/60 text-sm"
            >
              Back to login
            </button>
          </div>
        </>
      );
    }

    // Forgot password — step 2: enter code + new password
    if (forgotView === 'reset') {
      return (
        <>
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-coffee-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-cream-100 mb-1">Set new password</h2>
            <p className="text-cream-300/60 text-sm">
              Enter the code sent to <span className="text-cream-200">{forgotEmail}</span>
            </p>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cream-300/80 mb-1">Reset Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors text-center text-lg tracking-widest"
              />
            </div>

            <div>
              <label className="block text-sm text-cream-300/80 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm text-cream-300/80 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || resetCode.length !== 6 || !newPassword || !confirmPassword}
              className="w-full bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => { clearMessages(); setForgotView('email'); }}
              className="text-coffee-300 hover:text-coffee-400 text-sm underline"
            >
              Resend code
            </button>
            <button
              onClick={backToLogin}
              className="text-cream-300/40 hover:text-cream-300/60 text-sm"
            >
              Back to login
            </button>
          </div>
        </>
      );
    }

    // Default: Login / Register view
    return (
      <>
        {/* Tabs */}
        <div className="flex mb-6 bg-dark-800 rounded-lg p-1">
          <button
            onClick={() => { setActiveTab('login'); clearMessages(); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'login'
                ? 'bg-coffee-500 text-cream-100'
                : 'text-cream-300/60 hover:text-cream-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setActiveTab('register'); clearMessages(); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'register'
                ? 'bg-coffee-500 text-cream-100'
                : 'text-cream-300/60 hover:text-cream-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Success */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg text-emerald-400 text-sm">
            {successMessage}
          </div>
        )}

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

        {/* Forgot password link — only on login tab */}
        {activeTab === 'login' && (
          <div className="mt-3 text-center">
            <button
              onClick={openForgotPassword}
              className="text-coffee-300/60 hover:text-coffee-300 text-sm transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

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
      </>
    );
  };

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

        {/* Banned error */}
        {isBanned && (
          <div className="mb-4 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
            Your account has been banned. Contact support for assistance.
          </div>
        )}

        {/* Card */}
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
