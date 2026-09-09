/* This module intentionally exports the provider component alongside its
   hook and context object; HMR fast-refresh of the provider is not a concern. */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types/api';

interface TokenClaims {
  sub: string;
  exp: number;
}

interface DecodedToken {
  id: string;
  exp: number;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'ohas_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeToken = useCallback((value: string): DecodedToken | null => {
    try {
      const decoded = jwtDecode<TokenClaims>(value);
      return {
        id: decoded.sub,
        exp: decoded.exp,
      };
    } catch {
      return null;
    }
  }, []);

  const isTokenValid = useCallback((value: string | null): boolean => {
    if (!value) return false;

    try {
      const decoded = jwtDecode<TokenClaims>(value);
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch {
      return false;
    }
  }, []);

  const login = useCallback((accessToken: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const checkAuth = useCallback((): boolean => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedToken && isTokenValid(storedToken)) {
      const decoded = decodeToken(storedToken);
      if (decoded) {
        setToken(storedToken);
        setUser({ id: decoded.id });
        return true;
      }
    }

    logout();
    return false;
  }, [decodeToken, isTokenValid, logout]);

  useEffect(() => {
    // One-time auth bootstrap from localStorage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
    setLoading(false);
  }, [checkAuth]);

  const value: AuthContextValue = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    checkAuth,
    setUser,
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
