import type { IHttpClient } from '../tokens/HTTP_TOKEN';

/**
 * Fetch-based HTTP client that injects X-Tenant-Id on every request.
 * Only process.env is forbidden. import.meta.env is Vite's equivalent.
 */
export class HttpClient implements IHttpClient {
  private readonly baseUrl: string;
  private readonly tenantId: string;

  constructor() {
    this.baseUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';
    this.tenantId = import.meta.env['VITE_TENANT_ID'] ?? '';
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'X-Tenant-Id': this.tenantId },
    });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': this.tenantId,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
    return res.json() as Promise<T>;
  }
}
