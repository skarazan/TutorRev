import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleOAuthToken(token)
        .then(() => navigate('/dashboard', { replace: true }))
        .catch(() => setError('Failed to authenticate with Google'));
    } else {
      setError('No token received from Google');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-java-400 mb-4">{error}</p>
          <a href="/login" className="text-coffee-300 hover:text-coffee-400 underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
}
