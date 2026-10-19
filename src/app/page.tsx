'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

/** `/` just routes to the right place; it renders nothing itself. */
export default function RootPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    router.replace(!user ? '/login' : !user.verified ? '/verify' : '/overview');
  }, [ready, user, router]);
  return null;
}
