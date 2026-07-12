import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthUser { id: string; email: string; name: string; role: string; orgId: string | null; mustChangePassword: boolean; }
interface AuthCtx {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  can: (resource: string) => boolean;
  clearMustChange: () => void;
}

const PERMISSIONS: Record<string, string[]> = {
  ADMIN:             ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel-expenses', 'analytics', 'settings'],
  FLEET_MANAGER:     ['dashboard', 'fleet', 'drivers', 'trips', 'maintenance', 'fuel-expenses', 'analytics', 'settings'],
  DISPATCHER:        ['dashboard', 'fleet', 'trips'],
  SAFETY_OFFICER:    ['dashboard', 'drivers', 'trips', 'maintenance'],
  FINANCIAL_ANALYST: ['dashboard', 'fleet', 'fuel-expenses', 'analytics'],
};

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });

  const login = (t: string, u: AuthUser) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null); setUser(null);
  };

  const clearMustChange = () => {
    if (!user) return;
    const updated = { ...user, mustChangePassword: false };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const can = (resource: string) => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(resource) ?? false;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, can, clearMustChange }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { PERMISSIONS };
