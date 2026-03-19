import { useState } from 'react';
import StarRating from './StarRating';
import { toggleLike, toggleDislike, editReview } from '../api/reviews';
import { containsProfanity } from '../utils/profanityFilter';

const URL_REGEX = /(https?:\/\/\S+|www\.\S+)/gi;
const REVIEW_MIN_WORDS = 10;
const REVIEW_MAX = 2000;

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

// ── Canvas share card ────────────────────────────────────
function drawStar(ctx, cx, cy, r) {
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) {
        lines[lines.length - 1] += '...';
        return lines;
      }
    } else {
      current = test;
    }
  }
  if (current) {
    if (lines.length >= maxLines) {
      lines[lines.length - 1] += '...';
    } else {
      lines.push(current);
    }
  }
  return lines;
}

function generateShareCard(review, tutorialTitle) {
  const W = 600;
  const H = 340;
  const PAD = 32;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1c1714');
  bg.addColorStop(1, '#110f0d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Top accent bar
  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, '#8B6B4A');
  accent.addColorStop(1, '#C4956A');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 3);

  // ── Quote mark (decorative)
  ctx.fillStyle = 'rgba(139, 107, 74, 0.12)';
  ctx.font = 'bold 120px Georgia, serif';
  ctx.fillText('\u201C', PAD - 10, 110);

  // ── Tutorial title
  ctx.fillStyle = '#8B6B4A';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  let title = tutorialTitle || 'Tutorial Review';
  if (title.length > 70) title = title.slice(0, 67) + '...';
  ctx.fillText(title.toUpperCase(), PAD, 34);

  // ── Divider
  ctx.strokeStyle = '#2a2520';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 46);
  ctx.lineTo(W - PAD, 46);
  ctx.stroke();

  // ── Stars
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < review.rating ? '#C4956A' : '#2a2520';
    drawStar(ctx, PAD + 10 + i * 24, 66, 9);
  }

  // ── Review body
  ctx.fillStyle = '#e8e0d6';
  ctx.font = '400 15px system-ui, -apple-system, sans-serif';
  const lines = wrapText(ctx, review.body, W - PAD * 2, 7);
  let y = 100;
  for (const line of lines) {
    ctx.fillText(line, PAD, y);
    y += 22;
  }

  // ── Bottom section
  const bottomY = H - 28;

  // Username
  ctx.fillStyle = '#C4956A';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('— ' + (review.username || 'Anonymous'), PAD, bottomY);

  // Watermark
  ctx.fillStyle = '#3a3530';
  ctx.font = '700 13px system-ui, -apple-system, sans-serif';
  const wm = 'TutorRev.live';
  const wmW = ctx.measureText(wm).width;
  ctx.fillText(wm, W - wmW - PAD, bottomY);

  // ── Bottom accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 3, W, 3);

  return canvas;
}

function getShareUrl(reviewId) {
  // The share/OG endpoint lives on the backend (VITE_API_URL), not the frontend origin
  const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, '');
  return `${base}/api/v1/share/review/${reviewId}`;
}

async function handleShare(review, tutorialTitle) {
  const shareUrl = getShareUrl(review.reviewId);

  // Try native share first (mobile) with URL
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'TutorRev Review',
        text: `Review by ${review.username} on TutorRev.live`,
        url: shareUrl,
      });
      return 'shared';
    } catch {
      // cancelled or unsupported — fall through to clipboard
    }
  }

  // Fallback — copy link to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}

async function handleDownloadCard(review, tutorialTitle) {
  const canvas = generateShareCard(review, tutorialTitle);
  const link = document.createElement('a');
  link.download = 'tutorrev-review.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── Component ────────────────────────────────────────────
export default function ReviewItem({ review, isAdmin, onDelete, avatarUrl, currentUsername, onReviewUpdate, tutorialTitle }) {
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareStatus, setShareStatus] = useState(null); // null | 'copied' | 'shared' | 'failed'

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

    const wordCount = editBody.trim().split(/\s+/).length;
    if (wordCount < REVIEW_MIN_WORDS) {
      setEditError(`Review must be at least ${REVIEW_MIN_WORDS} words`);
      return;
    }
    if (editBody.trim().length > REVIEW_MAX) {
      setEditError(`Review cannot exceed ${REVIEW_MAX} characters`);
      return;
    }

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

  async function onShareClick() {
    const result = await handleShare(review, tutorialTitle);
    setShareStatus(result);
    if (result === 'copied') {
      setTimeout(() => setShareStatus(null), 2000);
    }
  }

  return (
    <div id={`review-${review.reviewId}`} className="bg-dark-800 border border-dark-600 rounded-lg p-4">
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
          {!editing && (
            <div className="flex items-center gap-1">
              {shareStatus === 'copied' && (
                <span className="text-xs text-emerald-400 animate-pulse">Copied!</span>
              )}
              <button
                onClick={onShareClick}
                className="text-xs text-cream-300/40 hover:text-coffee-300 transition-colors"
                title="Copy share link"
              >
                {/* Link icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              <button
                onClick={() => handleDownloadCard(review, tutorialTitle)}
                className="text-xs text-cream-300/40 hover:text-coffee-300 transition-colors"
                title="Download review card"
              >
                {/* Download icon */}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          )}
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
