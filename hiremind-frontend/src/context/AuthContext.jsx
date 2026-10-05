import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext();

const DEFAULT_USER_CANDIDATE = {
  id: 'cand-001',
  name: 'Alex Carter',
  email: 'alex.carter@example.com',
  role: 'candidate',
  avatar: null,
};

const DEFAULT_USER_RECRUITER = {
  id: 'rec-001',
  name: 'Sarah Mitchell',
  email: 'sarah.m@techcorp.com',
  role: 'recruiter',
  avatar: null,
  company: 'TechCorp Industries',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, role = 'candidate') => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const base = role === 'recruiter' ? DEFAULT_USER_RECRUITER : DEFAULT_USER_CANDIDATE;
    setUser({ ...base, email });
    setIsLoading(false);
    return { success: true };
  };

  const register = async (data) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const base = data.role === 'recruiter' ? DEFAULT_USER_RECRUITER : DEFAULT_USER_CANDIDATE;
    setUser({ ...base, ...data });
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout, setUser }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
