import { useState } from 'react';
import StarRating from './StarRating';
import { toggleLike, toggleDislike } from '../api/reviews';

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
          {review.rating > 0 && <StarRating value={review.rating} size="sm" />}
          <span className="text-cream-300/30 text-xs">{formatTime(review.createdAt)}</span>
        </div>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-java-400/60 hover:text-java-400 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

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
    </div>
  );
}
