import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../api/tutorials';
import StarRating from '../components/StarRating';
import LevelBadge from '../components/LevelBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function RankingsPage() {
  // Hydrate from localStorage cache instantly (shares cache with Dashboard)
  const cached = useMemo(() => {
    try {
      const raw = localStorage.getItem('dashboardCache');
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  }, []);

  const [tutorials, setTutorials] = useState(cached?.tutorials || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllTutorials()
      .then((res) => {
        setTutorials(res.data);
        try { localStorage.setItem('dashboardCache', JSON.stringify({ tutorials: res.data })); } catch { /* quota */ }
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load tutorials'))
      .finally(() => setLoading(false));
  }, []);

  // ── Best Tutorials of the Year — Top 10 by all-time avg rating ──
  const bestOfYear = useMemo(() => {
    return tutorials
      .map((t) => {
        const rated = (t.reviewIds || []).filter((r) => r.rating > 0);
        const avg = rated.length > 0
          ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
          : 0;
        return { ...t, _avgRating: avg, _ratedCount: rated.length };
      })
      .filter((t) => t._ratedCount >= 1)
      .sort((a, b) => b._avgRating - a._avgRating || b._ratedCount - a._ratedCount)
      .slice(0, 10);
  }, [tutorials]);

  // ── Java Tutorial of the Month — rated by reviews posted this month ──
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const javaOfMonth = useMemo(() => {
    return tutorials
      .filter((t) => {
        const topics = t.topics?.[0] || [];
        return topics.some((topic) => topic.toLowerCase().includes('java'));
      })
      .map((t) => {
        const monthlyRated = (t.reviewIds || []).filter((r) => {
          if (r.rating <= 0) return false;
          const d = new Date(r.createdAt);
          return d >= monthStart;
        });
        const avg = monthlyRated.length > 0
          ? monthlyRated.reduce((sum, r) => sum + r.rating, 0) / monthlyRated.length
          : 0;
        return { ...t, _monthAvg: avg, _monthCount: monthlyRated.length };
      })
      .filter((t) => t._monthCount >= 1)
      .sort((a, b) => b._monthAvg - a._monthAvg || b._monthCount - a._monthCount)
      .slice(0, 5);
  }, [tutorials]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-java-400 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-cream-100 mb-1">Rankings</h1>
        <p className="text-cream-300/50 text-sm">Top-rated tutorials on TutorRev</p>
      </div>

      {/* ── Section 1: Best Tutorials of 2026 ────────────────── */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏆</span>
          <div>
            <h2 className="text-xl font-bold text-cream-100">Best Tutorials of {now.getFullYear()}</h2>
            <p className="text-cream-300/40 text-xs mt-0.5">Top 10 by average rating</p>
          </div>
        </div>

        {bestOfYear.length === 0 ? (
          <p className="text-cream-300/40 text-sm">No rated tutorials yet.</p>
        ) : (
          <div className="space-y-3">
            {bestOfYear.map((t, i) => {
              const thumbnails = t.backdrops?.[0] || [];
              const thumb = thumbnails[thumbnails.length - 1] || thumbnails[0] || '';
              const topics = t.topics?.[0] || [];
              return (
                <Link
                  key={t.id}
                  to={`/tutorials/${t.id}`}
                  className="flex items-center gap-4 bg-dark-800 border border-dark-600 rounded-lg p-3 hover:border-coffee-500 transition-colors group"
                >
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm
                    ${i === 0 ? 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40' :
                      i === 1 ? 'bg-gray-300/10 text-gray-300 ring-1 ring-gray-400/30' :
                      i === 2 ? 'bg-orange-400/15 text-orange-300 ring-1 ring-orange-400/30' :
                      'bg-dark-700 text-cream-300/50'}`}
                  >
                    {i + 1}
                  </div>

                  {/* Thumbnail */}
                  {thumb && (
                    <div className="flex-shrink-0 w-28 aspect-video rounded overflow-hidden bg-dark-700">
                      <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-cream-100 font-medium text-sm line-clamp-1 mb-1">
                      {t.title}
                    </h3>
                    <p className="text-cream-300/40 text-xs mb-1.5">{t.channel}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <LevelBadge level={t.level} />
                      {topics.slice(0, 2).map((topic, j) => (
                        <span key={j} className="bg-dark-600 text-coffee-300 text-xs px-2 py-0.5 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1.5 mb-1">
                      <StarRating value={Math.round(t._avgRating)} size="sm" />
                      <span className="text-coffee-300 font-bold text-sm">{t._avgRating.toFixed(1)}</span>
                    </div>
                    <span className="text-cream-300/30 text-xs">
                      {t._ratedCount} review{t._ratedCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: Java Tutorial of the Month ──────────── */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">☕</span>
          <div>
            <h2 className="text-xl font-bold text-cream-100">Java Tutorial of the Month</h2>
            <p className="text-cream-300/40 text-xs mt-0.5">{monthLabel} — ranked by reviews this month</p>
          </div>
        </div>

        {javaOfMonth.length === 0 ? (
          <div className="bg-dark-800 border border-dark-600 rounded-lg p-8 text-center">
            <p className="text-cream-300/40 text-sm">No Java tutorials have been reviewed this month yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* #1 — Hero card */}
            {(() => {
              const t = javaOfMonth[0];
              const thumbnails = t.backdrops?.[0] || [];
              const thumb = thumbnails[thumbnails.length - 1] || thumbnails[0] || '';
              const topics = t.topics?.[0] || [];
              return (
                <Link
                  to={`/tutorials/${t.id}`}
                  className="block bg-dark-800 border border-coffee-500/30 rounded-lg overflow-hidden hover:border-coffee-500 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Large thumbnail */}
                    {thumb && (
                      <div className="sm:w-80 flex-shrink-0 aspect-video sm:aspect-auto overflow-hidden bg-dark-700">
                        <img
                          src={thumb}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-yellow-500/40">
                          #1 This Month
                        </span>
                        <LevelBadge level={t.level} />
                      </div>
                      <h3 className="text-cream-100 font-semibold text-lg mb-1 line-clamp-2">
                        {t.title}
                      </h3>
                      <p className="text-cream-300/50 text-sm mb-3">{t.channel}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <StarRating value={Math.round(t._monthAvg)} size="sm" />
                        <span className="text-coffee-300 font-bold">{t._monthAvg.toFixed(1)}</span>
                        <span className="text-cream-300/30 text-xs">
                          from {t._monthCount} review{t._monthCount !== 1 ? 's' : ''} this month
                        </span>
                      </div>
                      {topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {topics.slice(0, 4).map((topic, j) => (
                            <span key={j} className="bg-dark-600 text-coffee-300 text-xs px-2 py-0.5 rounded-full">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })()}

            {/* #2-5 runners up */}
            {javaOfMonth.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-cream-300/40 text-xs font-medium uppercase tracking-wider mt-2">Runners Up</h3>
                {javaOfMonth.slice(1).map((t, i) => {
                  const thumbnails = t.backdrops?.[0] || [];
                  const thumb = thumbnails[thumbnails.length - 1] || thumbnails[0] || '';
                  return (
                    <Link
                      key={t.id}
                      to={`/tutorials/${t.id}`}
                      className="flex items-center gap-4 bg-dark-800 border border-dark-600 rounded-lg p-3 hover:border-coffee-500 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center font-bold text-sm text-cream-300/50">
                        {i + 2}
                      </div>
                      {thumb && (
                        <div className="flex-shrink-0 w-24 aspect-video rounded overflow-hidden bg-dark-700">
                          <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-cream-100 font-medium text-sm line-clamp-1">{t.title}</h4>
                        <p className="text-cream-300/40 text-xs">{t.channel}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1.5">
                          <StarRating value={Math.round(t._monthAvg)} size="sm" />
                          <span className="text-coffee-300 font-bold text-sm">{t._monthAvg.toFixed(1)}</span>
                        </div>
                        <span className="text-cream-300/30 text-xs">
                          {t._monthCount} review{t._monthCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
