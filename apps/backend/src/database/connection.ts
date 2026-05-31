import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type TheiaDb = ReturnType<typeof createDb>;

/**
 * Creates a Drizzle DB instance from a connection string.
 * process.env is intentionally NOT read here — callers (main.ts, tests) pass the URL.
 */
export function createDb(connectionString: string): ReturnType<typeof drizzle<typeof schema>> {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export { schema };
