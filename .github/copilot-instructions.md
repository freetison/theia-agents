# Principles & Guidelines

> **Canonical source:** `.principles.md`
> **Version:** 2.0 — 2026-05-08

## What This Project Is
Theia v2 is a **multi-tenant, rules-driven SaaS platform**.
**Critical mental model:** business logic lives in `json-rules-engine` rules owned per-tenant. Code handles infrastructure (load, validate, persist, emit). Rules handle decisions. If you find yourself writing `if (amount > 10000 && tier === 'gold')` in a handler — that's a rule, not code.

## Non-Negotiable Rules

### Branching
- **Allowed:** Single `if` (guard clause, null check), `if / else` (exactly 2 branches), ternary.
- **Prohibited:** `if / else if / else` (3+ branches) → use Strategy Map/Factory. `switch` → ALWAYS prohibited. Nested ternaries → Prohibited.

### Dependency Injection
- Inject **interfaces only** (`IXxx`).
- Tokens defined only in `src/types.ts`.
- **Cero clases concretas.**

### Multi-tenancy
- PostgreSQL (Drizzle): `applyTenantMiddleware(db)` handles ALL queries. Never add `tenantId` in a query.
- MongoDB: repository boundary owns the `tenantId` filter.
- Application layer (controllers/handlers) never sees `tenantId` manually.

### Config
- Only `@theia-core/config` (`createConfig({ vaultToken: process.env.VAULT_TOKEN, ... })`).
- `process.env` ONLY allowed in `main.ts` for Vault initialization.

### Result Pattern
- Domain never throws. Use `ok(value)` or `err(new DomainError(...))`.
- Controllers must type the result: `Promise<Result<Rule>>`, NOT `Result<unknown>`.

### TypeScript Strict
- Zero `as` casts to silence the compiler.
- `as X` only allowed after `ZodSchema.parse()` or a proven type-guard.

### Packages
- Only `pnpm`.
- Internal packages must use `workspace:*` or `catalog:`, NEVER `"latest"` or `"dev"`.

## Architecture & Framework
- **Stack:** NestJS + Vue 3 + pnpm + Vitest
- **Backend:** `presentation → application → domain ← infrastructure`.
- **Vue 3:** 4-File Split (`.vue`, `.component.ts`, `.template.html`, `.styles.css`). No `<script setup>`. Tokens use `InjectionKey<T>`.

## Anti-Patterns (Never Generate These)
```typescript
process.env.DATABASE_URL                          // ❌ Use config
switch (x) { case 'a': ... }                      // ❌ always forbidden
if (a) {} else if (b) {} else {}                  // ❌ Use Strategy Map
throw new Error('...')                            // ❌ return err(new DomainError(...))
Result<unknown>                                   // ❌ Result<Rule>, Result<TestResult>...
```