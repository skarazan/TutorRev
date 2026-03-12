import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTutorials } from '../api/tutorials';
import TutorialCard from '../components/TutorialCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAllTutorials()
      .then((res) => setTutorials(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load tutorials'))
      .finally(() => setLoading(false));
  }, []);

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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tutorials.map((tutorial) => (
            <TutorialCard key={tutorial.id} tutorial={tutorial} />
          ))}
        </div>
      )}
    </div>
  );
}
