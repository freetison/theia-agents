import type { IHttpClient } from '../tokens/HTTP_TOKEN';
import type { IProfilesService, ProfileDetail, CreateProfileInput } from '../tokens/PROFILES_TOKEN';

export class ProfilesService implements IProfilesService {
  private http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async findAll(): Promise<ProfileDetail[]> {
    return this.http.get<ProfileDetail[]>('/profiles');
  }

  async create(input: CreateProfileInput): Promise<ProfileDetail> {
    return this.http.post<ProfileDetail>('/profiles', input);
  }
}
