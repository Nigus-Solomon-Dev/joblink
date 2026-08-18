"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api/auth-storage";
import { onSessionExpired, refreshAccessToken } from "@/lib/api/http";
import type { User } from "@/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (payload: { email: string; password: string }) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: "job_seeker" | "employer";
  }) => Promise<User>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const bootstrap = useCallback(async () => {
    let token = getAccessToken();
    if (!token) {
      token = await refreshAccessToken();
    }
    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const { user: currentUser } = await authApi.getMeRequest();
      setUser(currentUser);
      setStatus("authenticated");
    } catch {
      clearAccessToken();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    const taskId = setTimeout(() => void bootstrap(), 0);
    return () => clearTimeout(taskId);
  }, [bootstrap]);

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
      setStatus("unauthenticated");
      router.push("/login");
    });
    return unsubscribe;
  }, [router]);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      const { user: loggedInUser, accessToken } = await authApi.loginRequest({ email, password });
      if (accessToken) setAccessToken(accessToken);
      setUser(loggedInUser);
      setStatus("authenticated");
      return loggedInUser;
    },
    [],
  );

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      role: "job_seeker" | "employer";
    }) => {
      const { user: registeredUser } = await authApi.registerRequest(payload);
      return registeredUser;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logoutRequest();
    } catch {
      // Session already invalid; still clear local state.
    }
    clearAccessToken();
    setUser(null);
    setStatus("unauthenticated");
    router.push("/");
  }, [router]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAllRequest();
    } catch {
      // Ignore; clear local state regardless.
    }
    clearAccessToken();
    setUser(null);
    setStatus("unauthenticated");
    router.push("/");
  }, [router]);

  const refetchUser = useCallback(async () => {
    const { user: currentUser } = await authApi.getMeRequest();
    setUser(currentUser);
    setStatus("authenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, logoutAll, refetchUser }),
    [user, status, login, register, logout, logoutAll, refetchUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}