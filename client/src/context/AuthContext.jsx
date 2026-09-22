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

function formatUserRoleAndName(u) {
  if (!u) return DEFAULT_ADMIN;
  const email = (u.email || '').toLowerCase().trim();
  const mobile = (u.mobile || '').trim();
  const name = u.name || '';

  // Explicit Protection: Guard against any accidental auto-switch to Sarthak Gavade
  if (name.toLowerCase().includes('sarthak') || email.includes('sarthak') || u.id === 2 || mobile === '9356945220') {
    return DEFAULT_ADMIN;
  }

  // Check if Treasurer
  if (email === 'shreyashgavade7@gmail.com' || email === 'treasurer@mandal.org' || email === 'treasurer@ganeshmandal.org' || u.role === 'treasurer' || name.includes('मयुर') || name.includes('बागल') || name.includes('Mayur') || name.includes('श्रेयश') || name.includes('श्रेयस')) {
    return {
      ...u,
      id: u.id || 102,
      name: 'श्रेयश गवडे (खजिनदार)',
      email: email || 'shreyashgavade7@gmail.com',
      mobile: mobile || '9356997428',
      role: 'treasurer',
      status: 'active'
    };
  }

  // Check if Adhyaksh / Admin
  if (email === 'sumedhgavade@gmail.com' || email === 'president@mandal.org' || email === 'admin@ganeshmandal.org' || u.role === 'admin' || name.includes('सचिन') || name.includes('सुमेध')) {
    return {
      ...u,
      id: u.id || 101,
      name: 'सुमेध गवडे (अध्यक्ष)',
      email: email || 'sumedhgavade@gmail.com',
      mobile: mobile || '9822099999',
      role: 'admin',
      status: 'active'
    };
  }

  // Default to Administrator if role is unprivileged member
  if (!u.role || u.role === 'member') {
    return DEFAULT_ADMIN;
  }

  return {
    ...u,
    role: u.role || 'admin'
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ganpati_mandal_user');
      const parsed = savedUser ? JSON.parse(savedUser) : null;
      if (!parsed || parsed.id === 2 || parsed.name?.toLowerCase().includes('sarthak') || parsed.email?.includes('sarthak')) {
        localStorage.setItem('ganpati_mandal_user', JSON.stringify(DEFAULT_ADMIN));
        return DEFAULT_ADMIN;
      }
      const formatted = formatUserRoleAndName(parsed);
      if (formatted && JSON.stringify(formatted) !== savedUser) {
        localStorage.setItem('ganpati_mandal_user', JSON.stringify(formatted));
      }
      return formatted || DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
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
            if (res.user.id === 2 || res.user.name?.toLowerCase().includes('sarthak') || res.user.email?.includes('sarthak')) {
              setUser(DEFAULT_ADMIN);
              localStorage.setItem('ganpati_mandal_user', JSON.stringify(DEFAULT_ADMIN));
              return;
            }
            const formattedUser = formatUserRoleAndName(res.user);
            setUser(formattedUser);
            localStorage.setItem('ganpati_mandal_user', JSON.stringify(formattedUser));
          } else {
            // Keep local formatted user if offline
          }
        } catch {
          // Keep local formatted user if offline
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
        const loggedUser = formatUserRoleAndName(res.user);
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
