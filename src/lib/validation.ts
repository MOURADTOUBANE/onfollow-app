import { isoOff, parseD } from './dates';

/**
 * TODO(API): client-side mirror of StoreApplicationRequest / UpdateApplicationRequest.
 * These rules are a best guess. Align max lengths / required flags with your FormRequest.
 * Server-side 422 errors are still shown inline by AppFormModal (see mapApiErrors there).
 */
interface Rule { req?: boolean; max?: number; url?: boolean; date?: boolean; notFuture?: boolean; label: string }
export const RULES: Record<string, Rule> = {
  company: { req: true, max: 255, label: 'Company' },
  title: { req: true, max: 255, label: 'Job title' },
  canonical_url: { url: true, max: 2048, label: 'Job link' },
  source: { req: true, max: 255, label: 'Source' },
  applied_at: { date: true, notFuture: true, label: 'Applied date' },
  location: { max: 255, label: 'Location' },
  salary_text: { max: 255, label: 'Salary' },
  notes: { max: 10000, label: 'Notes' },
};

export type FieldErrors = Record<string, string>;

export function validate(data: Record<string, string | null | undefined>, rules = RULES): FieldErrors {
  const err: FieldErrors = {};
  for (const k of Object.keys(rules)) {
    const r = rules[k];
    const v = (data[k] ?? '').toString().trim();
    if (r.req && !v) { err[k] = r.label + ' is required.'; continue; }
    if (!v) continue;
    if (r.max && v.length > r.max) err[k] = `${r.label} can be at most ${r.max} characters.`;
    else if (r.url && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v)) err[k] = 'Enter a full link, starting with http:// or https://';
    else if (r.date && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(parseD(v).getTime()))) err[k] = 'Enter a valid date.';
    else if (r.notFuture && v > isoOff(0)) err[k] = "Applied date can't be in the future.";
  }
  return err;
}

export const EMAIL_RE = /^\S+@\S+\.\S+$/;
