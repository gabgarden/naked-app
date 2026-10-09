function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  return process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : '';
}

export async function apiGet<T>(path: string): Promise<T> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return json.data as T;
}

export async function apiDelete(path: string, body?: unknown): Promise<void> {
  const baseUrl = getApiUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
}
