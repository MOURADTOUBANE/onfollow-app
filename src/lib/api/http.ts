import { API_URL } from './config';

/**
 * Error thrown for every non-2xx answer.
 *  - status 401 / 422 on login : wrong credentials
 *  - status 403 : `code === 'email_not_verified'`
 *  - status 409 : illegal status transition
 *  - status 422 : validation; `errors` = { field: ['message', ...] }
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public errors?: Record<string, string[]>,
    public token?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'jt-token';
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

type Query = Record<string, string | number | undefined | null>;
interface Opts { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown; query?: Query }

export async function http<T>(path: string, { method = 'GET', body, query }: Opts = {}): Promise<T> {
  const url = new URL(API_URL + path);
  if (query) for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const token = tokenStore.get();
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      code?: string;
      errors?: Record<string, string[]>;
      token?: string;
    };
    throw new ApiError(
      res.status,
      j.message ?? j.error ?? res.statusText,
      j.code,
      j.errors,
      j.token,
    );
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
