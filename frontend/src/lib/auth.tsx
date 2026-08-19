'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type SessionUser = {
  id: string;
  email?: string;
};

export type Profile = {
  id: string;
  email?: string | null;
  role: string;
  full_name?: string | null;
  college?: string | null;
  branch?: string | null;
  year?: string | null;
  created_at?: string;
};

type AuthResponse = {
  user: SessionUser | null;
  profile?: Profile | null;
};

type AuthContextValue = {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Profile | null>;
  signup: (data: {
    email: string;
    password: string;
    fullName: string;
    college: string;
    branch: string;
    year: string;
  }) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api<AuthResponse>('/auth/me');
      setUser(data.user);
      setProfile(data.profile ?? null);
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setProfile(data.profile ?? null);
    return data.profile ?? null;
  }, []);

  const signup = useCallback(
    async (data: {
      email: string;
      password: string;
      fullName: string;
      college: string;
      branch: string;
      year: string;
    }) => {
      const res = await api<{ user: SessionUser; requiresEmailConfirmation: boolean }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(res.user);
      return { requiresEmailConfirmation: res.requiresEmailConfirmation };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setProfile(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}