import type { IHttpClient } from '../tokens/HTTP_TOKEN';
import type { ISessionsService, SessionSummary } from '../tokens/SESSIONS_TOKEN';

export class SessionsService implements ISessionsService {
  private http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async findAll(): Promise<SessionSummary[]> {
    return this.http.get<SessionSummary[]>('/sessions');
  }

  async findById(id: string): Promise<SessionSummary> {
    return this.http.get<SessionSummary>(`/sessions/${id}`);
  }

  async deleteMany(ids: string[]): Promise<void> {
    // Some HTTP clients require data for DELETE in config
    return this.http.delete<void>('/sessions', { ids });
  }
}
