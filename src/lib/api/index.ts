/**
 * Single entry point for data access. Components never call fetch() themselves:
 *
 *   import { api } from '@/lib/api';
 *   const { data, meta } = await api.applications.list({ status: 'applied', limit: 8, offset: 0 });
 */
import * as auth from './auth';
import * as applications from './applications';
import * as followUps from './followups';

export const api = { auth, applications, followUps };
export { ApiError, tokenStore } from './http';
