import type { FollowUp, FollowUpStatus } from '../types';
import { http } from './http';
import { asList, toFollowUp, toFollowUpPatch } from './mappers';

export async function list(): Promise<FollowUp[]> {
  const raw = await http<unknown>('/actions');
  return asList(raw).map((row) => toFollowUp(row));
}

export async function create(application_id: number, title: string, due_at: string): Promise<FollowUp> {
  return toFollowUp(await http<unknown>(`/applications/${application_id}/actions`, {
    method: 'POST',
    body: { type: 'follow_up', title, due_at },
  }));
}

export async function update(id: number, patch: { status?: FollowUpStatus; due_at?: string }): Promise<FollowUp> {
  return toFollowUp(await http<unknown>(`/actions/${id}`, { method: 'PATCH', body: toFollowUpPatch(patch) }));
}
