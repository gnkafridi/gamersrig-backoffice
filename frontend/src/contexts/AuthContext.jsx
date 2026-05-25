import React, { createContext, useContext, useState } from 'react';
import { login as apiLogin, logout as apiLogout, updatePreferences } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children, onThemeChange }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const themeMode = user?.theme_mode || 'dark';

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await apiLogin({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      onThemeChange(data.user.theme_mode || 'dark');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await apiLogout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    onThemeChange('dark');
  };

  const toggleTheme = async () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    const updated = { ...user, theme_mode: next };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    onThemeChange(next);
    try {
      const { data } = await updatePreferences({ theme_mode: next });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      onThemeChange(data.theme_mode || 'dark');
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, themeMode, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
