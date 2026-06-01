import type { IHttpClient } from '../tokens/HTTP_TOKEN';
import type { IProfilesService, ProfileDetail, CreateProfileInput } from '../tokens/PROFILES_TOKEN';

export class ProfilesService implements IProfilesService {
  constructor(private readonly http: IHttpClient) {}

  async findAll(): Promise<ProfileDetail[]> {
    return this.http.get<ProfileDetail[]>('/profiles');
  }

  async create(input: CreateProfileInput): Promise<ProfileDetail> {
    return this.http.post<ProfileDetail>('/profiles', input);
  }
}
