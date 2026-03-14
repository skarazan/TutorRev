import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import LevelBadge from './LevelBadge';

function Slide({ tutorial }) {
  const thumbnails = tutorial.backdrops?.[0] || [];
  const thumbnail = thumbnails[thumbnails.length - 1] || thumbnails[0] || '';
  const reviews = tutorial.reviewIds || [];
  const ratedReviews = reviews.filter((r) => r.rating > 0);
  const avgRating = ratedReviews.length > 0
    ? ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length
    : 0;

  return (
    <Link to={`/tutorials/${tutorial.id}`} className="block w-full flex-shrink-0">
      <div className="relative aspect-[21/9] sm:aspect-[21/9] max-sm:aspect-video">
        {thumbnail && (
          <img
            src={thumbnail}
            alt={tutorial.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <p className="text-coffee-300 text-xs font-medium uppercase tracking-wider mb-2">
            Featured
          </p>
          <h2 className="text-cream-100 text-lg sm:text-2xl font-bold line-clamp-2 mb-2">
            {tutorial.title}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-cream-300/70">{tutorial.channel}</span>
            <LevelBadge level={tutorial.level} />
            {avgRating > 0 && (
              <div className="flex items-center gap-1.5">
                <StarRating value={Math.round(avgRating)} size="sm" />
                <span className="text-cream-300/60 text-xs">
                  {avgRating.toFixed(1)}
                </span>
              </div>
            )}
            <span className="text-cream-300/40 text-xs">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedCarousel({ tutorials }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const total = tutorials.length;

  const goTo = useCallback((index) => {
    setCurrent((index + total) % total);
  }, [total]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused, total]);

  if (!tutorials.length) return null;

  return (
    <div
      className="relative mb-8 rounded-lg overflow-hidden bg-dark-800"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Sliding track */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {tutorials.map((tutorial) => (
          <Slide key={tutorial.id} tutorial={tutorial} />
        ))}
      </div>

      {/* Arrow buttons */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); goTo(current - 1); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-900/60 hover:bg-dark-900/80 text-cream-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); goTo(current + 1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-900/60 hover:bg-dark-900/80 text-cream-100 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {tutorials.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); goTo(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === current ? 'bg-coffee-300' : 'bg-cream-300/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
