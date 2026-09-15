/* This module intentionally exports the provider component alongside its
   hook and context object; HMR fast-refresh of the provider is not a concern. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from '../types/api';

interface TokenClaims {
  sub: string;
  exp: number;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'ohas_token';

function parseClaims(value: string): TokenClaims | null {
  try {
    return JSON.parse(atob(value.split('.')[1])) as TokenClaims;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((accessToken: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  useEffect(() => {
    // One-time auth bootstrap from localStorage on mount.
    const stored = localStorage.getItem(TOKEN_KEY);
    const claims = stored ? parseClaims(stored) : null;
    if (stored && claims && claims.exp > Date.now() / 1000) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(stored);
      setUser({ id: claims.sub });
    } else if (stored) {
      localStorage.removeItem(TOKEN_KEY);
    }
    setLoading(false);
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
