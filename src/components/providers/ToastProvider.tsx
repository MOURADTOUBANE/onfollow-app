'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '../graphics/Icon';

type Kind = 'ok' | 'err' | 'info';
interface Item { id: number; kind: Kind; msg: ReactNode; action?: { label: string; href: string }; out?: boolean }
type ToastFn = (msg: ReactNode, o?: { type?: Kind; action?: { label: string; href: string } }) => void;

const Ctx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const idRef = useRef(0);
  const toast = useCallback<ToastFn>((msg, o = {}) => {
    const id = ++idRef.current;
    const kind = o.type ?? 'ok';
    const life = kind === 'err' ? 5200 : 3800;
    setItems((x) => [...x.slice(-2), { id, kind, msg, action: o.action }]);
    setTimeout(() => setItems((x) => x.map((t) => (t.id === id ? { ...t, out: true } : t))), life);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), life + 260);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      {/* Keep #toasts as a DOM sibling of .layout-app (the CSS lifts it above the mobile tab bar) */}
      <div id="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}${t.out ? ' out' : ''}`} role={t.kind === 'err' ? 'alert' : 'status'}>
            <span className="t-ic"><Icon name={t.kind === 'err' ? 'alert' : t.kind === 'info' ? 'info' : 'check'} size={16} /></span>
            <span>
              {t.msg}
              {t.action && <Link href={t.action.href}>{t.action.label}</Link>}
            </span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
