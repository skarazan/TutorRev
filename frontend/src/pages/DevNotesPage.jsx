import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDevNotes, createDevNote, deleteDevNote } from '../api/devnotes';
import { containsProfanity } from '../utils/profanityFilter';

export default function DevNotesPage() {
  const { isAdmin } = useAuth();
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAllDevNotes()
      .then((res) => setNotes(res.data))
      .catch(() => setError('Failed to load dev notes'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (containsProfanity(trimmed)) {
      setError('Note contains inappropriate language');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await createDevNote(trimmed);
      setNotes((prev) => [res.data, ...prev]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post note');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(noteId) {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteDevNote(noteId);
      setNotes((prev) => prev.filter((n) => n.noteId !== noteId));
    } catch {
      setError('Failed to delete note');
    }
  }

  function formatTime(instant) {
    if (!instant) return '';
    const date = new Date(instant);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-cream-100 flex items-center gap-2">
          <svg className="w-6 h-6 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414
                     a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Dev Notes
        </h1>
        <p className="text-cream-300/60 text-sm mt-1">Updates and announcements from the team</p>
      </div>

      {/* Admin create form */}
      {isAdmin && (
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
          <h2 className="text-cream-100 font-semibold text-sm mb-3">Post a Note</h2>
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write an update, announcement, or note..."
              maxLength={500}
              rows={3}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3
                         text-cream-200 text-sm placeholder-cream-300/30
                         focus:outline-none focus:border-coffee-500 transition-colors resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-cream-300/30 text-xs">{content.length}/500</span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="bg-coffee-500 hover:bg-coffee-400 text-cream-100
                           font-medium px-5 py-2 rounded-lg transition-colors text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-java-600/10 border border-java-600/30 rounded-lg">
          <p className="text-java-400 text-sm">{error}</p>
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <p className="text-cream-300/40 text-sm text-center py-8">Loading...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-cream-300/40 text-lg mb-1">No dev notes yet</p>
          <p className="text-cream-300/30 text-sm">Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.noteId} className="bg-dark-700 border border-dark-600 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-coffee-500 flex items-center
                                  justify-center text-xs text-cream-100 font-medium">
                    {note.author?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-coffee-300">{note.author}</span>
                    <span className="text-cream-300/30 text-xs ml-2">{formatTime(note.createdAt)}</span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(note.noteId)}
                    className="text-xs text-java-400/60 hover:text-java-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-cream-200 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
