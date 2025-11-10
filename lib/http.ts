import { CONFIG } from '@/utils/config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class HttpError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message?: string) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

function buildUrl(path: string) {
  const base = CONFIG.API_BASE_URL?.replace(/\/$/, '') || '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  // TODO: attach auth token when you wire real auth
  // const token = await getAuthToken();
  // if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const body = text && isJson ? JSON.parse(text) : text;
  if (!res.ok) throw new HttpError(res.status, body);
  return body as T;
}

export const api = {
  get: <T = any>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...(init || {}), method: 'GET' }),
  post: <T = any>(path: string, body?: any, init?: RequestInit) => apiFetch<T>(path, { ...(init || {}), method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T = any>(path: string, body?: any, init?: RequestInit) => apiFetch<T>(path, { ...(init || {}), method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T = any>(path: string, body?: any, init?: RequestInit) => apiFetch<T>(path, { ...(init || {}), method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T = any>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...(init || {}), method: 'DELETE' }),
};
