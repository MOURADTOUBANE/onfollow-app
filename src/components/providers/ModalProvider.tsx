'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../graphics/Icon';

interface ModalOpts {
  title: string;
  size?: 'sm' | '';
  /** Render the body. Call `close()` when done. Give a button `data-autofocus` to control initial focus. */
  render: (close: () => void) => ReactNode;
}
interface Entry { id: number; opts: ModalOpts; closing: boolean }
const Ctx = createContext<{ open: (o: ModalOpts) => () => void }>({ open: () => () => {} });
export const useModal = () => useContext(Ctx);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Entry[]>([]);
  const idRef = useRef(0);
  const open = useCallback((opts: ModalOpts) => {
    const id = ++idRef.current;
    setStack((s) => [...s, { id, opts, closing: false }]);
    return () => {
      setStack((s) => s.map((m) => (m.id === id ? { ...m, closing: true } : m)));
      setTimeout(() => setStack((s) => s.filter((m) => m.id !== id)), 180);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('lock', stack.some((m) => !m.closing));
  }, [stack]);

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {stack.map((m) => createPortal(<ModalView key={m.id} entry={m} onClose={() => {
        setStack((s) => s.map((x) => (x.id === m.id ? { ...x, closing: true } : x)));
        setTimeout(() => setStack((s) => s.filter((x) => x.id !== m.id)), 180);
      }} />, document.body))}
    </Ctx.Provider>
  );
}

function ModalView({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { opts, closing } = entry;

  // initial focus + restore focus on unmount
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const m = ref.current?.querySelector('.modal');
    (m?.querySelector<HTMLElement>('[data-autofocus]') ?? m?.querySelector<HTMLElement>('input,textarea,button:not([data-mclose])'))?.focus({ preventScroll: true });
    return () => { if (prev && document.contains(prev)) prev.focus({ preventScroll: true }); };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if (e.key === 'Tab') {
      const f = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,textarea,a[href],[tabindex="0"]') ?? []).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  };

  return (
    <div ref={ref} className={`modal-back${closing ? ' out' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={onKey}>
      <div className={`modal ${opts.size ?? ''}`} role="dialog" aria-modal="true" aria-labelledby={`mt-${entry.id}`}>
        <div className="modal-h">
          <h2 id={`mt-${entry.id}`}>{opts.title}</h2>
          <button className="btn-icon" data-mclose onClick={onClose} aria-label="Close dialog"><Icon name="x" size={20} /></button>
        </div>
        <div className="modal-b">{opts.render(onClose)}</div>
      </div>
    </div>
  );
}
