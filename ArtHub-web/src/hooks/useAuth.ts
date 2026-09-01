'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '@/lib/api/auth';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await getUserProfile();
      setUser(profile);
    } catch {
      localStorage.clear();
      setUser(null);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    router.push('/auth/login');
  };

  return { user, loading, refreshUser, logout, isAuthenticated: !!user };
}