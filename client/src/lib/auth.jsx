// Auth context: holds current user + token, handles login/register/logout.
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lp_token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(creds) {
    const r = await api.login(creds);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }
  async function register(details) {
    const r = await api.register(details);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }
  async function loginWithGoogle(payload) {
    const r = await api.googleLogin(payload);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }
  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
