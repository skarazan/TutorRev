import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../api/tutorials';
import TutorialCard from '../components/TutorialCard';
import TutorialFilters from '../components/TutorialFilters';
import FeaturedCarousel from '../components/FeaturedCarousel';
import LoadingSpinner from '../components/LoadingSpinner';
export default function DashboardPage() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    getAllTutorials()
      .then((res) => setTutorials(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load tutorials'))
      .finally(() => setLoading(false));
  }, []);

  // Extract unique topics sorted by frequency
  const availableTopics = useMemo(() => {
    const counts = {};
    tutorials.forEach((t) => {
      const topics = t.topics?.[0] || [];
      topics.forEach((topic) => {
        counts[topic] = (counts[topic] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([topic]) => topic);
  }, [tutorials]);

  // Filter tutorials based on search, level, and topics
  const filteredTutorials = useMemo(() => {
    let result = tutorials;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const title = (t.title || '').toLowerCase();
        const channel = (t.channel || '').toLowerCase();
        const topics = (t.topics?.[0] || []).map((tag) => tag.toLowerCase());
        return (
          title.includes(query) ||
          channel.includes(query) ||
          topics.some((tag) => tag.includes(query))
        );
      });
    }

    if (selectedLevel) {
      result = result.filter((t) => t.level === selectedLevel);
    }

    if (selectedTopics.length > 0) {
      result = result.filter((t) => {
        const tutorialTopics = (t.topics?.[0] || []).map((tag) => tag.toLowerCase());
        return selectedTopics.every((selected) =>
          tutorialTopics.includes(selected.toLowerCase())
        );
      });
    }

    return result;
  }, [tutorials, searchQuery, selectedLevel, selectedTopics]);

  // Top-rated tutorials for the featured carousel
  const featuredTutorials = useMemo(() => {
    return tutorials
      .map((t) => {
        const reviews = t.reviewIds || [];
        const rated = reviews.filter((r) => r.rating > 0);
        const avg = rated.length > 0
          ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
          : 0;
        return { ...t, _avgRating: avg, _ratedCount: rated.length };
      })
      .filter((t) => t._ratedCount >= 1)
      .sort((a, b) => b._avgRating - a._avgRating)
      .slice(0, 5);
  }, [tutorials]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedLevel, selectedTopics]);

  // Paginated slice
  const totalPages = Math.ceil(filteredTutorials.length / PAGE_SIZE);
  const paginatedTutorials = filteredTutorials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleTopicToggle(topic) {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  }

  function handleClearAll() {
    setSearchQuery('');
    setSelectedLevel('');
    setSelectedTopics([]);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-cream-100">Tutorials</h1>
            <p className="text-cream-300/60 text-sm mt-1">
              {tutorials.length} tutorial{tutorials.length !== 1 ? 's' : ''} shared by the community
            </p>
          </div>
          <Link
            to="/add-tutorial"
            className="bg-coffee-500 hover:bg-coffee-400 text-cream-100 font-medium px-5 py-2 rounded-lg transition-colors text-sm"
          >
            + Add Tutorial
          </Link>
        </div>

        {/* Featured Carousel */}
        {featuredTutorials.length > 0 && (
          <FeaturedCarousel tutorials={featuredTutorials} />
        )}

        {/* Search & Filters */}
        {tutorials.length > 0 && (
          <TutorialFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
            availableTopics={availableTopics}
            selectedTopics={selectedTopics}
            onTopicToggle={handleTopicToggle}
            onClearAll={handleClearAll}
            resultCount={filteredTutorials.length}
            totalCount={tutorials.length}
          />
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400">
            {error}
          </div>
        )}

        {/* Grid */}
        {tutorials.length === 0 && !error ? (
          <div className="text-center py-20">
            <p className="text-cream-300/40 text-lg mb-4">No tutorials yet</p>
            <Link
              to="/add-tutorial"
              className="text-coffee-300 hover:text-coffee-400 underline"
            >
              Be the first to add one
            </Link>
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-cream-300/40 text-lg mb-2">No tutorials match your filters</p>
            <button
              onClick={handleClearAll}
              className="text-coffee-300 hover:text-coffee-400 underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedTutorials.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-lg border border-dark-600 text-cream-200
                             hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-cream-300/50 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm rounded-lg border border-dark-600 text-cream-200
                             hover:bg-dark-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
    </div>
  );
}
