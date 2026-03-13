import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../api/tutorials';
import TutorialCard from '../components/TutorialCard';
import TutorialFilters from '../components/TutorialFilters';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTutorials.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      )}
    </div>
  );
}
