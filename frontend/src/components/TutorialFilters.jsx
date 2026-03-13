import { useState } from 'react';

export default function TutorialFilters({
  searchQuery, onSearchChange,
  selectedLevel, onLevelChange,
  availableTopics, selectedTopics, onTopicToggle,
  onClearAll,
  resultCount, totalCount,
}) {
  const [showAllTopics, setShowAllTopics] = useState(false);

  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const visibleTopics = showAllTopics ? availableTopics : availableTopics.slice(0, 12);
  const hasActiveFilters = searchQuery || selectedLevel || selectedTopics.length > 0;

  const levelActiveStyles = {
    All: 'bg-dark-600 text-cream-200 border-dark-500',
    Beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Intermediate: 'bg-coffee-500/15 text-coffee-300 border-coffee-500/30',
    Advanced: 'bg-java-600/15 text-java-400 border-java-600/30',
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-300/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, channel, or topic..."
          className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-10 py-2.5 text-cream-200 placeholder-cream-300/40 focus:outline-none focus:border-coffee-500 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-300/40 hover:text-cream-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Level Filters + Clear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {levels.map((lvl) => {
            const value = lvl === 'All' ? '' : lvl;
            const isActive = selectedLevel === value;
            return (
              <button
                key={lvl}
                onClick={() => onLevelChange(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${
                  isActive
                    ? levelActiveStyles[lvl]
                    : 'bg-dark-800 border-dark-600 text-cream-300/50 hover:border-dark-500'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-cream-300/40 hover:text-cream-200 text-xs underline ml-3 whitespace-nowrap transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Topic Pills */}
      {availableTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTopics.map((topic) => {
            const isSelected = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                onClick={() => onTopicToggle(topic)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-coffee-500/20 text-coffee-300 border-coffee-500/40'
                    : 'bg-dark-800 text-cream-300/50 border-dark-600 hover:border-dark-500'
                }`}
              >
                {topic}
              </button>
            );
          })}
          {availableTopics.length > 12 && (
            <button
              onClick={() => setShowAllTopics(!showAllTopics)}
              className="text-xs px-2.5 py-1 rounded-full text-cream-300/30 hover:text-cream-300/50 transition-colors"
            >
              {showAllTopics ? 'Show less' : `+${availableTopics.length - 12} more`}
            </button>
          )}
        </div>
      )}

      {/* Result Count */}
      {hasActiveFilters && (
        <p className="text-cream-300/40 text-xs">
          Showing {resultCount} of {totalCount} tutorial{totalCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
