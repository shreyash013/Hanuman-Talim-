import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const DEFAULT_ADMIN = {
  id: 101,
  name: 'सुमेध गवडे (अध्यक्ष)',
  email: 'president@mandal.org',
  mobile: '9822099999',
  role: 'admin',
  status: 'active'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ganpati_mandal_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ganpati_mandal_token') || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.user) {
            let fetchedUser = res.user;
            if (fetchedUser && (fetchedUser.email === 'president@mandal.org' || fetchedUser.email === 'admin@ganeshmandal.org')) {
              fetchedUser = { ...fetchedUser, role: 'admin' };
            } else if (fetchedUser && (fetchedUser.email === 'treasurer@mandal.org' || fetchedUser.email === 'treasurer@ganeshmandal.org')) {
              fetchedUser = { ...fetchedUser, role: 'treasurer' };
            }
            setUser(fetchedUser);
            localStorage.setItem('ganpati_mandal_user', JSON.stringify(fetchedUser));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.success && res.token) {
        let loggedUser = res.user;
        if (loggedUser && (loggedUser.email === 'president@mandal.org' || loggedUser.email === 'admin@ganeshmandal.org')) {
          loggedUser = { ...loggedUser, role: 'admin' };
        }
        setToken(res.token);
        setUser(loggedUser);
        localStorage.setItem('ganpati_mandal_token', res.token);
        localStorage.setItem('ganpati_mandal_user', JSON.stringify(loggedUser));
        return { success: true, user: loggedUser };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, mobile, email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { name, mobile, email, password });
      if (res.success) {
        return { success: true, user: res.user, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ganpati_mandal_token');
    localStorage.removeItem('ganpati_mandal_user');
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.role);
  };

  const isAdmin = user?.role === 'admin';
  const isTreasurer = user?.role === 'treasurer';
  const isSecretary = user?.role === 'secretary';
  const isVolunteer = user?.role === 'volunteer';
  const isMember = user?.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isTreasurer,
        isSecretary,
        isVolunteer,
        isMember
      }}
    >
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
