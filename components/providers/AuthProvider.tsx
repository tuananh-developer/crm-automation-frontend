"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authService } from "@/services/auth.service";
import type { CurrentUser } from "@/types/auth";

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: "ADMIN" | "SALES") => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      authService.setSession(authService.getStoredToken()!, profile);
    } catch {
      setUser(null);
      authService.clearSession();
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (token && storedUser) {
        setUser(storedUser);
        // Optionally verify token is still valid
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          authService.setSession(token, profile);
        } catch {
          authService.clearSession();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    authService.setSession(response.accessToken, response.user);
    setUser(response.user);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role?: "ADMIN" | "SALES"
  ) => {
    const response = await authService.register({ name, email, password, role });
    authService.setSession(response.accessToken, response.user);
    setUser(response.user);
  };

  const logout = () => {
    authService.clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}