import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

    let mounted = true;

    api
      .get('/auth/me')
      .then((response) => {
        if (mounted) {
          setUser(response.data.data.user);
        }
      })
      .catch(() => {
        if (mounted) {
          localStorage.removeItem('djs_token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const login = useCallback(async (payload) => {
    const response = await api.post('/auth/login', payload);
    const accessToken = response.data.data.accessToken;
    localStorage.setItem('djs_token', accessToken);
    setToken(accessToken);
    setUser(response.data.data.user);
    return response.data;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post('/auth/register', payload);
    const accessToken = response.data.data.accessToken;
    localStorage.setItem('djs_token', accessToken);
    setToken(accessToken);
    setUser(response.data.data.user);
    return response.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('djs_token');
    setToken(null);
    setUser(null);
  }, []);

  const currentOrganization = useMemo(
    () => user?.ownedOrganizations?.[0] || user?.memberships?.[0]?.organization || null,
    [user]
  );

  const currentOrganizationId = useMemo(
    () => currentOrganization?.id || null,
    [currentOrganization]
  );

  const value = useMemo(
    () => ({ user, token, loading, currentOrganization, currentOrganizationId, login, register, logout }),
    [user, token, loading, currentOrganization, currentOrganizationId, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
