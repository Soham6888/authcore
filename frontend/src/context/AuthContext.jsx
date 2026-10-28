import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Sync session on mount
  useEffect(() => {
    async function loadUser() {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getCurrentUser();
        if (res.data) {
          setUser(res.data);
          tokenStorage.setTokens(null, null, res.data);
        }
      } catch (err) {
        console.warn('Initial session restore failed:', err);
        tokenStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen to 401 broadcast events from api client
    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('authcore_logout', handleLogoutEvent);
    return () => window.removeEventListener('authcore_logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authApi.login(email, password);
      const { accessToken, refreshToken } = res.data;
      
      // Fetch user profile immediately
      tokenStorage.setTokens(accessToken, refreshToken, null);
      const userRes = await authApi.getCurrentUser();
      
      tokenStorage.setTokens(accessToken, refreshToken, userRes.data);
      setUser(userRes.data);
      return userRes.data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (data) => {
    setAuthError(null);
    try {
      const res = await authApi.register(data);
      return res.data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (err) {
      console.warn('Backend logout failed:', err);
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  const hasRole = (role) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isSuperAdmin = () => hasRole('SUPER_ADMIN');
  const isAdmin = () => hasRole('ADMIN') || hasRole('SUPER_ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isSuperAdmin,
        refreshProfile: async () => {
          const res = await authApi.getCurrentUser();
          setUser(res.data);
          tokenStorage.setTokens(null, null, res.data);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
