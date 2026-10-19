/**
 * Domain types used everywhere in the UI.
 *
 * TODO(API): these mirror what the Laravel API returns AFTER src/lib/api/mappers.ts has
 * normalised it. If your JSON differs, change the mappers, not the components.
 */

export type Status =
  | 'saved' | 'preparing' | 'applied' | 'screening' | 'interview'
  | 'offer' | 'rejected' | 'withdrawn' | 'archived';

export interface User {
  id: number;
  name: string;
  email: string;
  /** false until the user clicked the link in the verification email */
  verified: boolean;
}

export interface Application {
  id: number;
  company: string;
  title: string;
  canonical_url: string | null;
  source: string | null;
  /** YYYY-MM-DD */
  applied_at: string | null;
  location: string | null;
  salary_text: string | null;
  notes: string | null;
  status: Status;
  /** ISO datetime */
  created_at: string;
  /** ISO datetime, used to sort "recent activity" */
  updated_at: string;
}

/** Fields accepted by POST /applications and PATCH /applications/{id} (StoreApplicationRequest / UpdateApplicationRequest). */
export type ApplicationInput = Pick<
  Application,
  'company' | 'title' | 'canonical_url' | 'source' | 'applied_at' | 'location' | 'salary_text' | 'notes'
>;

/** The backend calls follow-ups "actions" (PATCH /actions/{id}); the UI says follow-up. */
export type FollowUpStatus = 'open' | 'done' | 'cancelled';
export interface FollowUp {
  id: number;
  application_id: number;
  title: string;
  /** YYYY-MM-DD */
  due_at: string;
  status: FollowUpStatus;
  completed_at?: string | null;
}

export type EventType = 'application_created' | 'edited' | 'status_changed' | 'follow_up_created';
export interface EventData {
  from?: Status;
  to?: Status;
  /** field names changed by an `edited` event */
  fields?: string[];
  title?: string;
  due?: string;
}
export interface AppEvent {
  id: number;
  application_id: number;
  type: EventType;
  /** ISO datetime */
  created_at: string;
  data: EventData;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; limit: number; offset: number };
}

export interface ListParams {
  status?: Status | '';
  source?: string;
  search?: string;
  applied_from?: string;
  applied_to?: string;
  limit?: number;
  offset?: number;
}
