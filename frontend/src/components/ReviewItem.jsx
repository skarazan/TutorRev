import { useState } from 'react';

export default function ReviewItem({ review, isAdmin, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this review?')) return;
    setDeleting(true);
    try {
      await onDelete(review.reviewId);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-coffee-500 flex items-center justify-center text-xs text-cream-100 font-medium">
            {review.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="text-sm font-medium text-coffee-300">{review.username || 'Anonymous'}</span>
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
      <p className="text-cream-200 text-sm leading-relaxed">{review.body}</p>
    </div>
  );
}
