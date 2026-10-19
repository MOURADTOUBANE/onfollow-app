import type { AppEvent, Application, ApplicationInput, ListParams, Paginated, Status } from '../types';
import { http } from './http';
import { asList, toApplication, toEvent, unwrap } from './mappers';

export async function list(params: ListParams = {}): Promise<Paginated<Application>> {
  const raw = await http<{ data?: unknown; meta?: Paginated<Application>['meta'] }>('/applications', { query: { ...params } });
  const rows = asList(raw);
  return {
    data: rows.map((row) => toApplication(row)),
    meta: raw.meta ?? { total: rows.length, limit: params.limit ?? rows.length, offset: params.offset ?? 0 },
  };
}

export async function get(id: number): Promise<{ application: Application; events: AppEvent[] }> {
  const raw = unwrap(await http<unknown>(`/applications/${id}`));
  const events = asList(raw.events ?? []);
  return { application: toApplication(raw), events: events.map((e) => toEvent(e)) };
}

export async function create(input: ApplicationInput): Promise<Application> {
  return toApplication(await http<unknown>('/applications', {
    method: 'POST',
    body: { ...input, source: input.source || 'Other' },
  }));
}

export async function update(id: number, patch: Partial<ApplicationInput>): Promise<Application> {
  return toApplication(await http<unknown>(`/applications/${id}`, { method: 'PATCH', body: patch }));
}

export async function remove(id: number): Promise<void> {
  await http<void>(`/applications/${id}`, { method: 'DELETE' });
}

export async function setStatus(id: number, status: Status): Promise<void> {
  await http<unknown>(`/applications/${id}/status`, { method: 'POST', body: { status } });
}
