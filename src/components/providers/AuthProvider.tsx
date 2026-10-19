'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  /** false until the first `GET /me` finished (avoids a login-page flash on refresh) */
  ready: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>({ user: null, ready: false, setUser: () => {}, logout: async () => {} });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Restore the session on first load.
  // TODO(API): api.auth.me() calls GET /me with the stored token (see src/lib/api/auth.ts).
  useEffect(() => {
    let alive = true;
    api.auth.me().then((u) => { if (alive) setUser(u); }).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* local session is cleared even if the API rejected a missing/expired token */
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  return <Ctx.Provider value={{ user, ready, setUser, logout }}>{children}</Ctx.Provider>;
}
