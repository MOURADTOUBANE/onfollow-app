import type { IconName } from '@/components/graphics/icon-data';

export const DAY = 864e5;

export const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
/** Date -> YYYY-MM-DD in local time */
export const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
/** Today +/- n days as YYYY-MM-DD */
export const isoOff = (n: number) => { const d = today0(); d.setDate(d.getDate() + n); return iso(d); };
export const parseD = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const diffDays = (s: string) => Math.round((parseD(s).getTime() - today0().getTime()) / DAY);
export const ts = (s: string) => new Date(s).getTime();

export function fmtD(s: string, long?: boolean) {
  const d = parseD(s);
  const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (long || d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
  return d.toLocaleDateString('en-US', o);
}

/** "3 days ago" style label for the activity timeline */
export function rel(t: number) {
  const m = Math.round((Date.now() - t) / 6e4);
  if (m < 1) return 'Just now';
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
  const d = Math.round(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 14) return d + ' days ago';
  const w = Math.round(d / 7);
  if (w < 9) return w + ' weeks ago';
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export const absT = (t: number) =>
  new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
export const fmtDT = (t: number) => {
  const d = new Date(t);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export interface DueInfo { n: number; cls: 'd0' | 'd1' | 'd2' | 'd3' | 'd4'; label: string; icon: IconName }
/** Colour-escalating due badge: neutral -> amber -> orange -> rose -> solid rose (overdue). */
export function due(s: string): DueInfo {
  const n = diffDays(s);
  if (n < 0) return { n, cls: 'd4', label: n === -1 ? '1 day overdue' : -n + ' days overdue', icon: 'alert' };
  if (n === 0) return { n, cls: 'd3', label: 'Due today', icon: 'clock' };
  if (n === 1) return { n, cls: 'd2', label: 'Tomorrow', icon: 'clock' };
  if (n <= 3) return { n, cls: 'd2', label: 'In ' + n + ' days', icon: 'clock' };
  if (n <= 7) return { n, cls: 'd1', label: 'In ' + n + ' days', icon: 'clock' };
  return { n, cls: 'd0', label: fmtD(s), icon: 'calendar' };
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
