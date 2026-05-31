import type { IHttpClient } from '../tokens/HTTP_TOKEN';
import type { ISessionsService, SessionSummary } from '../tokens/SESSIONS_TOKEN';

export class SessionsService implements ISessionsService {
  constructor(private readonly http: IHttpClient) {}

  async findAll(): Promise<SessionSummary[]> {
    return this.http.get<SessionSummary[]>('/sessions');
  }

  async findById(id: string): Promise<SessionSummary> {
    return this.http.get<SessionSummary>(`/sessions/${id}`);
  }
}
