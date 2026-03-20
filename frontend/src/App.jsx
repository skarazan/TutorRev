import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import TutorialDetailPage from './pages/TutorialDetailPage';
import AddTutorialPage from './pages/AddTutorialPage';
import ProfilePage from './pages/ProfilePage';
import DevNotesPage from './pages/DevNotesPage';
import AboutPage from './pages/AboutPage';
import RulesPage from './pages/RulesPage';
import RankingsPage from './pages/RankingsPage';
import AdminPanelPage from './pages/AdminPanelPage';
import NotFoundPage from './pages/NotFoundPage';

function LayoutWithNavbar() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutWithNavbar />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/rankings" element={<RankingsPage />} />
              <Route path="/tutorials/:id" element={<TutorialDetailPage />} />
              <Route path="/add-tutorial" element={<AddTutorialPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/devnotes" element={<DevNotesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPanelPage />} />
              </Route>
            </Route>
          </Route>

          {/* Redirects and fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
