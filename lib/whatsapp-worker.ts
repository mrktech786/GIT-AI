const base = process.env.WHATSAPP_WORKER_URL?.replace(/\/$/, '');
const token = process.env.WHATSAPP_WORKER_TOKEN || '';

export function workerConfigured() { return Boolean(base); }

export async function workerFetch(path: string, init: RequestInit = {}) {
  if (!base) throw new Error('WHATSAPP_WORKER_URL is not configured');
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  return fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });
}
