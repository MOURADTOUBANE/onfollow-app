import type { AppEvent, Application, FollowUp, FollowUpStatus, User } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/** Laravel sometimes wraps a resource in `{ data: ... }`. Do not unwrap objects that already have an `id` — events use `data` as the payload. */
export const unwrap = (raw: Raw) => {
  if (!raw || Array.isArray(raw) || raw.data === undefined || raw.id != null) return raw;
  const keys = Object.keys(raw);
  const wrapperOnly = keys.every((k) => k === 'data' || k === 'meta' || k === 'links');
  return wrapperOnly ? raw.data : raw;
};

export function asList(raw: Raw): unknown[] {
  if (Array.isArray(raw)) return raw;
  const u = unwrap(raw);
  if (Array.isArray(u)) return u;
  if (Array.isArray(u?.data)) return u.data;
  return [];
}

function pick(obj: Raw, ...keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

function day(value: unknown): string | null {
  if (!value) return null;
  return String(value).slice(0, 10);
}

export function toUser(raw: Raw): User {
  const root = unwrap(raw);
  const u = unwrap(root.user ?? root);
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    verified: u.verified ?? !!pick(u, 'email_verified_at', 'emailVerifiedAt'),
  };
}

export function toApplication(raw: Raw): Application {
  const a = unwrap(raw);
  return {
    id: a.id,
    company: a.company,
    title: a.title,
    canonical_url: pick(a, 'canonical_url', 'canonicalUrl'),
    source: a.source ?? null,
    applied_at: day(pick(a, 'applied_at', 'appliedAt')),
    location: a.location ?? null,
    salary_text: pick(a, 'salary_text', 'salaryText'),
    notes: a.notes ?? null,
    status: a.status,
    created_at: pick(a, 'created_at', 'createdAt'),
    updated_at: pick(a, 'updated_at', 'updatedAt') ?? pick(a, 'created_at', 'createdAt'),
  };
}

export function toEvent(raw: Raw): AppEvent {
  const e = unwrap(raw);
  const previous = e.previous_data ?? e.previousData ?? {};
  const next = e.new_data ?? e.newData ?? {};
  let data = e.data ?? e.payload ?? {};
  if (!e.data && !e.payload) {
    if (e.type === 'status_changed') {
      data = { from: previous.status, to: next.status };
    } else if (e.type === 'follow_up_created') {
      data = { title: next.title, due: day(next.due_at ?? next.dueAt) ?? undefined };
    } else if (e.type === 'edited') {
      data = { fields: Object.keys({ ...previous, ...next }) };
    }
  }
  return {
    id: e.id,
    application_id: pick(e, 'application_id', 'applicationId'),
    type: e.type,
    created_at: pick(e, 'created_at', 'createdAt', 'occurred_at', 'occurredAt'),
    data,
  };
}

const FROM_API_FOLLOW_UP: Record<string, FollowUpStatus> = {
  pending: 'open',
  completed: 'done',
  cancelled: 'cancelled',
  open: 'open',
  done: 'done',
};

export function toFollowUp(raw: Raw): FollowUp {
  const f = unwrap(raw);
  const status = String(f.status ?? 'pending');
  return {
    id: f.id,
    application_id: pick(f, 'application_id', 'applicationId'),
    title: f.title,
    due_at: day(pick(f, 'due_at', 'dueAt')) ?? '',
    status: FROM_API_FOLLOW_UP[status] ?? 'open',
    completed_at: pick(f, 'completed_at', 'completedAt'),
  };
}

export function toFollowUpPatch(patch: { status?: FollowUpStatus; due_at?: string }) {
  const body: Record<string, string> = {};
  if (patch.due_at) body.due_at = patch.due_at;
  if (patch.status === 'done') body.status = 'completed';
  else if (patch.status === 'open') body.status = 'pending';
  else if (patch.status === 'cancelled') body.status = 'cancelled';
  return body;
}
