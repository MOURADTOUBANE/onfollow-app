'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type View = 'overview' | 'board' | 'list' | 'followups';
/** Remembers the last top-level page so the detail page can show the right breadcrumb + active tab. */
const Ctx = createContext<{ lastView: View; setLastView: (v: View) => void }>({ lastView: 'overview', setLastView: () => {} });
export const useNav = () => useContext(Ctx);
export function NavProvider({ children }: { children: ReactNode }) {
  const [lastView, setLastView] = useState<View>('overview');
  return <Ctx.Provider value={{ lastView, setLastView }}>{children}</Ctx.Provider>;
}
/** Call at the top of a top-level page. */
export function useTrackView(v: View) {
  const { setLastView } = useNav();
  useEffect(() => { setLastView(v); }, [v, setLastView]);
}
