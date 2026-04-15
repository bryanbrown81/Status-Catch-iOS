import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

import {
  clearToken,
  getToken,
  setOnUnauthorized,
  setToken as storeToken,
  validateToken,
} from "@/lib/api";
import type { TokenValidationResult } from "@/lib/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<TokenValidationResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const logoutInProgress = useRef(false);

  async function performLogout() {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    await clearToken();
    queryClient.clear();
    setIsAuthenticated(false);
    logoutInProgress.current = false;
  }

  useEffect(() => {
    setOnUnauthorized(() => {
      performLogout();
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        if (token) {
          const result = await validateToken();
          if (result === "valid") {
            setIsAuthenticated(true);
          } else if (result === "unauthorized") {
            await clearToken();
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(token: string): Promise<TokenValidationResult> {
    await storeToken(token);
    const result = await validateToken();
    if (result === "valid") {
      queryClient.clear();
      setIsAuthenticated(true);
    } else if (result === "unauthorized") {
      await clearToken();
    }
    return result;
  }

  async function logout() {
    await performLogout();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
