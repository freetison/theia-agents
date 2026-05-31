import { inject } from 'vue';
import { AGENTS_TOKEN } from '../tokens/AGENTS_TOKEN';

export function useAgents() {
  const service = inject(AGENTS_TOKEN);
  if (!service) throw new Error('AGENTS_TOKEN not provided');
  return service;
}
