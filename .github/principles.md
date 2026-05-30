# Theia v2 — Non-Negotiable Principles

> **Last Updated: 2026-05-08 | Version: 2.0**
>
> Single source of truth. Referenced by every CLAUDE.md and copilot-instructions.md.
> **Edit here only** — never duplicate these rules in per-repo files.
>
> **v2.0 changes:** Pragmatic refinement of branching rules · explicit anemic-domain + rules-driven philosophy (see §14) · clarified PG/Mongo dual multi-tenancy.

---

## 1. Branching (ADR-015) — Pragmatic but Strict

> **Principio rector:** NO-IF aplica a decisiones de negocio. NO aplica a invariantes estructurales.
>
> **Test antes de cualquier branching:**
> *"¿Esta condición cambiaría si Product cambia de opinión mañana?"*
> - **SÍ** → decisión de negocio → ruleset o Strategy Map. Fuera del código.
> - **NO** → invariante técnico → branching permitido bajo las reglas siguientes.

| Construct | Status | When |
|-----------|--------|------|
| Single `if` (guard clause, validation, binary decision) | ✅ Allowed | Input validation, null checks, boolean flag |
| `if / else` (exactly 2 branches) | ✅ Allowed | Binary decision only |
| `if / else if / else` (3+ branches) | ❌ Prohibited | Use Factory / Strategy Map / `Record<K,V>` |
| `switch` on business state (tier, plan, country…) | ❌ Prohibited | Move to ruleset or Strategy Map |
| `switch` on structural enum / discriminated union | ✅ Allowed | Must carry `// ADR-015: <concrete reason>` |
| Ternary `a ? b : c` | ✅ Allowed | Same rule as binary if |
| Nested ternary | ❌ Prohibited | Use Strategy Map |
| Nesting >2 levels | ❌ Prohibited | Extract named function or move to ruleset |

```typescript
// ❌ PROHIBITED — business branching
if (user.tier === 'gold') { ... } else if (user.tier === 'silver') { ... }
switch (plan.type) { case 'monthly': ... }
const fee = invoice.country === 'ES' ? 0.21 : 0.20;

// ✅ Guard clause (structural)
if (!cmd.payload.id) return err(new DomainError('VALIDATION', 'id required'));
if (result.isErr()) return result;

// ✅ Structural switch with ADR-015 annotation
// ADR-015: structural switch on OutboxState enum — finite state machine, not a business decision
switch (message.state) { case 'pending': ...; default: ...; }

// ✅ Strategy Map (3+ business branches → always use this)
const handlers: Record<Action, Handler> = {
  create:  () => this.handleCreate(cmd),
  update:  () => this.handleUpdate(cmd),
  delete:  () => this.handleDelete(cmd),
  publish: () => this.handlePublish(cmd),
};
return (handlers[cmd.action] ?? this.unknownAction)(cmd);
```

## 2. Config — `@theia-core/config` Only

```typescript
// ✅ Backend bootstrap (only place process.env is allowed)
const config = await createConfig({
  mode: 'backend',
  vaultPath: 'secret/theia-dev/my-service',
  vaultToken: process.env.VAULT_TOKEN,
  vaultUrl:   process.env.VAULT_ADDR,
});
await config.validate(['DATABASE_URL', 'KEYCLOAK_REALM', 'RABBITMQ_URL']);
const port = config.getRequired('PORT'); // never hardcode

// ✅ Frontend Vue
const config = createConfig({ mode: 'frontend' });
const apiUrl = config.getRequired('API_URL'); // reads VITE_API_URL

// ❌ PROHIBITED everywhere else
process.env.DATABASE_URL
import.meta.env.VITE_API_URL
app.listen(3001) // → config.getRequired('PORT')
```

---


## 3. Dependency Injection — Interfaces Only, Constructor Only

**Zero concrete classes injected anywhere.** Every dependency is declared as an interface (`IXxx`) bound to a token in `src/types.ts`.

```typescript
// ✅
@Inject(TYPES.PaymentRepository) private readonly repo: IPaymentRepository
@Inject(TYPES.OutboxService)     private readonly outbox: IOutboxService

// ❌ PROHIBITED
@Inject(TYPES.OutboxService)     private readonly outbox: MongoOutboxService // concrete class
private readonly repo = new PaymentRepository();                              // new outside module
const MY_TOKEN = Symbol('x');                                                 // token outside types.ts
```

**Rule of thumb:** if the type after `:` is not an interface starting with `I`, the build should fail (ESLint custom rule pending — see action plan).

---

## 4. Result Pattern — No Throw in Domain

```typescript
// ✅
return ok(payment);
return err(new DomainError('NOT_FOUND', 'Payment not found'));

// ❌ PROHIBITED in domain/application
throw new Error('Not found');
throw new NotFoundException();
```


## 5. TypeScript Strict

- Zero `any` — use `unknown` + type guards
- Interfaces before implementations (`IPaymentRepository` not `PaymentRepository`)
- All function return types explicit
- No cross-slice imports — only via EventBus (internal) or Outbox (external)

---

## 6. Package Manager — pnpm Only & GitHub Registry

```bash
pnpm install        # ✅
pnpm add <pkg>      # ✅
npm install         # ❌
yarn add            # ❌
```

**Within the monorepo (development):**
- Internal package references use `workspace:*` or `catalog:` — these are resolved by pnpm workspaces. ✅
- `file:` and `link:` references are **PROHIBITED** — they bypass the registry and create fragile path coupling. ❌
- Version specifiers `"latest"` or `"dev"` for internal packages are **PROHIBITED**. ❌

**Published packages consumed outside the monorepo:**
- Must be published to and consumed from the **GitHub Package Registry** (`npm.pkg.github.com`).
- External consumers (CI, production images, separate repos) must never rely on local workspace paths.

> **Decision log (2026-05-28):** `workspace:*` is the canonical approach for internal monorepo dependencies during MVP. This supersedes any prior "never local references" wording. See F1 of PLATFORM_HARDENING_MVP.md.

---

## 7. NestJS Service Structure (Vertical Slice + DDD)

```
src/
├── types.ts              # ALL DI tokens — Symbol() ONLY here
├── main.ts               # bootstrap only
├── features/[feature]/
│   ├── application/
│   │   ├── commands/     # [name].command.ts + [name].handler.ts
│   │   ├── queries/      # [name].query.ts + [name].handler.ts
│   │   └── events/       # [name].event.ts + [name].handler.ts → Outbox
│   ├── presentation/     # controller · module · dto/
│   └── domain/           # entities/ · value-objects/ · interfaces/
└── infrastructure/
    ├── database/         # Drizzle ORM repositories
    ├── messaging/        # outbox/ · saga/
    └── common/           # filters · guards · interceptors
```

Dependencies: `presentation → application → domain ← infrastructure`

---

## 8. Vue 3 — Angular-Style (4 Files, No script setup)

```vue
<!-- component.vue — glue only -->
<script lang="ts" src="./component.component.ts" />
<template src="./component.template.html" />
<style scoped src="./component.styles.css" />
```

```typescript
// tokens.ts — always InjectionKey<T>, never string
export const SERVICE_KEY: InjectionKey<IService> = Symbol('IService');
```

Prohibited: `<script setup>`, `inject('string')`, `import.meta.env.VITE_*`, nested `v-if` > 1 level, business logic in templates.

---

## 9. Tests — Coverage ≥ 90%

- Framework: Vitest + `unplugin-swc` (NestJS decorators)
- Minimum: **90% lines · functions · branches · statements** per file
- Exclude: `main.ts` · `*.module.ts` · `types.ts` · `*.vue` · `tokens.ts`
- Pattern: builders (`buildXCommand(overrides?)`) — no inline fixtures
- NestJS: `Test.createTestingModule()` — no full app bootstrap in unit tests
- E2E: Playwright

---

## 10. Naming Conventions

| Artifact | Convention |
|----------|-----------|
| Interface | `I` + PascalCase — `IPaymentRepository` |
| Command/Query | `process-payment.command.ts` |
| Handler | `process-payment.handler.ts` |
| Event | `payment-processed.event.ts` |
| NestJS Module | `payment.module.ts` |
| Factory | `payment-strategy.factory.ts` |
| DI Tokens | `TYPES.X` in `src/types.ts` |
| Vue glue | `payment-form.vue` |
| Vue logic | `payment-form.component.ts` |
| Vue template | `payment-form.template.html` |
| Vue styles | `payment-form.styles.css` |
| Composable | `use-payment-submit.composable.ts` |
| Pinia store | `tenant.store.ts` |
| Vue tokens | `InjectionKey<T>` in `src/tokens.ts` |
| Spec | same name + `.spec.ts` next to source |
| Builder | `buildProcessPaymentCommand(overrides?)` |

---

## 11. PR Checklist

- [ ] No `if-else if-else` (3+ branches) and no `switch` in domain/application — ESLint enforces
- [ ] `process.env` only in `main.ts` for `VAULT_TOKEN`/`VAULT_ADDR`
- [ ] No manual `tenant_id` filters outside repositories (PG: middleware; Mongo: repo boundary)
- [ ] All deps injected via `@Inject(TYPES.X)` **as interface** (`IXxx`) — never a concrete class
- [ ] Commands/Queries are pure DTOs — no methods
- [ ] EventHandler writes to Outbox — never publishes to broker directly
- [ ] Sagas only emit Commands — no direct logic
- [ ] Controller only dispatches to CommandBus/QueryBus
- [ ] Vue: 3 separate files, no `<script setup>`
- [ ] Vue: tokens are `InjectionKey<T>`
- [ ] Coverage ≥ 90% — `pnpm test:coverage`
- [ ] Tests use builders, not inline fixtures
- [ ] Internal monorepo deps use `workspace:*` or `catalog:` — no `file:` or `link:` references
- [ ] No `as X` casts except on `unknown` after Zod validation
- [ ] New port follows priority scheme + documented in PORT_ALLOCATION.md
- [ ] New service registered in deploy-cli registry
- [ ] If new logic was added: ask "could this be a rule?" before writing a handler (see §14)



## 12. Type Strictness — No `as` Without Validation

```typescript
// ✅ Cast after Zod parse (Zod proves the shape)
const parsed = CreateRuleSchema.parse(body);          // returns CreateRuleRequest
return this.commandBus.execute(new CreateRuleCommand(parsed));

// ✅ Cast unknown → T after a runtime guard
function isRule(x: unknown): x is Rule { /* ... */ }
if (isRule(value)) { /* value is Rule here */ }

// ❌ PROHIBITED — `as` to silence the compiler
const rule = cmd.payload.body as CreateRuleRequest;
const map  = updated as unknown as Record<string, unknown>;
const id   = currentRule.value?.appId as string;
```

**`Result<unknown>` in controllers is also banned.** Type the success branch:
`Promise<Result<Rule>>`, `Promise<Result<TestResult>>`, etc.


