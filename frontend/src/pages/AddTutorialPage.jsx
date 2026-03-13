import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTutorial } from '../api/tutorials';
import StarRating from '../components/StarRating';

export default function AddTutorialPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Basic client-side YouTube URL check
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    if (!youtubeRegex.test(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createTutorial(url, reviewBody, level, rating);
      navigate(`/tutorials/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add tutorial');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-cream-100 mb-2">Add Tutorial</h1>
      <p className="text-cream-300/60 text-sm mb-8">
        Paste a YouTube URL and share your first review
      </p>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* YouTube URL */}
        <div>
          <label className="block text-sm text-cream-300/80 mb-1">YouTube URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
          />
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-sm text-cream-300/80 mb-1">Difficulty Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-cream-200 focus:outline-none focus:border-coffee-500 transition-colors"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm text-cream-300/80 mb-1">Rating</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* Review */}
        <div>
          <label className="block text-sm text-cream-300/80 mb-1">Your Review</label>
          <textarea
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            required
            rows={4}
            placeholder="What did you think of this tutorial?"
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Adding Tutorial...' : 'Add Tutorial'}
        </button>
      </form>
    </div>
  );
}
