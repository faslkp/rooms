import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
        setAccess(parsed.access || null);
        setRefresh(parsed.refresh || null);
      }
    } catch {}
    setLoading(false);
  }, []);

  // Keep axios header in sync with access
  useEffect(() => {
    if (access) {
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [access]);

  const saveAuth = (next) => {
    const payload = {
      user: next.user ?? user,
      access: next.access ?? access,
      refresh: next.refresh ?? refresh,
    };
    setUser(payload.user);
    setAccess(payload.access);
    setRefresh(payload.refresh);
    localStorage.setItem('auth', JSON.stringify(payload));
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    const res = await api.post('/api/auth/register/', {
      name,
      email,
      password,
      confirm_password: confirmPassword,
    });
    return res.data;
  };

  const login = async ({ email, password }) => {
    const tokenRes = await api.post('/api/auth/login/', { email, password });
    const tokens = tokenRes.data;

    // Persist tokens immediately
    saveAuth({ user: null, access: tokens.access, refresh: tokens.refresh });

    // Fetch profile
    const me = await api.get('/api/auth/profile/');

    // Save user while keeping tokens
    saveAuth({ user: me.data, access: tokens.access, refresh: tokens.refresh });
    return me.data;
  };

  const logout = () => {
    // Clear state first to trigger rerender instantly
    setUser(null);
    setAccess(null);
    setRefresh(null);
    localStorage.removeItem('auth');
  };

  const value = useMemo(() => ({
    user,
    access,
    refresh,
    loading,
    register,
    login,
    logout,
    setUser,
  }), [user, access, refresh, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
