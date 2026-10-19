import type { User } from '../types';
import { http, tokenStore, ApiError } from './http';
import { toUser } from './mappers';

export interface RegisterInput { name: string; email: string; password: string; password_confirmation: string }
export interface LoginInput { email: string; password: string }

function saveToken(raw: { token?: string } | unknown) {
  const token = (raw as { token?: string }).token;
  if (token) tokenStore.set(token);
}

export async function register(input: RegisterInput): Promise<User> {
  const raw = await http<{ token?: string }>('/register', { method: 'POST', body: input });
  saveToken(raw);
  return toUser(raw);
}

export async function login(input: LoginInput): Promise<User> {
  try {
    const raw = await http<{ token?: string }>('/login', { method: 'POST', body: input });
    saveToken(raw);
    return toUser(raw);
  } catch (err) {
    if (err instanceof ApiError && err.code === 'email_not_verified' && err.token) {
      tokenStore.set(err.token);
    }
    throw err;
  }
}

export async function me(): Promise<User | null> {
  if (!tokenStore.get()) return null;
  try { return toUser(await http<unknown>('/me')); } catch { tokenStore.clear(); return null; }
}

export async function logout(): Promise<void> {
  try {
    if (tokenStore.get()) await http<void>('/logout', { method: 'POST' });
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) throw err;
  } finally {
    tokenStore.clear();
  }
}

export async function resendVerification(_email: string): Promise<void> {
  await http<void>('/email/verification-notification', { method: 'POST' });
}
