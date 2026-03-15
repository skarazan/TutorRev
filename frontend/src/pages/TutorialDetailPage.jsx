import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTutorial, deleteTutorial } from '../api/tutorials';
import { createReview, deleteReview } from '../api/reviews';
import { getAvatars } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import LevelBadge from '../components/LevelBadge';
import StarRating from '../components/StarRating';
import ReviewItem from '../components/ReviewItem';
import ReviewForm from '../components/ReviewForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TutorialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [avatarMap, setAvatarMap] = useState({});
  const [sortBy, setSortBy] = useState('newest');

  function fetchTutorial() {
    return getTutorial(id)
      .then((res) => {
        setTutorial(res.data);
        // Batch-fetch avatars for all reviewers
        const reviewers = res.data.reviewIds || [];
        const usernames = [...new Set(reviewers.map((r) => r.username).filter(Boolean))];
        if (usernames.length > 0) {
          getAvatars(usernames)
            .then((avatarRes) => setAvatarMap(avatarRes.data))
            .catch(() => {}); // silently ignore avatar fetch failures
        }
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load tutorial'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTutorial();
  }, [id]);

  async function handleReviewSubmit(reviewBody, rating) {
    await createReview(reviewBody, id, rating);
    await fetchTutorial(); // Re-fetch to show the new review
  }

  async function handleReviewDelete(reviewId) {
    await deleteReview(reviewId, id);
    await fetchTutorial(); // Re-fetch to update the list
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this tutorial?')) return;
    setDeleting(true);
    try {
      await deleteTutorial(id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete tutorial');
      setDeleting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-java-400 mb-4">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-coffee-300 hover:text-coffee-400 underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (!tutorial) return null;

  const topics = tutorial.topics?.[0] || [];
  const reviews = tutorial.reviewIds || [];

  // Compute average rating (only from reviews that have a rating)
  const ratedReviews = reviews.filter((r) => r.rating > 0);
  const avgRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length
    : 0;

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const copy = [...reviews];
    switch (sortBy) {
      case 'oldest':
        return copy.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case 'most_liked':
        return copy.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'newest':
      default:
        return copy.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [reviews, sortBy]);

  // Update a single review in-place after like/dislike toggle
  function handleReviewUpdate(updatedReview) {
    if (!tutorial) return;
    const newReviews = tutorial.reviewIds.map((r) =>
      r.reviewId === updatedReview.reviewId ? updatedReview : r
    );
    setTutorial({ ...tutorial, reviewIds: newReviews });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* YouTube Embed */}
      <div className="aspect-video w-full rounded-lg overflow-hidden mb-6 bg-dark-800">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${tutorial.id}`}
          title={tutorial.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Title + Meta */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream-100 mb-2">{tutorial.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-cream-300/60">{tutorial.channel}</span>
          <span className="text-dark-600">|</span>
          <LevelBadge level={tutorial.level} />
          {avgRating > 0 && (
            <>
              <span className="text-dark-600">|</span>
              <div className="flex items-center gap-1.5">
                <StarRating value={Math.round(avgRating)} size="sm" />
                <span className="text-cream-300/60 text-sm">
                  {avgRating.toFixed(1)} ({ratedReviews.length})
                </span>
              </div>
            </>
          )}
          <span className="text-dark-600">|</span>
          <a
            href={tutorial.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-coffee-300 hover:text-coffee-400 transition-colors"
          >
            Watch on YouTube
          </a>
        </div>
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {topics.map((topic, i) => (
            <span
              key={i}
              className="bg-dark-600 text-coffee-300 text-xs px-3 py-1 rounded-full"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Admin Delete */}
      {isAdmin && (
        <div className="mb-8 p-4 bg-java-600/5 border border-java-600/20 rounded-lg flex items-center justify-between">
          <span className="text-sm text-java-400">Admin: You can delete this tutorial</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-java-600 hover:bg-java-700 text-cream-100 font-medium px-4 py-1.5 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Tutorial'}
          </button>
        </div>
      )}

      {/* Reviews Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cream-100">
            Reviews ({reviews.length})
          </h2>
          {reviews.length > 1 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-1.5
                         text-cream-200 text-xs focus:outline-none focus:border-coffee-500
                         transition-colors cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most_liked">Most liked</option>
            </select>
          )}
        </div>

        {/* Add Review */}
        <div className="mb-6">
          <ReviewForm onSubmit={handleReviewSubmit} />
        </div>

        {/* Review List */}
        {reviews.length === 0 ? (
          <p className="text-cream-300/40 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {sortedReviews.map((review) => (
              <ReviewItem
                key={review.reviewId}
                review={review}
                isAdmin={isAdmin}
                onDelete={handleReviewDelete}
                avatarUrl={avatarMap[review.username]}
                currentUsername={user?.username}
                onReviewUpdate={handleReviewUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
