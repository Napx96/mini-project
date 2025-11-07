import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('ems_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ems_user') || 'null'));

  useEffect(() => {
    if (token) localStorage.setItem('ems_token', token);
    else localStorage.removeItem('ems_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('ems_user', JSON.stringify(user));
    else localStorage.removeItem('ems_user');
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/auth.php?action=login', { email, password });
    // Persist token synchronously and set the axios default header so any
    // immediately-following requests include Authorization. This prevents a
    // race where components mounted after login fire requests before the
    // token is written by the effect, causing a 401 and a redirect back to
    // the login page.
    const t = res.data.token;
    try { localStorage.setItem('ems_token', t); } catch (e) { /* ignore */ }
    api.defaults.headers.Authorization = `Bearer ${t}`;
    setToken(t);
    setUser(res.data.user);
  };

  const logout = async () => {
    if (token) {
      try { await api.post('/auth.php?action=logout'); } catch {}
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


