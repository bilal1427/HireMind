import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId, sleep } from '../lib/utils';
import api from '../services/api';

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

const avatarColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-red-500',
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(false);
  const [initialized] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const persistAuth = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.TOKEN, jwt);
    } catch {
    }
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch {
    }
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      await sleep(600);
      const { email, role } = credentials;
      const name = email?.split('@')[0]?.replace(/[._-]/g, ' ') || 'User';
      const capitalizedName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const userData = {
        id: generateId(),
        name: capitalizedName,
        email: email || `user@hiremind.ai`,
        role: role || 'candidate',
        avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
        phone: '+91 98' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        createdAt: new Date().toISOString(),
      };
      const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify({ sub: userData.id, role: userData.role, iat: Date.now() })) +
        '.mock-signature';
      persistAuth(userData, fakeJwt);
      return { user: userData, token: fakeJwt };
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  const register = useCallback(async (data) => {
    setLoading(true);
    try {
      await sleep(800);
      const { name, email, role } = data;
      const userData = {
        id: generateId(),
        name: name || 'New User',
        email: email || 'newuser@hiremind.ai',
        role: role || 'candidate',
        avatar: avatarColors[Math.floor(Math.random() * avatarColors.length)],
        phone: '+91 98' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
        createdAt: new Date().toISOString(),
      };
      const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        btoa(JSON.stringify({ sub: userData.id, role: userData.role, iat: Date.now() })) +
        '.mock-signature';
      persistAuth(userData, fakeJwt);
      return { user: userData, token: fakeJwt };
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } catch {
      }
      return updated;
    });
  }, []);

  const isAuthenticated = !!user && !!token;
  const isCandidate = user?.role === 'candidate';
  const isRecruiter = user?.role === 'recruiter';

  const value = useMemo(() => ({
    user,
    token,
    loading,
    initialized,
    isAuthenticated,
    isCandidate,
    isRecruiter,
    login,
    register,
    logout,
    updateUser,
  }), [user, token, loading, initialized, isAuthenticated, isCandidate, isRecruiter, login, register, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
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

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function RoleRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user?.role)) {
    const fallback = user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return children;
}
