import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi, logout as logoutApi, getMe } from '../api/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

  // On mount, validate existing token
  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function loginAction(username, password) {
    const res = await loginApi(username, password);
    const { token: newToken, username: name } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', name);
    setToken(newToken);

    const meRes = await getMe();
    setUser(meRes.data);
  }

  async function registerAction(username, email, password) {
    const res = await registerApi(username, email, password);
    // Registration no longer returns a token — user must verify email first
    return res.data; // { message, email }
  }

  async function handleOAuthToken(newToken) {
    localStorage.setItem('token', newToken);
    setToken(newToken);

    const meRes = await getMe();
    localStorage.setItem('username', meRes.data.username);
    setUser(meRes.data);
  }

  async function logoutAction() {
    try {
      await logoutApi();
    } catch {
      // Ignore errors — we're clearing state anyway
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    isAdmin,
    loginAction,
    registerAction,
    logoutAction,
    handleOAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
