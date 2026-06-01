import type { InjectionKey } from 'vue';

export interface ProfileDetail {
  id: string;
  tenantId: string | null;
  name: string;
  slug: string;
  description?: string;
  agentCount: number;
}

export interface ProfileAgent {
  agentId: string;
  sequence: number;
}

export interface CreateProfileInput {
  name: string;
  slug: string;
  description?: string;
  agents: ProfileAgent[];
}

export interface IProfilesService {
  findAll(): Promise<ProfileDetail[]>;
  create(input: CreateProfileInput): Promise<ProfileDetail>;
}

export const PROFILES_TOKEN: InjectionKey<IProfilesService> = Symbol('IProfilesService');
