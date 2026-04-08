// ============================================
// Auth Context — Global auth state management
// ============================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.getProfile()
        .then((res) => setUser(res.data))
        .catch(() => {
          api.clearTokens();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    api.setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.register({ name, email, password });
    api.setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    api.clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((data) => {
    setUser((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
