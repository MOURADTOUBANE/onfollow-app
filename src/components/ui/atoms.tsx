import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../graphics/Icon';
import type { Status } from '@/lib/types';
import { ST } from '@/lib/status';
import { due } from '@/lib/dates';

const sz = (n: number) => ({ '--sz': `${n}px` }) as CSSProperties;

/** Coloured square with the status icon. Colour comes from the `st-<status>` class. */
export function Tile({ k, size = 32 }: { k: Status; size?: number }) {
  return (
    <span className={`tile st-${k}`} style={sz(size)}>
      <Icon name={k} size={Math.round(size * 0.56)} />
    </span>
  );
}

export function Pill({ k, className = '' }: { k: Status; className?: string }) {
  return (
    <span className={`pill st-${k} ${className}`.trim()}>
      <Icon name={k} size={14} />
      <span>{ST[k].label}</span>
    </span>
  );
}

/** Company monogram (no logos in the API, so the first letter). */
export function Mono({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span className="mono" style={sz(size)} aria-hidden="true">
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  );
}

/** Colour-escalating due-date badge (text + icon, never colour alone). */
export function DueBadge({ date }: { date: string }) {
  const i = due(date);
  return (
    <span className={`due ${i.cls}`}>
      <Icon name={i.icon} size={13} />
      {i.label}
    </span>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  return (
    <div className="err" role="alert">
      <Icon name="alert" size={15} />
      <span>{children}</span>
    </div>
  );
}

export const CheckSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** Flat skeleton block with the blurred-bar shimmer (no gradients). */
export const Sk = ({ w, h = 14, style }: { w: string; h?: number; style?: CSSProperties }) => (
  <div className="sk" style={{ width: w, height: h, ...style }} />
);

/** Button content while a request is running (three pulsing dots instead of a spinner). */
export const BusyDots = () => (
  <>
    <span className="dots"><i /><i /><i /></span>
    <span className="sr">Loading</span>
  </>
);
