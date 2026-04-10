import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@shared/models/auth";

type LoginInput = {
  username: string;
  password: string;
};

type RegisterInput = {
  name: string;
  username: string;
  password: string;
  email?: string;
  bio?: string;
  aimsNumber: string;
  waqfNumber?: string;
  wasiyatNumber?: string;
  birthDate?: string;
  interests?: string;
  achievements?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (input: LoginInput) => Promise<User | null>;
  register: (input: RegisterInput) => Promise<User | null>;
  logout: () => Promise<boolean>;
  updateProfile: (input: Partial<User>) => Promise<User | null>;
  refresh: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function readErrorMessage(res: Response, fallback: string) {
  const payload = await parseJsonSafe<{ message?: string; error?: string }>(res);
  return payload?.message || payload?.error || fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchUser = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    let timeout: number | undefined;

    try {
      const controller = new AbortController();
      timeout = window.setTimeout(() => controller.abort(), 10000);
      const res = await fetch("/api/auth/user", {
        credentials: "include",
        signal: controller.signal,
      });

      if (res.status === 401) {
        if (mountedRef.current) {
          setUser(null);
        }
        return null;
      }

      if (!res.ok) {
        const message = await readErrorMessage(res, "Failed to load user data");
        throw new Error(message);
      }

      const nextUser = await parseJsonSafe<User>(res);
      if (mountedRef.current) {
        setUser(nextUser);
      }
      return nextUser;
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Network timeout loading user data"
          : err instanceof Error
            ? err.message
            : "Failed to load user data";

      if (mountedRef.current) {
        setError(message);
        setUser(null);
      }

      return null;
    } finally {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    void fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (input: LoginInput) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Login failed"));
      }

      const nextUser = await parseJsonSafe<User>(res);
      if (mountedRef.current) {
        setUser(nextUser);
      }
      return nextUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      if (mountedRef.current) {
        setError(message);
        setUser(null);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Registration failed"));
      }

      const nextUser = await parseJsonSafe<User>(res);
      if (mountedRef.current) {
        setUser(nextUser);
      }
      return nextUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      if (mountedRef.current) {
        setError(message);
        setUser(null);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Logout failed"));
      }

      if (mountedRef.current) {
        setUser(null);
      }
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      if (mountedRef.current) {
        setError(message);
        setUser(null);
      }
      return false;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const updateProfile = useCallback(async (input: Partial<User>) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Profile update failed"));
      }

      const updatedUser = await parseJsonSafe<User>(res);
      if (mountedRef.current) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Profile update failed";
      if (mountedRef.current) {
        setError(message);
      }
      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isLoading: loading,
      error,
      isAuthenticated: !!user,
      isPending: user?.accountStatus === "pending" || user?.status === "pending",
      login,
      register,
      logout,
      updateProfile,
      refresh: fetchUser,
    }),
    [error, fetchUser, loading, login, logout, register, updateProfile, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
