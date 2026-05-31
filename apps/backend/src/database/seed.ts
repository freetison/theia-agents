/**
 * Seed script: reads config/ and profiles/ from disk → inserts into Postgres.
 * Idempotent (upsert). Creates a default global tenant (tenant_id = global slug).
 *
 * Run: pnpm --filter @theia/backend seed
 */

import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';
import { createDb } from './connection';

const ENGINE_ROOT = path.resolve(__dirname, '../../../../packages/engine');
const PROMPTS_DIR = path.join(ENGINE_ROOT, 'config', 'prompts');
const AGENTS_JSON = path.join(ENGINE_ROOT, 'config', 'agents.json');
const PROFILES_DIR = path.join(ENGINE_ROOT, 'profiles');

interface AgentsJson {
  default: { provider: string; model: string };
  agents: Record<string, { provider: string; model: string }>;
}

interface ProfileJson {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  agentConfig: Record<string, { context?: string }>;
}

async function seed(connectionString: string): Promise<void> {
  const db = createDb(connectionString);

  // 1. Upsert global tenant
  const [globalTenant] = await db
    .execute<{ id: string }>(
      sql`INSERT INTO tenants (slug) VALUES ('global')
       ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
       RETURNING id`,
    )
    .then((r) => r.rows);

  if (!globalTenant) throw new Error('Failed to upsert global tenant');
  const tenantId = globalTenant.id;
  console.log(`✓ global tenant: ${tenantId}`);

  // 2. Seed prompts (version 1, active)
  const promptFiles = fs.readdirSync(PROMPTS_DIR).filter((f) => f.endsWith('.txt'));
  for (const file of promptFiles) {
    const agentId = path.basename(file, '.txt');
    const template = fs.readFileSync(path.join(PROMPTS_DIR, file), 'utf-8');
    // NULL tenant_id breaks ON CONFLICT expression; use insert-ignore + update pattern
    await db.execute(
      sql`INSERT INTO prompts (tenant_id, agent_id, version, template, is_active)
       VALUES (NULL, ${agentId}, 1, ${template}, true)
       ON CONFLICT DO NOTHING`,
    );
    await db.execute(
      sql`UPDATE prompts SET template = ${template}, is_active = true
       WHERE tenant_id IS NULL AND agent_id = ${agentId} AND version = 1`,
    );
    console.log(`  ✓ prompt: ${agentId}`);
  }

  // 3. Seed agent routing
  const agentsJson = JSON.parse(fs.readFileSync(AGENTS_JSON, 'utf-8')) as AgentsJson;
  const { default: def, agents } = agentsJson;

  // Global wildcard default
  await db.execute(
    sql`INSERT INTO agent_model_routing (tenant_id, agent_id, provider, model)
     VALUES (NULL, '*', ${def.provider}, ${def.model})
     ON CONFLICT DO NOTHING`,
  );
  for (const [agentId, cfg] of Object.entries(agents)) {
    await db.execute(
      sql`INSERT INTO agent_model_routing (tenant_id, agent_id, provider, model)
       VALUES (NULL, ${agentId}, ${cfg.provider}, ${cfg.model})
       ON CONFLICT DO NOTHING`,
    );
  }
  console.log(`✓ routing: ${Object.keys(agents).length + 1} rows`);

  // 4. Seed profiles
  const profileFiles = fs.readdirSync(PROFILES_DIR).filter((f) => f.endsWith('.json'));
  for (const file of profileFiles) {
    const profile = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, file), 'utf-8')) as ProfileJson;

    const [profileRow] = await db
      .execute<{ id: string }>(
        sql`INSERT INTO profiles (tenant_id, slug, name, description, version, is_active)
         VALUES (${tenantId}, ${profile.id}, ${profile.name}, ${profile.description ?? null}, 1, true)
         ON CONFLICT (tenant_id, slug, version) DO UPDATE
           SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active
         RETURNING id`,
      )
      .then((r) => r.rows);

    if (!profileRow) throw new Error(`Failed to upsert profile ${profile.id}`);
    const profileId = profileRow.id;

    // Replace agents for this profile
    await db.execute(sql`DELETE FROM profile_agents WHERE profile_id = ${profileId}`);
    for (let i = 0; i < profile.agents.length; i++) {
      const agentId = profile.agents[i] as string;
      const ctx = profile.agentConfig[agentId]?.context ?? null;
      await db.execute(
        sql`INSERT INTO profile_agents (profile_id, agent_id, sequence, context, requires)
         VALUES (${profileId}, ${agentId}, ${i}, ${ctx}, '{}')`,
      );
    }
    console.log(`  ✓ profile: ${profile.id} (${profile.agents.length} agents)`);
  }

  console.log('\n✅ Seed complete.');
  process.exit(0);
}

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL env var required');
seed(url).catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
