import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changeUsername, requestPasswordChange, changePassword, getUserReviews, uploadProfilePicture, deleteProfilePicture } from '../api/profile';
import { containsProfanity } from '../utils/profanityFilter';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Username state
  const [newUsername, setNewUsername] = useState('');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  // Password state
  const [pwStep, setPwStep] = useState('idle'); // idle | codeSent | success
  const [pwCode, setPwCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Avatar state
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarErr, setAvatarErr] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsErr, setReviewsErr] = useState('');

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    getUserReviews()
      .then((res) => setReviews(res.data))
      .catch(() => setReviewsErr('Failed to load reviews'))
      .finally(() => setReviewsLoading(false));
  }, []);

  const isGoogle = user?.provider === 'google';

  // ---- Avatar ----
  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarErr('');

    if (!file.type.startsWith('image/')) {
      setAvatarErr('Please select an image file');
      return;
    }
    if (file.size > 500 * 1024) {
      setAvatarErr('Image must be under 500KB');
      return;
    }

    setAvatarUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await uploadProfilePicture(base64);
      await refreshUser();
    } catch (err) {
      setAvatarErr(err.response?.data?.error || 'Failed to upload picture');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  }

  async function handleRemoveAvatar() {
    setAvatarErr('');
    setAvatarUploading(true);
    try {
      await deleteProfilePicture();
      await refreshUser();
    } catch (err) {
      setAvatarErr(err.response?.data?.error || 'Failed to remove picture');
    } finally {
      setAvatarUploading(false);
    }
  }

  // ---- Username ----
  async function handleUsernameChange(e) {
    e.preventDefault();
    const trimmed = newUsername.trim();
    setUsernameMsg('');
    setUsernameErr('');

    if (!trimmed || trimmed === user.username) {
      setUsernameErr('Enter a different username');
      return;
    }

    if (containsProfanity(trimmed)) {
      setUsernameErr('Username contains inappropriate language');
      return;
    }

    setSavingUsername(true);
    try {
      const res = await changeUsername(trimmed);
      await refreshUser(res.data.token);
      setUsernameMsg('Username updated!');
    } catch (err) {
      setUsernameErr(err.response?.data?.error || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  }

  // ---- Password ----
  async function handleSendCode() {
    setPwErr('');
    setPwMsg('');
    setSendingCode(true);
    try {
      await requestPasswordChange();
      setPwStep('codeSent');
      setPwMsg('Code sent to your email');
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed to send code');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');

    if (newPassword.length < 6) {
      setPwErr('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwErr('Passwords do not match');
      return;
    }

    setChangingPw(true);
    try {
      await changePassword(pwCode, newPassword);
      setPwStep('success');
      setPwMsg('Password changed successfully!');
      setPwCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  }

  if (!user) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-cream-100">Profile Settings</h1>
        <p className="text-cream-300/60 text-sm mt-1">Manage your account</p>
      </div>

      {/* ==================== Account Info ==================== */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account
        </h2>

        {/* Profile Picture */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-dark-600">
          <button
            onClick={handleAvatarClick}
            disabled={avatarUploading}
            className="relative group w-20 h-20 rounded-full flex-shrink-0 overflow-hidden
                       focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:ring-offset-2
                       focus:ring-offset-dark-700 disabled:opacity-50"
          >
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-coffee-500 flex items-center justify-center
                              text-2xl font-bold text-cream-100">
                {user.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-cream-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86
                         a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0
                         01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-1">
            <button
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              className="block text-sm text-coffee-300 hover:text-coffee-400 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {avatarUploading ? 'Uploading...' : 'Change picture'}
            </button>
            {user.profilePicture && (
              <button
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="block text-xs text-cream-300/40 hover:text-java-400 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            )}
            <p className="text-cream-300/30 text-xs">Max 500KB · JPG, PNG, GIF</p>
          </div>

          {avatarErr && (
            <p className="text-java-400 text-xs">{avatarErr}</p>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="mb-4">
          <label className="block text-cream-300/60 text-xs mb-1">Email</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={user.email}
              disabled
              className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                         text-cream-300/40 text-sm cursor-not-allowed"
            />
            {isGoogle && (
              <span className="text-xs bg-dark-600 text-cream-300/60 px-2 py-1 rounded-full">
                Google
              </span>
            )}
          </div>
        </div>

        {/* Username */}
        <form onSubmit={handleUsernameChange}>
          <label className="block text-cream-300/60 text-xs mb-1">Username</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => {
                setNewUsername(e.target.value);
                setUsernameMsg('');
                setUsernameErr('');
              }}
              maxLength={30}
              className="flex-1 bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                         text-cream-200 text-sm placeholder-cream-300/40
                         focus:outline-none focus:border-coffee-500 transition-colors"
            />
            <button
              type="submit"
              disabled={savingUsername || newUsername.trim() === user.username}
              className="bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium
                         px-4 py-2.5 rounded-lg transition-colors text-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingUsername ? 'Saving...' : 'Save'}
            </button>
          </div>
          {usernameMsg && <p className="text-emerald-400 text-xs mt-2">{usernameMsg}</p>}
          {usernameErr && <p className="text-java-400 text-xs mt-2">{usernameErr}</p>}
        </form>
      </div>

      {/* ==================== Change Password ==================== */}
      {!isGoogle && (
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
          <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7
                       a4 4 0 00-8 0v4h8z" />
            </svg>
            Change Password
          </h2>

          {pwStep === 'idle' && (
            <div>
              <p className="text-cream-300/60 text-sm mb-3">
                We'll send a verification code to your email to confirm the change.
              </p>
              <button
                onClick={handleSendCode}
                disabled={sendingCode}
                className="bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium
                           px-4 py-2 rounded-lg transition-colors text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingCode ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}

          {pwStep === 'codeSent' && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <p className="text-cream-300/60 text-sm">
                Enter the 6-digit code sent to <span className="text-coffee-300">{user.email}</span>
              </p>

              <div>
                <label className="block text-cream-300/60 text-xs mb-1">Verification Code</label>
                <input
                  type="text"
                  value={pwCode}
                  onChange={(e) => setPwCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                             text-cream-200 text-sm tracking-widest text-center
                             placeholder-cream-300/40 focus:outline-none focus:border-coffee-500
                             transition-colors"
                />
              </div>

              <div>
                <label className="block text-cream-300/60 text-xs mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                             text-cream-200 text-sm placeholder-cream-300/40
                             focus:outline-none focus:border-coffee-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-cream-300/60 text-xs mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5
                             text-cream-200 text-sm placeholder-cream-300/40
                             focus:outline-none focus:border-coffee-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={changingPw || pwCode.length < 6 || !newPassword}
                  className="bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium
                             px-4 py-2 rounded-lg transition-colors text-sm
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPw ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode}
                  className="text-cream-300/40 hover:text-cream-200 text-xs underline
                             disabled:opacity-50"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwStep('idle');
                    setPwCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPwErr('');
                    setPwMsg('');
                  }}
                  className="text-cream-300/40 hover:text-cream-200 text-xs underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {pwStep === 'success' && (
            <div className="p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg">
              <p className="text-emerald-400 text-sm">{pwMsg}</p>
              <button
                onClick={() => { setPwStep('idle'); setPwMsg(''); }}
                className="text-cream-300/40 hover:text-cream-200 text-xs underline mt-2"
              >
                Done
              </button>
            </div>
          )}

          {pwErr && <p className="text-java-400 text-xs mt-3">{pwErr}</p>}
          {pwMsg && pwStep === 'codeSent' && (
            <p className="text-emerald-400 text-xs mt-3">{pwMsg}</p>
          )}
        </div>
      )}

      {/* ==================== My Reviews ==================== */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8
                     a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          My Reviews
          {!reviewsLoading && reviews.length > 0 && (
            <span className="text-cream-300/40 text-xs font-normal">({reviews.length})</span>
          )}
        </h2>

        {reviewsLoading ? (
          <p className="text-cream-300/40 text-sm">Loading...</p>
        ) : reviewsErr ? (
          <p className="text-java-400 text-sm">{reviewsErr}</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-cream-300/40 text-sm mb-2">You haven't written any reviews yet</p>
            <Link to="/dashboard" className="text-coffee-300 hover:text-coffee-400 text-sm underline">
              Browse tutorials
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.reviewId} className="bg-dark-800 border border-dark-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {review.rating > 0 && <StarRating value={review.rating} size="sm" />}
                  </div>
                </div>
                <p className="text-cream-200 text-sm leading-relaxed">{review.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
