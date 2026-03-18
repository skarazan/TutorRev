import { useState } from 'react';
import StarRating from './StarRating';
import { containsProfanity } from '../utils/profanityFilter';

const URL_REGEX = /(https?:\/\/\S+|www\.\S+)/gi;
const REVIEW_MIN_WORDS = 10;
const REVIEW_MAX = 2000;

export default function ReviewForm({ onSubmit, hasReviewed }) {
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (hasReviewed) {
    return (
      <p className="text-cream-300/50 text-sm italic">
        You have already reviewed this tutorial.
      </p>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || rating === 0) return;

    const wordCount = body.trim().split(/\s+/).length;
    if (wordCount < REVIEW_MIN_WORDS) {
      setError(`Review must be at least ${REVIEW_MIN_WORDS} words`);
      return;
    }
    if (body.trim().length > REVIEW_MAX) {
      setError(`Review cannot exceed ${REVIEW_MAX} characters`);
      return;
    }

    if (containsProfanity(body)) {
      setError('Review contains inappropriate language');
      return;
    }

    // Link limit — max 1 URL
    const links = body.match(URL_REGEX) || [];
    if (links.length > 1) {
      setError('Reviews can contain at most one link');
      return;
    }

    setError('');

    setSubmitting(true);
    try {
      await onSubmit(body.trim(), rating);
      setBody('');
      setRating(0);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit review';
      setError(msg);
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
      {error && (
        <p className="text-java-400 text-sm">{error}</p>
      )}
      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your review... (min 10 words)"
          rows={3}
          maxLength={REVIEW_MAX}
          className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors resize-none text-sm"
        />
        <p className={`text-xs mt-1 text-right ${body.trim().length > REVIEW_MAX ? 'text-java-400' : 'text-cream-300/30'}`}>
          {body.trim().length}/{REVIEW_MAX}
        </p>
      </div>
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
