export default function RulesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-cream-100">Rules</h1>
        <p className="text-cream-300/60 text-sm mt-1">Community guidelines to keep TutorRev helpful and respectful</p>
      </div>

      {/* General conduct */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          General Conduct
        </h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">1.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">Be respectful.</span> Treat everyone with courtesy. No harassment, hate speech, or personal attacks.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">2.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">No profanity.</span> Keep the language clean. Our profanity filter will block inappropriate content.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">3.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">No spam.</span> Don't post repetitive, promotional, or irrelevant content.
            </p>
          </li>
        </ul>
      </div>

      {/* Tutorials */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Posting Tutorials
        </h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">4.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">Only programming tutorials.</span> Submit YouTube tutorials related to programming, software development, or computer science.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">5.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">No duplicates.</span> Check if a tutorial has already been posted before submitting.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">6.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">Accurate details.</span> Select the correct difficulty level and relevant topics for your submission.
            </p>
          </li>
        </ul>
      </div>

      {/* Reviews */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8
                     a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Writing Reviews
        </h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">7.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">Be honest and constructive.</span> Share genuine opinions and explain why you liked or disliked a tutorial.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">8.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">Rate fairly.</span> Use star ratings to reflect the actual quality of the tutorial.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="text-coffee-300 mt-0.5 flex-shrink-0">9.</span>
            <p className="text-cream-200 text-sm leading-relaxed">
              <span className="font-medium text-cream-100">No fake reviews.</span> Don't leave reviews on tutorials you haven't watched.
            </p>
          </li>
        </ul>
      </div>

      {/* Moderation */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <h2 className="text-cream-100 font-semibold mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Moderation
        </h2>
        <p className="text-cream-200 text-sm leading-relaxed mb-3">
          Admins reserve the right to remove any content that violates these rules. Repeated violations may result in account restrictions.
        </p>
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
          <p className="text-cream-300/60 text-xs leading-relaxed">
            Content is automatically filtered for profanity and inappropriate language. Rate limiting is in place to prevent spam. If you believe your content was wrongly removed, reach out through the Dev Notes page.
          </p>
        </div>
      </div>
    </div>
  );
}
