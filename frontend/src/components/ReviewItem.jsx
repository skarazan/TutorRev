import { useState } from 'react';
import StarRating from './StarRating';
import { toggleLike, toggleDislike, editReview } from '../api/reviews';
import { containsProfanity } from '../utils/profanityFilter';

const URL_REGEX = /(https?:\/\/\S+|www\.\S+)/gi;

function formatTime(instant) {
  if (!instant) return '';
  const date = new Date(instant);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function ReviewItem({ review, isAdmin, onDelete, avatarUrl, currentUsername, onReviewUpdate }) {
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwner = currentUsername && review.username === currentUsername;

  function startEdit() {
    setEditBody(review.body);
    setEditRating(review.rating);
    setEditError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditError('');
  }

  async function saveEdit() {
    if (!editBody.trim() || editRating === 0) return;

    if (containsProfanity(editBody)) {
      setEditError('Review contains inappropriate language');
      return;
    }

    const links = editBody.match(URL_REGEX) || [];
    if (links.length > 1) {
      setEditError('Reviews can contain at most one link');
      return;
    }

    setEditError('');
    setSaving(true);
    try {
      const res = await editReview(review.reviewId, editBody.trim(), editRating);
      if (onReviewUpdate) onReviewUpdate(res.data);
      setEditing(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update review';
      setEditError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this review?')) return;
    setDeleting(true);
    try {
      await onDelete(review.reviewId);
    } catch {
      setDeleting(false);
    }
  }

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    try {
      const res = await toggleLike(review.reviewId);
      if (onReviewUpdate) onReviewUpdate(res.data);
    } catch {
      // ignore
    } finally {
      setLiking(false);
    }
  }

  async function handleDislike() {
    if (liking) return;
    setLiking(true);
    try {
      const res = await toggleDislike(review.reviewId);
      if (onReviewUpdate) onReviewUpdate(res.data);
    } catch {
      // ignore
    } finally {
      setLiking(false);
    }
  }

  const isLiked = review.likedBy?.includes(currentUsername);
  const isDisliked = review.dislikedBy?.includes(currentUsername);

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-coffee-500 flex items-center justify-center text-xs text-cream-100 font-medium">
              {review.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-medium text-coffee-300">{review.username || 'Anonymous'}</span>
          {!editing && review.rating > 0 && <StarRating value={review.rating} size="sm" />}
          <span className="text-cream-300/30 text-xs">{formatTime(review.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && !editing && (
            <button
              onClick={startEdit}
              className="text-xs text-coffee-300/60 hover:text-coffee-300 transition-colors"
            >
              Edit
            </button>
          )}
          {(isOwner || isAdmin) && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-java-400/60 hover:text-java-400 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-cream-300/60 mb-1">Rating</label>
            <StarRating value={editRating} onChange={setEditRating} />
          </div>
          {editError && (
            <p className="text-java-400 text-xs">{editError}</p>
          )}
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors resize-none text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={saveEdit}
              disabled={!editBody.trim() || editRating === 0 || saving}
              className="bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium px-4 py-1.5 rounded-lg transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              className="text-cream-300/50 hover:text-cream-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-cream-200 text-sm leading-relaxed mb-3">{review.body}</p>

          {/* Like / Dislike */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50
                          ${isLiked ? 'text-emerald-400' : 'text-cream-300/40 hover:text-emerald-400'}`}
            >
              <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z
                         M4 21h1a1 1 0 001-1v-9a1 1 0 00-1-1H4" />
              </svg>
              {review.likes > 0 && <span>{review.likes}</span>}
            </button>
            <button
              onClick={handleDislike}
              disabled={liking}
              className={`flex items-center gap-1 text-xs transition-colors disabled:opacity-50
                          ${isDisliked ? 'text-java-400' : 'text-cream-300/40 hover:text-java-400'}`}
            >
              <svg className="w-4 h-4" fill={isDisliked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z
                         M20 2h-1a1 1 0 00-1 1v9a1 1 0 001 1h1" />
              </svg>
              {review.dislikes > 0 && <span>{review.dislikes}</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
