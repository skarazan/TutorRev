import { Link } from 'react-router-dom';
import LevelBadge from './LevelBadge';
import StarRating from './StarRating';

export default function TutorialCard({ tutorial }) {
  // backdrops is List<String>[] — access inner array, pick best quality (last item)
  const thumbnails = tutorial.backdrops?.[0] || [];
  const thumbnail = thumbnails[thumbnails.length - 1] || thumbnails[0] || '';

  // topics is List<String>[] — access inner array
  const topics = tutorial.topics?.[0] || [];
  const displayTopics = topics.slice(0, 3);

  const reviews = tutorial.reviewIds || [];
  const reviewCount = reviews.length;

  // Average rating from reviews that have a rating (backwards compatible)
  const ratedReviews = reviews.filter((r) => r.rating > 0);
  const avgRating = ratedReviews.length > 0
    ? Math.round(ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length)
    : 0;

  return (
    <Link
      to={`/tutorials/${tutorial.id}`}
      className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden hover:border-coffee-500 transition-colors group"
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="aspect-video overflow-hidden bg-dark-800">
          <img
            src={thumbnail}
            alt={tutorial.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Info */}
      <div className="p-4">
        <h3 className="text-cream-100 font-medium text-sm line-clamp-2 mb-2">
          {tutorial.title}
        </h3>

        <p className="text-cream-300/50 text-xs mb-3">{tutorial.channel}</p>

        <div className="flex items-center gap-2 mb-3">
          <LevelBadge level={tutorial.level} />
          {avgRating > 0 && <StarRating value={avgRating} size="sm" />}
          <span className="text-cream-300/40 text-xs">
            {reviewCount} review{reviewCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Topic tags */}
        {displayTopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTopics.map((topic, i) => (
              <span
                key={i}
                className="bg-dark-600 text-coffee-300 text-xs px-2 py-0.5 rounded-full"
              >
                {topic}
              </span>
            ))}
            {topics.length > 3 && (
              <span className="text-cream-300/30 text-xs py-0.5">
                +{topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
