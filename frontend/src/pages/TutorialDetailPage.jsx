import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTutorial, deleteTutorial } from '../api/tutorials';
import { createReview, deleteReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import LevelBadge from '../components/LevelBadge';
import ReviewItem from '../components/ReviewItem';
import ReviewForm from '../components/ReviewForm';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TutorialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [tutorial, setTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  function fetchTutorial() {
    return getTutorial(id)
      .then((res) => setTutorial(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load tutorial'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchTutorial();
  }, [id]);

  async function handleReviewSubmit(reviewBody) {
    await createReview(reviewBody, id);
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
        <h2 className="text-lg font-semibold text-cream-100 mb-4">
          Reviews ({reviews.length})
        </h2>

        {/* Add Review */}
        <div className="mb-6">
          <ReviewForm onSubmit={handleReviewSubmit} />
        </div>

        {/* Review List */}
        {reviews.length === 0 ? (
          <p className="text-cream-300/40 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewItem key={review.reviewId} review={review} isAdmin={isAdmin} onDelete={handleReviewDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
