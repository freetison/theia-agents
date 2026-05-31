import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  bigserial,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const sessionStatusEnum = pgEnum('session_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'partial',
]);

// ─── tenants ─────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── profiles ────────────────────────────────────────────────────────────────

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    version: integer('version').notNull().default(1),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('profiles_tenant_slug_version').on(t.tenantId, t.slug, t.version)],
);

// ─── profile_agents ───────────────────────────────────────────────────────────

export const profileAgents = pgTable('profile_agents', {
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'cascade' })
    .notNull(),
  agentId: text('agent_id').notNull(),
  sequence: integer('sequence').notNull(),
  context: text('context'),
  requires: text('requires').array().notNull().default(sql`'{}'::text[]`),
});

// ─── prompts ─────────────────────────────────────────────────────────────────

export const prompts = pgTable(
  'prompts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    agentId: text('agent_id').notNull(),
    version: integer('version').notNull(),
    template: text('template').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('prompts_tenant_agent_version').on(t.tenantId, t.agentId, t.version)],
);

// ─── agent_model_routing ──────────────────────────────────────────────────────

export const agentModelRouting = pgTable('agent_model_routing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  agentId: text('agent_id').notNull(), // '*' = default fallback
  provider: text('provider').notNull(),
  model: text('model').notNull(),
});

// ─── sessions ────────────────────────────────────────────────────────────────

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    profileId: uuid('profile_id')
      .references(() => profiles.id)
      .notNull(),
    problem: text('problem').notNull(),
    status: sessionStatusEnum('status').notNull().default('pending'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    finalReport: jsonb('final_report'),
    error: jsonb('error'),
    totalCostUsd: text('total_cost_usd'), // numeric stored as text for precision
    totalTokensIn: integer('total_tokens_in'),
    totalTokensOut: integer('total_tokens_out'),
  },
  (t) => [
    index('sessions_tenant_started').on(t.tenantId, t.startedAt),
    index('sessions_status').on(t.status),
  ],
);

// ─── session_agent_outputs ────────────────────────────────────────────────────

export const sessionAgentOutputs = pgTable(
  'session_agent_outputs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'cascade' })
      .notNull(),
    agentId: text('agent_id').notNull(),
    sequence: integer('sequence').notNull(),
    role: text('role').notNull(),
    summary: text('summary').notNull(),
    structuredOutput: jsonb('structured_output').notNull(),
    rawResponse: text('raw_response'),
    promptId: uuid('prompt_id').references(() => prompts.id),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    latencyMs: integer('latency_ms'),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    costUsd: text('cost_usd'),
    status: text('status').notNull().default('completed'),
    attempts: integer('attempts').notNull().default(1),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('outputs_session_agent').on(t.sessionId, t.agentId),
    index('outputs_session_seq').on(t.sessionId, t.sequence),
  ],
);

// ─── session_events ───────────────────────────────────────────────────────────

export const sessionEvents = pgTable('session_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: uuid('session_id')
    .references(() => sessions.id, { onDelete: 'cascade' })
    .notNull(),
  ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
  type: text('type').notNull(),
  payload: jsonb('payload'),
});

// ─── Type exports (inferred from schema) ─────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type ProfileAgent = typeof profileAgents.$inferSelect;
export type NewProfileAgent = typeof profileAgents.$inferInsert;

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

export type AgentRouting = typeof agentModelRouting.$inferSelect;
export type NewAgentRouting = typeof agentModelRouting.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type SessionAgentOutput = typeof sessionAgentOutputs.$inferSelect;
export type NewSessionAgentOutput = typeof sessionAgentOutputs.$inferInsert;
