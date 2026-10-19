'use client';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../graphics/Icon';
import type { IconName } from '../graphics/icon-data';
import { Tile } from '../ui/atoms';
import type { Status } from '@/lib/types';

/** One list entry of a menu. `status` renders the coloured status tile, `icon` a plain icon. */
export interface MenuItem {
  value?: string; label?: string; hint?: string; icon?: IconName; status?: Status;
  danger?: boolean; disabled?: boolean; divider?: boolean;
}
export interface MenuOpts {
  onSelect?: (value: string) => void; selected?: string; title?: string; foot?: ReactNode; align?: 'start' | 'end';
}
type Cur =
  | { kind: 'menu'; anchor: HTMLElement; items: MenuItem[]; opts: MenuOpts }
  | { kind: 'pop'; anchor: HTMLElement; render: (close: () => void) => ReactNode; align?: 'start' | 'end' };

interface PopApi {
  /** Open a keyboard-navigable listbox under `anchor` (status pickers, filters, row actions...). */
  menu: (anchor: HTMLElement, items: MenuItem[], opts?: MenuOpts) => void;
  /** Open any custom content under `anchor` (date range, reschedule...). */
  popover: (anchor: HTMLElement, render: (close: () => void) => ReactNode, o?: { align?: 'start' | 'end' }) => void;
  close: () => void;
}
const Ctx = createContext<PopApi>({ menu: () => {}, popover: () => {}, close: () => {} });
export const usePop = () => useContext(Ctx);

export function PopProvider({ children }: { children: ReactNode }) {
  const [cur, setCur] = useState<Cur | null>(null);
  const [closing, setClosing] = useState(false);
  const curRef = useRef<Cur | null>(null);
  const closingRef = useRef(false);
  curRef.current = cur;

  const close = useCallback((restore = true) => {
    const c = curRef.current;
    if (!c || closingRef.current) return;
    closingRef.current = true;
    c.anchor.setAttribute('aria-expanded', 'false');
    if (restore && document.contains(c.anchor)) c.anchor.focus({ preventScroll: true });
    setClosing(true);
    setTimeout(() => { setCur(null); setClosing(false); closingRef.current = false; curRef.current = null; }, 130);
  }, []);

  const open = useCallback((next: Cur) => {
    const c = curRef.current;
    if (c && c.anchor === next.anchor && !closingRef.current) { close(); return; }
    if (c) c.anchor.setAttribute('aria-expanded', 'false');
    closingRef.current = false;
    next.anchor.setAttribute('aria-expanded', 'true');
    setClosing(false);
    setCur(next);
  }, [close]);

  const api: PopApi = {
    menu: (anchor, items, opts = {}) => open({ kind: 'menu', anchor, items, opts }),
    popover: (anchor, render, o = {}) => open({ kind: 'pop', anchor, render, align: o.align }),
    close: () => close(true),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      {cur && createPortal(<PopView cur={cur} closing={closing} onClose={close} />, document.body)}
    </Ctx.Provider>
  );
}

function PopView({ cur, closing, onClose }: { cur: Cur; closing: boolean; onClose: (restore?: boolean) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const align = cur.kind === 'menu' ? cur.opts.align : cur.align;

  // position under the anchor (flip above when there is no room)
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const r = cur.anchor.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = align === 'end' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 8, oy = 'top';
    if (top + h > window.innerHeight - 8 && r.top - h - 8 > 8) { top = r.top - h - 8; oy = 'bottom'; }
    el.style.left = left + 'px'; el.style.top = top + 'px';
    el.style.setProperty('--ox', (align === 'end' ? 'right' : 'left') + ' ' + oy);
  }, [cur, align]);

  // close on outside click / Escape / resize / scroll
  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && !cur.anchor.contains(t)) onClose(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(true); } };
    const rs = () => onClose(false);
    const sc = (e: Event) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(false); };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('resize', rs);
    window.addEventListener('scroll', sc, true);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', rs);
      window.removeEventListener('scroll', sc, true);
    };
  }, [cur, onClose]);

  // focus the selected (or first) menu item
  useEffect(() => {
    if (cur.kind !== 'menu') return;
    const el = ref.current;
    (el?.querySelector<HTMLElement>('.menu-item.sel') ?? el?.querySelector<HTMLElement>('.menu-item:not([disabled])'))?.focus({ preventScroll: true });
  }, [cur]);

  if (cur.kind === 'pop') {
    return <div ref={ref} className={`menu pop-card${closing ? ' out' : ''}`}>{cur.render(() => onClose(false))}</div>;
  }

  const { items, opts } = cur;
  const onKey = (e: React.KeyboardEvent) => {
    const its = Array.from(ref.current?.querySelectorAll<HTMLElement>('.menu-item:not([disabled])') ?? []);
    const i = its.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); its[(i + 1) % its.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); its[(i - 1 + its.length) % its.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); its[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); its[its.length - 1]?.focus(); }
    else if (e.key === 'Tab') onClose(false);
  };
  return (
    <div ref={ref} className={`menu${closing ? ' out' : ''}`} role="listbox" onKeyDown={onKey}>
      {opts.title && <div className="menu-title">{opts.title}</div>}
      {items.map((it, i) =>
        it.divider ? (
          <div key={i} className="menu-sep" />
        ) : (
          <button
            key={i} type="button" role="option" disabled={it.disabled}
            className={`menu-item${it.value === opts.selected ? ' sel' : ''}${it.danger ? ' danger' : ''}`}
            aria-selected={it.value === opts.selected}
            onClick={() => { onClose(true); opts.onSelect?.(it.value ?? ''); }}
          >
            {it.status ? <Tile k={it.status} size={30} /> : it.icon ? <span className="mi-ic"><Icon name={it.icon} size={19} /></span> : null}
            <span className="mi-tx">
              <span className="mi-l">{it.label}</span>
              {it.hint && <span className="mi-h">{it.hint}</span>}
            </span>
            {it.value === opts.selected && <Icon name="check" size={16} className="mi-ck" />}
          </button>
        ),
      )}
      {opts.foot && <div className="menu-foot">{opts.foot}</div>}
    </div>
  );
}
