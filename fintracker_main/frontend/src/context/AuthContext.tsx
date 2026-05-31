import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '../types';

const TOKEN_KEY = 'fintracker_token';
const USER_KEY = 'fintracker_user';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setUser = useCallback((u: User | null, token?: string) => {
    setUserState(u);
    if (!u) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } else {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    }
  }, []);

  const logout = useCallback(() => setUser(null), [setUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
