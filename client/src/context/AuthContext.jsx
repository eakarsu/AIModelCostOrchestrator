import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || 'null');
    } catch {
      localStorage.removeItem('auth_user');
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'undefined' || storedToken === 'null') {
      localStorage.removeItem('token');
      return null;
    }
    return storedToken;
  });
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // On mount, verify token if it exists
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    setLoading(true);

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          const error = new Error('Invalid token');
          error.isAuthenticationFailure = true;
          throw error;
        }
        if (!res.ok) throw new Error(`Session verification failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const payload = data.data || data;
        const verifiedUser = data.user || payload.user || payload;
        localStorage.setItem('auth_user', JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return;
        if (error.isAuthenticationFailure) {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        } else {
          toast.error('Unable to verify the session. Retrying on the next request.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    const payload = data.data || data;
    const newToken = payload.token;
    const userData = payload.user || data.user || { email };

    if (!newToken || typeof newToken !== 'string') {
      throw new Error('Login response did not include an access token');
    }

    localStorage.setItem('token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    toast.success(`Welcome back, ${userData.name || userData.email}!`);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
