'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
interface ThemeCtx { mode: ThemeMode; effective: 'light' | 'dark'; setMode: (m: ThemeMode) => void }
const Ctx = createContext<ThemeCtx>({ mode: 'system', effective: 'light', setMode: () => {} });
export const useTheme = () => useContext(Ctx);

/** The <html data-theme> attribute is set before first paint by the inline script in app/layout.tsx. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [sysDark, setSysDark] = useState(false);
  useEffect(() => {
    try { const t = localStorage.getItem('jt-theme') as ThemeMode | null; if (t) setModeState(t); } catch { /* ignore */ }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSysDark(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    const r = document.documentElement;
    if (m === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', m);
    try { localStorage.setItem('jt-theme', m); } catch { /* ignore */ }
  }, []);
  const effective = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode;
  return <Ctx.Provider value={{ mode, effective, setMode }}>{children}</Ctx.Provider>;
}
