"use client";

import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  nickname: string;
  email?: string;
  authProvider?: string;
  avatarUrl?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (storedToken && userId) {
      setToken(storedToken);
      // Fetch user profile for display name
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}/user/${userId}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setUser({
            id: data.id,
            nickname: data.nickname,
            email: data.email,
            authProvider: data.authProvider,
            avatarUrl: data.avatarUrl,
          });
          localStorage.setItem("nickname", data.nickname);
        })
        .catch(() => {
          // Token might be expired
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userId", newUser.id);
    localStorage.setItem("nickname", newUser.nickname);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("nickname");
    setToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
