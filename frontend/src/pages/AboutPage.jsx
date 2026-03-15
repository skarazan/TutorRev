export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-cream-100">About TutorRev</h1>
        <p className="text-cream-300/60 text-sm mt-1">Learn more about the platform</p>
      </div>

      {/* What is TutorRev */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What is TutorRev?
        </h2>
        <p className="text-cream-200 text-sm leading-relaxed">
          TutorRev is a community-driven platform where users can share, discover, and review
          programming tutorials. Whether you're a beginner looking for the right course or an
          experienced developer wanting to recommend great content, TutorRev helps you find
          quality tutorials through honest community reviews.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          How It Works
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-coffee-500/20 flex items-center justify-center text-coffee-300 text-xs font-bold flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="text-cream-100 text-sm font-medium">Share a Tutorial</p>
              <p className="text-cream-300/60 text-xs mt-0.5">Paste a YouTube tutorial link and add details like difficulty level and topics.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-coffee-500/20 flex items-center justify-center text-coffee-300 text-xs font-bold flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="text-cream-100 text-sm font-medium">Write Reviews</p>
              <p className="text-cream-300/60 text-xs mt-0.5">Rate tutorials with stars and leave detailed reviews to help others.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-coffee-500/20 flex items-center justify-center text-coffee-300 text-xs font-bold flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="text-cream-100 text-sm font-medium">Discover Quality Content</p>
              <p className="text-cream-300/60 text-xs mt-0.5">Browse featured tutorials, filter by topic or level, and find the best resources.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Tech Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {['React 19', 'Spring Boot 4', 'MongoDB Atlas', 'Tailwind CSS', 'JWT Auth', 'Google OAuth2'].map((tech) => (
            <span key={tech} className="bg-dark-600 text-coffee-300 text-xs px-3 py-1.5 rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* GitHub link */}
      <div className="flex justify-end">
        <a
          href="https://github.com/skarazan/TutorRev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-dark-700 border border-dark-600 hover:border-cream-300/30
                     text-cream-300/60 hover:text-cream-200 px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
                     0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015
                     1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925
                     0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135
                     3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805
                     5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0
                     0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </div>
  );
}
