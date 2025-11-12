import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [refresh, setRefresh] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (access) {
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [access]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth') {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            setUser(parsed.user || null);
            setAccess(parsed.access || null);
            setRefresh(parsed.refresh || null);
          } else {
            setUser(null);
            setAccess(null);
            setRefresh(null);
          }
        } catch {}
      }
    };

    const handleTokenRefreshed = (e) => {
      try {
        const raw = localStorage.getItem('auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          setAccess(parsed.access || null);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-token-refreshed', handleTokenRefreshed);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-token-refreshed', handleTokenRefreshed);
    };
  }, []);

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

    saveAuth({ user: null, access: tokens.access, refresh: tokens.refresh });

    const me = await api.get('/api/auth/profile/');

    saveAuth({ user: me.data, access: tokens.access, refresh: tokens.refresh });
    return me.data;
  };

  const refreshToken = async () => {
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    try {
      const res = await api.post('/api/auth/token/refresh/', { refresh });
      const newAccess = res.data.access;
      saveAuth({ access: newAccess });
      return newAccess;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const logout = () => {
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
    refreshToken,
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
