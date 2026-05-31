import type { InjectionKey } from 'vue';

export interface IHttpClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
}

export const HTTP_TOKEN: InjectionKey<IHttpClient> = Symbol('IHttpClient');
