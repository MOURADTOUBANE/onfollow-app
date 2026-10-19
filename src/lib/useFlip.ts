'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';

/**
 * Auto-FLIP: after every render, elements marked `data-flip` + `data-id` that moved since the previous
 * render glide from their old position to the new one (used when a card changes column on the board).
 */
export function useAutoFlip(container: RefObject<HTMLElement | null>) {
  const prev = useRef(new Map<string, { x: number; y: number; w: number }>());
  useLayoutEffect(() => {
    const c = container.current;
    if (!c) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cr = c.getBoundingClientRect();
    const next = new Map<string, { x: number; y: number; w: number }>();
    c.querySelectorAll<HTMLElement>('[data-flip]').forEach((n) => {
      const r = n.getBoundingClientRect();
      const id = n.dataset.id as string;
      const cur = { x: r.left - cr.left + c.scrollLeft, y: r.top + window.scrollY, w: r.width };
      next.set(id, cur);
      const old = prev.current.get(id);
      if (!old || !old.w || !cur.w || reduce) return;
      const dx = old.x - cur.x, dy = old.y - cur.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      n.style.zIndex = '5';
      n.animate(
        [{ transform: `translate(${dx}px,${dy}px) scale(1.03)` }, { transform: 'none' }],
        { duration: 640, easing: 'cubic-bezier(.3,1.3,.5,1)' },
      ).onfinish = () => { n.style.zIndex = ''; };
    });
    prev.current = next;
  });
}
