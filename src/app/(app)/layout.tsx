'use client';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { NavProvider } from '@/components/providers/NavProvider';
import { RequireApp } from '@/components/providers/RouteGuard';

/**
 * Everything inside app/(app)/* is the signed-in area: it needs a verified user and is drawn inside
 * the rounded shell (top pills + icon rail). The shared data cache lives in DataProvider (Providers.tsx).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireApp>
      <NavProvider>
        <AppShell>{children}</AppShell>
      </NavProvider>
    </RequireApp>
  );
}
