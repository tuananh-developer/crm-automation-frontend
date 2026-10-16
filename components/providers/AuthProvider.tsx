"use client";

import * as React from "react";
import {
  authService,
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
} from "@/services/auth.service";
import type {
  AuthContextType,
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from "@/types/auth";
import type { WorkspaceUser } from "@/types/user";

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<WorkspaceUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize auth state on client mount
  React.useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken) {
        // Ensure cookie is synchronized immediately for SSR / proxy middleware
        setStoredToken(storedToken);

        if (isMounted) {
          setToken(storedToken);
          if (storedUser) setUser(storedUser);
        }

        // Verify/refresh user profile from server
        try {
          const freshUser = await authService.getProfile();
          if (isMounted && freshUser) {
            setUser(freshUser);
            setStoredToken(storedToken);
          }
        } catch {
          // If token expired, invalid, or unauthorized, purge stale state completely
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
          clearStoredToken();
          clearStoredUser();
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = React.useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authService.login(credentials);
        setToken(res.accessToken);
        setUser(res.user);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const register = React.useCallback(
    async (data: RegisterData): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authService.register(data);
        setToken(res.accessToken);
        setUser(res.user);
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = React.useCallback(() => {
    authService.logout();
    setToken(null);
    setUser(null);
  }, []);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
