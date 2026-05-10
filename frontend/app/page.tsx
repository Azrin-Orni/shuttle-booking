'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isInitialized || redirected.current) return;
    redirected.current = true;

    if (!user) router.replace('/login');
    else if (user.role === 'admin') router.replace('/admin/dashboard');
    else router.replace('/dashboard');
  }, [isInitialized, user, router]);

  return null;
}