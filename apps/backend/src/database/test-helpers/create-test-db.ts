/**
 * Creates all tables in a PGlite in-memory database for unit testing.
 * Call this in beforeEach to get a fresh DB per test.
 */
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '../schema';

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  await client.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE (tenant_id, slug, version)
    );

    CREATE TABLE IF NOT EXISTS profile_agents (
      profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      context TEXT,
      requires TEXT[] NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      agent_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      template TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_model_routing (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id),
      agent_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL
    );

    CREATE TYPE session_status AS ENUM ('pending','running','completed','failed','partial');

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      profile_id UUID NOT NULL REFERENCES profiles(id),
      problem TEXT NOT NULL,
      status session_status NOT NULL DEFAULT 'pending',
      started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      finished_at TIMESTAMPTZ,
      final_report JSONB,
      error JSONB,
      total_cost_usd TEXT,
      total_tokens_in INTEGER,
      total_tokens_out INTEGER
    );

    CREATE TABLE IF NOT EXISTS session_agent_outputs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      role TEXT NOT NULL,
      summary TEXT NOT NULL,
      structured_output JSONB NOT NULL,
      raw_response TEXT,
      prompt_id UUID REFERENCES prompts(id),
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      latency_ms INTEGER,
      tokens_in INTEGER,
      tokens_out INTEGER,
      cost_usd TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      attempts INTEGER NOT NULL DEFAULT 1,
      ts TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE (session_id, agent_id)
    );

    CREATE TABLE IF NOT EXISTS session_events (
      id BIGSERIAL PRIMARY KEY,
      session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      ts TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      type TEXT NOT NULL,
      payload JSONB
    );
  `);

  return { db, client };
}
