import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getAdminStats, getAllUsers, getUserProfile, banUser, unbanUser, getOnlineHistory, recordOnlineSnapshot } from '../api/admin';
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
  const [chartData, setChartData] = useState([]);
  const canvasRef = useRef(null);

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

  // Load chart history on mount
  useEffect(() => {
    getOnlineHistory()
      .then((res) => setChartData(res.data))
      .catch(() => {});
  }, []);

  // Auto-refresh stats every 30s + record snapshot for chart
  useEffect(() => {
    const interval = setInterval(() => {
      getAdminStats()
        .then((res) => {
          setStats(res.data);
          // Record snapshot (backend throttles to 1 per 4 min)
          recordOnlineSnapshot(res.data.onlineCount)
            .then((snapRes) => {
              if (snapRes.data.status === 'saved') {
                // Append new datapoint to chart
                setChartData((prev) => [
                  ...prev,
                  { timestamp: new Date().toISOString(), onlineCount: res.data.onlineCount },
                ]);
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Canvas chart drawing ──────────────────────────────────────────
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const PAD_LEFT = 45;
    const PAD_RIGHT = 20;
    const PAD_TOP = 20;
    const PAD_BOTTOM = 30;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Parse data
    const points = chartData.map((d) => ({
      time: new Date(d.timestamp).getTime(),
      count: d.onlineCount,
    }));

    const minTime = points[0].time;
    const maxTime = points[points.length - 1].time;
    const timeRange = maxTime - minTime || 1;
    const maxCount = Math.max(...points.map((p) => p.count), 1);
    const yMax = Math.ceil(maxCount * 1.2) || 2;

    // Grid lines (horizontal)
    const ySteps = Math.min(yMax, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ySteps; i++) {
      const y = PAD_TOP + chartH - (i / ySteps) * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();

      // Y labels
      const val = Math.round((i / ySteps) * yMax);
      ctx.fillStyle = 'rgba(232,221,203,0.35)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, PAD_LEFT - 8, y + 4);
    }

    // X labels (up to 6 evenly spaced)
    const xLabelCount = Math.min(points.length, 6);
    ctx.fillStyle = 'rgba(232,221,203,0.35)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < xLabelCount; i++) {
      const idx = Math.round((i / (xLabelCount - 1)) * (points.length - 1));
      const p = points[idx];
      const x = PAD_LEFT + ((p.time - minTime) / timeRange) * chartW;
      const d = new Date(p.time);
      const label = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
      ctx.fillText(label, x, H - 8);
    }

    // Map points to canvas coords
    const coords = points.map((p) => ({
      x: PAD_LEFT + ((p.time - minTime) / timeRange) * chartW,
      y: PAD_TOP + chartH - (p.count / yMax) * chartH,
    }));

    // Area fill (gradient)
    const grad = ctx.createLinearGradient(0, PAD_TOP, 0, PAD_TOP + chartH);
    grad.addColorStop(0, 'rgba(16,185,129,0.25)');
    grad.addColorStop(1, 'rgba(16,185,129,0.02)');
    ctx.beginPath();
    ctx.moveTo(coords[0].x, PAD_TOP + chartH);
    coords.forEach((c) => ctx.lineTo(c.x, c.y));
    ctx.lineTo(coords[coords.length - 1].x, PAD_TOP + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(coords[i].x, coords[i].y);
    }
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dots
    coords.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
    });
  }, [chartData]);

  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

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

      {/* Online Users Chart */}
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-cream-100 font-semibold">Online Users — Last 24 Hours</h2>
            <p className="text-cream-300/40 text-xs mt-0.5">Datapoints recorded every 4 minutes</p>
          </div>
          {chartData.length > 0 && (
            <span className="text-cream-300/30 text-xs">{chartData.length} datapoints</span>
          )}
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-cream-300/30 text-sm">
            No chart data yet — datapoints will appear as you stay on this page
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '200px' }}
          />
        )}
      </div>

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
