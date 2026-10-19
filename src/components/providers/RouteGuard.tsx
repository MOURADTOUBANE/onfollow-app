'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthProvider';

/** Wrap every page under app/(app)/*: requires a signed-in AND verified user. */
export function RequireApp({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (!user.verified) router.replace('/verify');
  }, [ready, user, router]);
  if (!ready || !user || !user.verified) return null;
  return <>{children}</>;
}

/** Wrap /login and /register: bounce an already-verified user straight to the overview. */
export function RequireGuest({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RequireGuestInner>{children}</RequireGuestInner>
    </Suspense>
  );
}

function RequireGuestInner({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const justVerified = Boolean(useSearchParams().get('verified'));
  useEffect(() => {
    if (ready && user?.verified && !justVerified) router.replace('/overview');
  }, [ready, user, router, justVerified]);
  if (ready && user?.verified && !justVerified) return null;
  return <>{children}</>;
}

/** Wrap /verify: needs a signed-in user; bounce to overview once verified. */
export function RequireUnverified({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (user.verified) router.replace('/overview');
  }, [ready, user, router]);
  if (!ready || !user || user.verified) return null;
  return <>{children}</>;
}

/** Wrap /verified and /welcome: needs a signed-in, verified user. */
export function RequireVerified({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (!user.verified) router.replace('/verify');
  }, [ready, user, router]);
  if (!ready || !user || !user.verified) return null;
  return <>{children}</>;
}
