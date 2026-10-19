import type { Status } from './types';

export const KEYS: Status[] = [
  'saved', 'preparing', 'applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn', 'archived',
];

export const ST: Record<Status, { label: string; desc: string }> = {
  saved: { label: 'Saved', desc: 'On your radar, not sent yet' },
  preparing: { label: 'Preparing', desc: 'Tailoring your CV and note' },
  applied: { label: 'Applied', desc: 'Sent and waiting to hear back' },
  screening: { label: 'Screening', desc: 'A recruiter is looking at you' },
  interview: { label: 'Interview', desc: 'Talking with the team' },
  offer: { label: 'Offer', desc: 'They want you. Time to decide' },
  rejected: { label: 'Rejected', desc: 'They passed on this one' },
  withdrawn: { label: 'Withdrawn', desc: 'You stepped away' },
  archived: { label: 'Archived', desc: 'Filed away for reference' },
};

/** Columns shown in the main flow of the board. */
export const MAIN: Status[] = KEYS.slice(0, 6);
/** Shown in the collapsible "Closed" lane. */
export const CLOSED: Status[] = KEYS.slice(6);

/**
 * TODO(API): client-side mirror of the Laravel transition map.
 * It only drives the UI (which statuses are offered, which drop targets light up).
 * The API stays the source of truth: it answers 409 on an illegal move (see moveStatus in DataProvider).
 * Keep this in sync with your backend, or expose the map from an endpoint and load it here.
 */
export const TRANS: Record<Status, Status[]> = {
  saved: ['preparing', 'applied', 'withdrawn', 'archived'],
  preparing: ['saved', 'applied', 'withdrawn', 'archived'],
  applied: ['screening', 'interview', 'rejected', 'withdrawn', 'archived'],
  screening: ['interview', 'rejected', 'withdrawn', 'archived'],
  interview: ['offer', 'rejected', 'withdrawn', 'archived'],
  offer: ['rejected', 'withdrawn', 'archived'],
  rejected: ['archived'],
  withdrawn: ['archived'],
  archived: ['saved'],
};

export const canMove = (from: Status, to: Status) => TRANS[from].includes(to);

export const listWords = (a: string[]) =>
  a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];

/** Suggestions for the "source" field (the field itself is free text). */
export const SOURCES = ['LinkedIn', 'Referral', 'Company site', 'Indeed', 'Recruiter', 'Wellfound'];

export const FIELD_LABEL: Record<string, string> = {
  company: 'company', title: 'job title', canonical_url: 'job link', source: 'source',
  applied_at: 'applied date', location: 'location', salary_text: 'salary', notes: 'notes',
};
