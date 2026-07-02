import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('djs_token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data.data.user);
      })
      .catch(() => {
        localStorage.removeItem('djs_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const accessToken = response.data.data.accessToken;
    localStorage.setItem('djs_token', accessToken);
    setToken(accessToken);
    setUser(response.data.data.user);
    return response.data;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const accessToken = response.data.data.accessToken;
    localStorage.setItem('djs_token', accessToken);
    setToken(accessToken);
    setUser(response.data.data.user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('djs_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
