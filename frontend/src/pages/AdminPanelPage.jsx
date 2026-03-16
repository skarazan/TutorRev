import { useEffect, useState, useMemo } from 'react';
import { getAdminStats, getAllUsers, getUserProfile, banUser, unbanUser } from '../api/admin';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminPanelPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  function fetchData() {
    return Promise.all([getAdminStats(), getAllUsers()])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setUsers(usersRes.data);
      })
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh stats every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      getAdminStats()
        .then((res) => setStats(res.data))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleViewProfile(username) {
    if (selectedUser === username) {
      setSelectedUser(null);
      setSelectedProfile(null);
      return;
    }
    setSelectedUser(username);
    try {
      const res = await getUserProfile(username);
      setSelectedProfile(res.data);
    } catch {
      setSelectedProfile(null);
    }
  }

  async function handleBan(username) {
    if (!window.confirm(`Ban ${username}? They will be unable to access TutorRev or re-register.`)) return;
    setActionLoading(username);
    try {
      await banUser(username);
      await fetchData();
      if (selectedUser === username) {
        const res = await getUserProfile(username);
        setSelectedProfile(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to ban user');
    } finally {
      setActionLoading('');
    }
  }

  async function handleUnban(username) {
    setActionLoading(username);
    try {
      await unbanUser(username);
      await fetchData();
      if (selectedUser === username) {
        const res = await getUserProfile(username);
        setSelectedProfile(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unban user');
    } finally {
      setActionLoading('');
    }
  }

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-cream-100 mb-2">Admin Panel</h1>
      <p className="text-cream-300/60 text-sm mb-8">Manage users and monitor activity</p>

      {error && (
        <div className="mb-6 p-3 bg-java-600/10 border border-java-600/30 rounded-lg text-java-400 text-sm">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-java-400/60 hover:text-java-400">dismiss</button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-5">
            <p className="text-cream-300/50 text-xs uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-3xl font-bold text-cream-100">{stats.totalUsers}</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-5">
            <p className="text-cream-300/50 text-xs uppercase tracking-wider mb-1">Online Now</p>
            <p className="text-3xl font-bold text-emerald-400">{stats.onlineCount}</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-5">
            <p className="text-cream-300/50 text-xs uppercase tracking-wider mb-1">Total Admins</p>
            <p className="text-3xl font-bold text-coffee-300">{stats.totalAdmins}</p>
          </div>
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-5">
            <p className="text-cream-300/50 text-xs uppercase tracking-wider mb-1">Admins Online</p>
            <p className="text-3xl font-bold text-coffee-300">{stats.onlineAdminCount}</p>
          </div>
        </div>
      )}

      {/* Online Users */}
      {stats && stats.onlineUsers.length > 0 && (
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-6 mb-6">
          <h2 className="text-cream-100 font-semibold mb-4">
            Online Users
            <span className="text-cream-300/40 text-sm font-normal ml-2">({stats.onlineCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.onlineUsers.map((u) => (
              <div
                key={u.username}
                className="flex items-center gap-2 bg-dark-800 border border-dark-600 rounded-full px-3 py-1.5"
              >
                {u.profilePicture ? (
                  <img src={u.profilePicture} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-coffee-500 flex items-center justify-center text-[9px] text-cream-100 font-medium">
                    {u.username?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span className="text-cream-200 text-xs">{u.username}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Admins */}
      {stats && stats.onlineAdmins.length > 0 && (
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-6 mb-8">
          <h2 className="text-cream-100 font-semibold mb-4">
            Online Admins
            <span className="text-cream-300/40 text-sm font-normal ml-2">({stats.onlineAdminCount})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.onlineAdmins.map((u) => (
              <div
                key={u.username}
                className="flex items-center gap-2 bg-coffee-500/10 border border-coffee-500/20 rounded-full px-3 py-1.5"
              >
                <span className="text-coffee-300 text-xs font-medium">{u.username}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-cream-100 font-semibold">
            All Users
            <span className="text-cream-300/40 text-sm font-normal ml-2">({users.length})</span>
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-cream-200 text-sm
                       placeholder-cream-300/30 focus:outline-none focus:border-coffee-500 transition-colors w-48"
          />
        </div>

        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <div key={u.username}>
              <div className="flex items-center justify-between bg-dark-800 border border-dark-600 rounded-lg p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleViewProfile(u.username)}
                    className="text-coffee-300 hover:text-coffee-400 text-sm font-medium truncate transition-colors"
                  >
                    {u.username}
                  </button>
                  <span className="text-cream-300/30 text-xs hidden sm:inline truncate">{u.email}</span>
                  {u.roles?.includes('ROLE_ADMIN') && (
                    <span className="text-[10px] bg-coffee-500/20 text-coffee-300 px-2 py-0.5 rounded-full shrink-0">
                      Admin
                    </span>
                  )}
                  {u.banned && (
                    <span className="text-[10px] bg-java-600/20 text-java-400 px-2 py-0.5 rounded-full shrink-0">
                      Banned
                    </span>
                  )}
                </div>
                <div className="shrink-0 ml-3">
                  {!u.roles?.includes('ROLE_ADMIN') && (
                    u.banned ? (
                      <button
                        onClick={() => handleUnban(u.username)}
                        disabled={actionLoading === u.username}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === u.username ? '...' : 'Unban'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBan(u.username)}
                        disabled={actionLoading === u.username}
                        className="text-xs text-java-400/60 hover:text-java-400 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === u.username ? '...' : 'Ban'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Expanded Profile */}
              {selectedUser === u.username && selectedProfile && (
                <div className="mt-1 bg-dark-800/50 border border-dark-600 rounded-lg p-4 ml-4">
                  <div className="flex items-start gap-4">
                    {selectedProfile.profilePicture ? (
                      <img
                        src={selectedProfile.profilePicture}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-coffee-500 flex items-center justify-center text-xl text-cream-100 font-medium shrink-0">
                        {selectedProfile.username?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1.5 text-sm min-w-0">
                      <p className="text-cream-100 font-medium">{selectedProfile.username}</p>
                      <p className="text-cream-300/60">{selectedProfile.email}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProfile.roles?.map((r) => (
                          <span
                            key={r}
                            className="text-[10px] bg-coffee-500/20 text-coffee-300 px-2 py-0.5 rounded-full"
                          >
                            {r.replace('ROLE_', '')}
                          </span>
                        ))}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          selectedProfile.banned
                            ? 'bg-java-600/20 text-java-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {selectedProfile.banned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                      <p className="text-cream-300/40 text-xs">
                        Provider: {selectedProfile.provider}
                        {selectedProfile.emailVerified ? ' · Email verified' : ' · Email not verified'}
                      </p>
                      {selectedProfile.lastSeen && (
                        <p className="text-cream-300/40 text-xs">
                          Last seen: {new Date(selectedProfile.lastSeen).toLocaleString()}
                        </p>
                      )}
                      {selectedProfile.bannedAt && (
                        <p className="text-java-400/60 text-xs">
                          Banned at: {new Date(selectedProfile.bannedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <p className="text-cream-300/40 text-sm text-center py-6">No users found</p>
        )}
      </div>
    </div>
  );
}
