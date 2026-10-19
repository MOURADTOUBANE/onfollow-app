'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Application, ApplicationInput, FollowUp, FollowUpStatus, Status } from '@/lib/types';
import { isoOff } from '@/lib/dates';
import { useAuth } from './AuthProvider';

/**
 * Shared cache for the signed-in area: every application + every follow-up.
 * Board, Overview, Follow-up center and the nav badges read from here; mutations go through the API
 * layer first and then update this cache. (The List page and the Detail page fetch their own data.)
 *
 * TODO(API): the initial load asks for up to 500 applications in one call. If a user can have more,
 * add pagination here or a dedicated board endpoint.
 */
interface DataCtx {
  apps: Application[];
  followUps: FollowUp[];
  ready: boolean;
  reload: () => Promise<void>;
  createApp: (input: ApplicationInput) => Promise<Application>;
  updateApp: (id: number, patch: Partial<ApplicationInput>) => Promise<Application>;
  deleteApp: (id: number) => Promise<void>;
  /** Optimistic status change. Rolls back and re-throws (ApiError 409) if the API refuses. */
  move: (id: number, to: Status) => Promise<void>;
  createFollowUp: (applicationId: number, title: string, dueAt: string) => Promise<FollowUp>;
  /** API call + cache update in one go (used by reschedule / cancel). */
  updateFollowUp: (id: number, patch: { status?: FollowUpStatus; due_at?: string }) => Promise<FollowUp>;
  /** Put an already-saved follow-up into the cache (used after the "complete" animation finished). */
  mergeFollowUp: (fu: FollowUp) => void;
}
const Ctx = createContext<DataCtx | null>(null);
export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useData must be used inside <DataProvider>');
  return c;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [ready, setReady] = useState(false);
  const appsRef = useRef(apps);
  appsRef.current = apps;
  const { user } = useAuth();
  const uid = user?.verified ? user.id : null;

  const reload = useCallback(async () => {
    // TODO(API): GET /applications?limit=500  +  GET /actions
    const [a, f] = await Promise.all([api.applications.list({ limit: 500, offset: 0 }), api.followUps.list()]);
    setApps(a.data);
    setFollowUps(f);
    setReady(true);
  }, []);
  // Load when a verified user is signed in, clear everything on logout.
  useEffect(() => {
    if (uid == null) { setApps([]); setFollowUps([]); setReady(false); return; }
    setReady(false);
    void reload().catch(() => setReady(true));
  }, [uid, reload]);

  const value: DataCtx = {
    apps, followUps, ready, reload,
    async createApp(input) {
      const a = await api.applications.create(input);
      setApps((l) => [...l, a]);
      return a;
    },
    async updateApp(id, patch) {
      const a = await api.applications.update(id, patch);
      setApps((l) => l.map((x) => (x.id === id ? a : x)));
      return a;
    },
    async deleteApp(id) {
      await api.applications.remove(id);
      setApps((l) => l.filter((x) => x.id !== id));
      setFollowUps((l) => l.filter((x) => x.application_id !== id));
    },
    async move(id, to) {
      const before = appsRef.current;
      const now = new Date().toISOString();
      setApps((l) => l.map((a) => (a.id === id ? { ...a, status: to, applied_at: to === 'applied' && !a.applied_at ? isoOff(0) : a.applied_at, updated_at: now } : a)));
      try {
        await api.applications.setStatus(id, to); // TODO(API): POST /applications/{id}/status
      } catch (e) {
        setApps(before);
        throw e;
      }
    },
    async createFollowUp(applicationId, title, dueAt) {
      const f = await api.followUps.create(applicationId, title, dueAt);
      setFollowUps((l) => [...l, f]);
      return f;
    },
    async updateFollowUp(id, patch) {
      const f = await api.followUps.update(id, patch);
      setFollowUps((l) => l.map((x) => (x.id === id ? f : x)));
      return f;
    },
    mergeFollowUp(fu) { setFollowUps((l) => l.map((x) => (x.id === fu.id ? fu : x))); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
