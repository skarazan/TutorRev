import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-coffee-500 mb-4">404</h1>
        <p className="text-cream-300/60 mb-6">Page not found</p>
        <Link
          to="/dashboard"
          className="text-coffee-300 hover:text-coffee-400 underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
