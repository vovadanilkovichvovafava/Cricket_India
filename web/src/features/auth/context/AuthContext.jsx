import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../../shared/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session from localStorage token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then(u => setUser(u))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (phone, password, countryCode = '+91') => {
    const res = await api.login({ phone, password, country_code: countryCode });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (phone, password, name, countryCode = '+91', ref = null) => {
    const data = { phone, password, name, country_code: countryCode };
    if (ref) data.ref = ref;
    const res = await api.register(data);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    api.clearCache();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
