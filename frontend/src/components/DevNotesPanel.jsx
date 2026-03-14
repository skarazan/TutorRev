import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllDevNotes, createDevNote, deleteDevNote } from '../api/devnotes';
import { containsProfanity } from '../utils/profanityFilter';

export default function DevNotesPanel() {
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
    <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
      {/* Header */}
      <h2 className="text-cream-100 font-semibold text-sm mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-coffee-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414
                   a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Dev Notes
      </h2>

      {/* Admin create form */}
      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Post a note..."
            maxLength={500}
            rows={2}
            className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2
                       text-cream-200 text-sm placeholder-cream-300/30
                       focus:outline-none focus:border-coffee-500 transition-colors resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="mt-2 w-full bg-coffee-500 hover:bg-coffee-400 text-cream-100
                       font-medium px-3 py-1.5 rounded-lg transition-colors text-xs
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post Note'}
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <p className="text-java-400 text-xs mb-3">{error}</p>
      )}

      {/* Notes list */}
      {loading ? (
        <p className="text-cream-300/40 text-xs">Loading...</p>
      ) : notes.length === 0 ? (
        <p className="text-cream-300/40 text-xs">No dev notes yet.</p>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          {notes.map((note) => (
            <div key={note.noteId} className="bg-dark-800 border border-dark-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-coffee-500 flex items-center
                                  justify-center text-[10px] text-cream-100 font-medium">
                    {note.author?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-xs font-medium text-coffee-300">{note.author}</span>
                  <span className="text-cream-300/30 text-[10px]">{formatTime(note.createdAt)}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(note.noteId)}
                    className="text-[10px] text-java-400/60 hover:text-java-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-cream-200 text-xs leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
