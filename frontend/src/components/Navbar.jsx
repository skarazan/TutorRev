import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logoutAction } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logoutAction();
    navigate('/login');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-800/95 backdrop-blur border-b border-dark-600">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/dashboard" className="text-xl font-bold text-cream-100 hover:text-coffee-300 transition-colors">
            Tutor<span className="text-coffee-300">Rev</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm text-cream-300/60 hover:text-cream-200 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/add-tutorial"
              className="text-sm text-cream-300/60 hover:text-cream-200 transition-colors"
            >
              Add Tutorial
            </Link>
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-dark-600">
              <span className="text-sm text-coffee-300">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-cream-300/40 hover:text-java-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden text-cream-200 p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2">
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-cream-300/60 hover:text-cream-200 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/add-tutorial"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm text-cream-300/60 hover:text-cream-200 transition-colors"
            >
              Add Tutorial
            </Link>
            <div className="px-3 py-2 border-t border-dark-600 mt-2 pt-2 flex items-center justify-between">
              <span className="text-sm text-coffee-300">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-cream-300/40 hover:text-java-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
