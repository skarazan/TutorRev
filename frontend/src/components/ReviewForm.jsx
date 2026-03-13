import { useState } from 'react';
import StarRating from './StarRating';

export default function ReviewForm({ onSubmit }) {
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || rating === 0) return;

    setSubmitting(true);
    try {
      await onSubmit(body.trim(), rating);
      setBody('');
      setRating(0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-cream-300/80 mb-1">Rating</label>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your review..."
        rows={3}
        className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors resize-none text-sm"
      />
      <button
        type="submit"
        disabled={!body.trim() || rating === 0 || submitting}
        className="bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium px-5 py-2 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
