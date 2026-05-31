import { inject } from 'vue';
import { SESSIONS_TOKEN } from '../tokens/SESSIONS_TOKEN';

export function useSession() {
  const service = inject(SESSIONS_TOKEN);
  if (!service) throw new Error('SESSIONS_TOKEN not provided');
  return service;
}
