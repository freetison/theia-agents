# Plan: Backend HTTP/SSE + Frontend Vue 3 sobre Theia Agents

> **Estado:** Propuesto
> **Autor:** Software Architect Agent
> **Fecha:** 2026-05-31
> **Versión:** 1.0
> **Depende de:** `MIGRATION_DISK_TO_DB_V2.md` (Fase 1–3 entregadas)
> **Esfuerzo estimado:** 6–8 días/dev (3 backend + 3–5 frontend)

---

## 1. Contexto

Tras la migración a Postgres, el motor multi-agente sigue siendo CLI single-shot. Para usarlo desde una UI necesitamos:

1. **Backend HTTP** que exponga: crear sesión, ejecutar grafo, consultar histórico, gestionar perfiles/prompts/routing.
2. **Streaming de progreso**: el grafo tarda minutos (13 agentes × 5–30s c/u). La UI no puede hacer polling tonto.
3. **Frontend Vue 3** con la pantalla `TeamOverview` (provista por el usuario en sesión previa) + vistas de detalle e histórico.
4. **Alineamiento con Theia v2 principles**: NestJS, 4-File Split en Vue, DI con tokens, sin `as any`, sin `process.env` fuera de `main.ts`.

El código Vue provisto por el usuario es una buena base pero contiene errores menores (imports inexistentes, `as any`, reactividad rota en `getStatus()`) que el plan debe corregir, no copiar tal cual.

### Paquetes `@theia-core/*` reutilizables (publicados en `npm.pkg.github.com`)

| Paquete | Versión | Uso aquí |
|---|---|---|
| `@theia-core/result` | 1.2.0 | `ok/err/Result<T,E>/DomainError` — domain layer del backend |
| `@theia-core/logging` | 1.0.0+ | `createLogger(pino)` — engine + backend |
| `@theia-core/ai-provider` | 1.0.1+ | `IAIProvider`, `ProviderRegistry`, multi-tenant cascade — **reemplaza** `packages/engine/src/providers/*` en backend |
| `@theia-core/nestjs-core` | 1.0.5+ | Base módulo NestJS con Drizzle + Result |
| `@theia-core/config` | 2.0.24+ | Config con Vault — backend |
| `@theia-core/tenant-types` | publicado | Tipos compartidos multi-tenant |
| `@theia-core/domain-events`, `metrics`, `tracing`, `database-connector` | publicados | Observabilidad + persistencia |

**NO publicados** (replicamos patrones a mano): `eslint-config`, `sdk-vue`, `sdk-contracts`, `platform-contracts`.

**Bug detectado en `@theia-core/ai-provider/OllamaProvider`:** hardcodea `model: 'mistral:latest'` ignorando `providerConfig.model`. Mitigación: wrapper local en backend (`OllamaModelOverrideProvider`) o PR upstream.

---

## 2. Arquitectura propuesta (C4 contenedores)

```
┌─────────────────┐        HTTPS         ┌──────────────────────────┐
│   Browser SPA   │  ◄─────REST + SSE───► │   NestJS API (port 3000) │
│  Vue 3 + Vite   │                       │                          │
└─────────────────┘                       │  ┌────────────────────┐  │
                                          │  │ SessionController  │  │
                                          │  │ ProfileController  │  │
                                          │  │ PromptController   │  │
                                          │  │ ProgressGateway    │  │
                                          │  │   (SSE stream)     │  │
                                          │  └─────────┬──────────┘  │
                                          │            │             │
                                          │  ┌─────────▼──────────┐  │
                                          │  │ AgentEngineService │──┼──► LangGraph
                                          │  │   (wraps graph)    │  │    (in-process)
                                          │  └─────────┬──────────┘  │
                                          │  ┌─────────▼──────────┐  │
                                          │  │ Repos (Drizzle)    │  │
                                          │  └─────────┬──────────┘  │
                                          └────────────┼─────────────┘
                                                       ▼
                                              ┌─────────────────┐
                                              │   PostgreSQL    │
                                              └─────────────────┘
                                                       ▲
                                              ┌────────┴────────┐
                                              │ LLM Providers   │
                                              │ (Ollama/OpenAI/ │
                                              │  Anthropic/...) │
                                              └─────────────────┘
```

**Trade-off clave:** el grafo corre **in-process** dentro del API (no cola de jobs). Justificación: POC, 1 instancia, sesiones aisladas por `sessionId`. Si llega a >5 sesiones concurrentes o requiere durabilidad de cola, migrar a BullMQ/temporal en iteración siguiente. **Reversible** porque el `AgentEngineService` ya tiene la interfaz correcta para ser invocado desde un worker.

---

## 3. API Backend — contrato

### 3.1 Endpoints REST

| Método | Ruta | Propósito |
|---|---|---|
| `POST` | `/sessions` | Crea sesión `{profileId, problem}` → retorna `{sessionId, status: 'pending'}` |
| `POST` | `/sessions/:id/run` | Dispara ejecución asíncrona (202 Accepted) |
| `GET`  | `/sessions/:id` | Estado actual + outputs persistidos + final_report |
| `GET`  | `/sessions/:id/events` | **SSE stream** de progreso en vivo |
| `POST` | `/sessions/:id/resume` | Reanuda sesión `failed`/`partial` desde checkpoint |
| `GET`  | `/sessions` | Lista paginada `?status=&profileId=&from=&limit=` |
| `GET`  | `/profiles` | Lista perfiles activos del tenant |
| `GET`  | `/profiles/:id` | Detalle con agentes + dependencias |
| `POST` | `/profiles` | Crea/clona perfil |
| `GET`  | `/prompts?agentId=` | Lista versiones del prompt |
| `POST` | `/prompts/:agentId/versions` | Crea nueva versión + activación |
| `GET`  | `/agents` | Catálogo estático de agentes (metadata: icon, displayName, schema) |

**Convención:** todas las respuestas envueltas en `{data, meta?}`. Errores en `{error: {code, message, details?}}` (RFC 7807-ish).

### 3.2 SSE — formato de eventos

```
event: agent:start
data: {"sessionId":"...","agentId":"biz_evaluator","sequence":1,"ts":"..."}

event: agent:done
data: {"sessionId":"...","agentId":"biz_evaluator","summary":"...","confidence":0.85,"latencyMs":4231}

event: agent:failed
data: {"sessionId":"...","agentId":"...","error":"...","attempts":3}

event: session:completed
data: {"sessionId":"...","verdict":"GO","viabilityScore":7.5}

event: session:failed
data: {"sessionId":"...","error":"..."}
```

**Por qué SSE y no WebSocket:** unidireccional (server→client basta), reconexión nativa del browser, atraviesa proxies HTTP/1.1 sin upgrade. WebSocket sería overkill.

---

## 4. Stack y decisiones

### ADR-101: NestJS + Drizzle para el backend
**Status:** Propuesto
**Context:** Theia v2 principles obligan a NestJS + DI con tokens en `src/types.ts`, inyectar interfaces (`IXxx`), nada de `process.env` fuera de `main.ts`. El motor de agentes ya está en TS y comparte tipos Zod.
**Decision:** Monorepo con dos packages: `apps/backend` (NestJS) y `apps/frontend` (Vue 3 + Vite). El motor actual (`src/agents/*`, `src/graph.ts`, `src/state.ts`, `src/types.ts`) se extrae a `packages/engine` y se consume desde el backend.
**Consequences:**
- ✅ Reuso directo de schemas Zod en backend y frontend (via package compartido).
- ✅ Alineamiento total con principles del repo.
- ❌ Reestructurar el repo (1 día de Fase 0).

### ADR-102: SSE en lugar de WebSocket para progreso
**Status:** Propuesto
**Context:** Necesitamos empujar eventos del grafo al browser. El flujo es 100% server→client.
**Decision:** SSE con `@nestjs/sse` (`Sse()` decorator) sobre `Observable<MessageEvent>`. El `AgentEngineService` publica en un `Subject<EngineEvent>` por sesión; el controller `.pipe(filter(e => e.sessionId === id))`.
**Consequences:**
- ✅ Cero infra extra, reconexión gratis.
- ✅ Fácil testear con `curl -N`.
- ❌ Si se necesita input desde cliente (cancelar, pausar), hace falta otro canal HTTP (no es regresión, es ortogonal).

### ADR-103: Subject por-sesión, no global
**Status:** Propuesto
**Context:** Heredamos el problema de `theiaEvents` singleton del POC.
**Decision:** `SessionStreamRegistry` mantiene un `Map<sessionId, Subject>`. Cuando termina la sesión, `complete()` + delete. Las suscripciones SSE se cierran solas.
**Consequences:**
- ✅ Aislamiento por sesión.
- ✅ Liberación de memoria garantizada.
- ❌ Si hay 2 instancias del backend, los suscriptores ven solo eventos de la instancia que ejecuta. Mitigación futura: Redis Pub/Sub. **Aceptado para POC.**

### ADR-104: Vue 3 con 4-File Split (sin `<script setup>`)
**Status:** Propuesto
**Context:** Theia v2 principles obligan a `.vue` + `.component.ts` + `.template.html` + `.styles.css`, tokens vía `InjectionKey<T>`.
**Decision:** Mantener el patrón del código provisto por el usuario, **corrigiendo**:
- `prop`/`emit` no se importan de `vue` → usar `defineComponent({props, emits, setup(props, {emit})})`.
- `state` de `getStatus()` debe ser `reactive` o un `Ref` del servicio, no un snapshot.
- Eliminar `as any` en `TeamOverview.component.ts:getAgentSummary` → discriminar por `agent_name` con type-guard.
**Consequences:**
- ✅ Componentes legibles, estilo aislado, fácil testeo unitario del `.component.ts`.
- ❌ Más archivos por componente (aceptado por convención del repo).

### ADR-105: Servicio inyectado vs Pinia
**Status:** Propuesto
**Context:** El código del usuario usa `AGENTS_TOKEN` con un servicio. Pinia sería el "default" en Vue 3.
**Decision:** Servicio inyectado con `InjectionKey<IAgentsService>` (alineado con principles). El servicio internamente puede usar `reactive()` para estado compartido. **No Pinia.**
**Consequences:**
- ✅ Cero dependencia extra, testeable inyectando mocks.
- ✅ Coherente con DI del backend.
- ❌ Tooling de devtools menor (sin Pinia plugin).

### ADR-106: HTTP client = `fetch` nativo + `EventSource` para SSE
**Status:** Propuesto
**Context:** Axios añade ~14KB sin valor real para este caso.
**Decision:** `fetch` + wrapper `HttpClient` que centraliza headers, errores y baseURL. `EventSource` nativo para SSE.
**Consequences:**
- ✅ Bundle más pequeño.
- ❌ Polyfill manual si se requiere IE (no aplica).

### ADR-107: Auth diferida — header `X-Tenant-Id` en POC
**Status:** Propuesto
**Context:** Multi-tenancy está en el modelo de datos pero no hay login.
**Decision:** Middleware NestJS lee `X-Tenant-Id` y lo inyecta en el `RequestContext`. En frontend va hardcoded por env. Auth real (JWT/OIDC) queda fuera de alcance.
**Consequences:**
- ✅ Desbloquea desarrollo sin armar Keycloak/Auth0.
- ❌ Inseguro para deploy público. Documentado como deuda explícita.

---

## 5. Estructura de carpetas propuesta

```
theia-agents/
├── packages/
│   └── engine/                    # extraído del src/ actual
│       ├── src/
│       │   ├── agents/
│       │   ├── providers/
│       │   ├── graph.ts
│       │   ├── state.ts
│       │   ├── schemas.ts         # ex-types.ts (Zod schemas reusables)
│       │   └── index.ts           # exports públicos
│       └── package.json
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts            # único lugar con process.env
│   │   │   ├── app.module.ts
│   │   │   ├── types.ts           # tokens DI
│   │   │   ├── infra/
│   │   │   │   ├── db/            # drizzle + repos (de plan v2)
│   │   │   │   └── llm/           # providers wrappers
│   │   │   ├── modules/
│   │   │   │   ├── sessions/
│   │   │   │   │   ├── sessions.controller.ts
│   │   │   │   │   ├── sessions.service.ts
│   │   │   │   │   ├── session-stream.registry.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── profiles/
│   │   │   │   ├── prompts/
│   │   │   │   └── agents/
│   │   │   └── common/
│   │   │       ├── tenant.middleware.ts
│   │   │       ├── result.interceptor.ts
│   │   │       └── error.filter.ts
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── main.ts            # provee AGENTS_TOKEN
│       │   ├── App.vue
│       │   ├── tokens/
│       │   │   ├── AGENTS_TOKEN.ts
│       │   │   ├── HTTP_TOKEN.ts
│       │   │   └── SESSIONS_TOKEN.ts
│       │   ├── services/
│       │   │   ├── HttpClient.ts
│       │   │   ├── AgentsService.ts
│       │   │   └── SessionsService.ts
│       │   ├── composables/
│       │   │   ├── useAgents.ts
│       │   │   ├── useSession.ts
│       │   │   └── useSessionStream.ts
│       │   ├── components/
│       │   │   ├── AgentCard/
│       │   │   ├── ConfidenceBadge/
│       │   │   └── VerdictBadge/
│       │   ├── views/
│       │   │   ├── TeamOverview/
│       │   │   ├── SessionHistory/
│       │   │   ├── AgentDetail/
│       │   │   └── ProfileEditor/
│       │   └── router/
│       │       └── index.ts
│       ├── vite.config.ts
│       └── package.json
└── pnpm-workspace.yaml
```

**Justificación monorepo:** el `packages/engine` se importa con `workspace:*` (alineado con principles: `NEVER "latest" o "dev"`).

---

## 5.bis Regla de testing (NO NEGOCIABLE)

🚫 **No se hace commit sin todos los tests en verde.**

- Cada feature incluye sus unit tests en el MISMO commit.
- Hook `pre-commit` con Husky + lint-staged corre `pnpm test` y bloquea si falla.
- CI corre `pnpm test` en cada PR; merge bloqueado si rojo.
- Cobertura mínima por package: **80% líneas, 70% branches**.
- Tests deben correr en <30s en local (engine), <60s en CI completo. Si crecen más, marcar como `integration` y separar de `unit`.

**Frameworks:**
- `packages/engine`: Vitest.
- `apps/backend`: Vitest + `@nestjs/testing` para módulos.
- `apps/frontend`: Vitest + `@vue/test-utils` para componentes y composables.
- E2E (Fase 8): Playwright.

**Qué se testea (mínimo por capa):**
- **Engine:** schemas Zod (preprocess y casos límite), `extractJson`, validación de perfiles (dependencias rotas → throw), cada agente node con LLM mockeado.
- **Backend:** controllers (request/response shape), services (lógica), SSE registry (suscripción/cleanup), repos (con DB en memoria o testcontainer).
- **Frontend:** composables (`useAgents`, `useSessionStream`), componentes (.component.ts puro sin runtime Vue cuando posible), templates con `@vue/test-utils`.

---

## 6. Plan de ejecución por fases

### Fase 0 — Reestructuración a monorepo (1 día)
- [ ] `pnpm-workspace.yaml` + mover `src/` → `packages/engine/src/`.
- [ ] `packages/engine/package.json` exporta `engine`, `schemas`, `IProvider`, etc.
- [ ] Actualizar CLI actual (`apps/cli` opcional o se elimina) para validar que el engine funciona standalone.
- [ ] Smoke test: `pnpm --filter engine test`.

### Fase 1 — Backend NestJS esqueleto (1 día)
- [ ] `nest new apps/backend` + tokens DI en `src/types.ts`.
- [ ] `TenantMiddleware` (lee `X-Tenant-Id`).
- [ ] Módulos vacíos: `SessionsModule`, `ProfilesModule`, `PromptsModule`, `AgentsModule`.
- [ ] `HealthController` + Swagger en `/docs`.
- [ ] Drizzle module + repos del plan V2 reusados.

### Fase 2 — SessionsModule + AgentEngineService (1 día)
- [ ] `AgentEngineService.run(sessionId)`: invoca `packages/engine` con `SessionContext` (dispatcher inyectado).
- [ ] `SessionStreamRegistry`: `Map<sessionId, Subject<EngineEvent>>`.
- [ ] `POST /sessions` → crea fila DB.
- [ ] `POST /sessions/:id/run` → `engine.run()` en `setImmediate` (no espera), responde 202.
- [ ] `GET /sessions/:id/events` con `@Sse()` filtrando por sessionId.
- [ ] `GET /sessions/:id` agrega outputs persistidos.
- [ ] Tests e2e: crear sesión → suscribirse a SSE → verificar evento `session:completed`.

### Fase 3 — Endpoints de catálogo (0.5 día)
- [ ] `GET /agents` — metadata estática (icon, displayName, schema export del engine).
- [ ] `GET /profiles` + `GET /profiles/:id`.
- [ ] `GET /prompts?agentId=` con paginación.

### Fase 4 — Frontend esqueleto + DI (0.5 día)
- [ ] `vite create apps/frontend --template vue-ts`.
- [ ] Eliminar `<script setup>` default; configurar 4-File Split.
- [ ] `main.ts` provee `HTTP_TOKEN`, `AGENTS_TOKEN`, `SESSIONS_TOKEN`.
- [ ] `HttpClient` con `fetch` + headers `X-Tenant-Id` desde env.
- [ ] Router con 3 rutas vacías: `/`, `/sessions/:id`, `/sessions`.

### Fase 5 — TeamOverview (corregido) (1 día)
Partiendo del código provisto por el usuario, **aplicar correcciones**:

| # | Fix | Archivo |
|---|---|---|
| F1 | `prop`/`emit` no existen como imports — usar `defineComponent({setup(props, {emit})})` | `AgentCard.component.ts`, `ConfidenceBadge.component.ts` |
| F2 | `state` debe ser `reactive`, no snapshot de `getStatus()` | `useAgents.ts`, `AgentsService.ts` |
| F3 | Eliminar `as any` en `getAgentSummary` — type-guard por `agent_name` | `TeamOverview.component.ts` |
| F4 | `progress` referenciado en template pero no en setup | `AgentCard.template.html` |
| F5 | Catálogo de agentes hardcoded → mover a `GET /agents` | `TeamOverview.component.ts` |
| F6 | `runAllAgents(problem)` debe abrir EventSource a `/sessions/:id/events`, no polling | `AgentsService.ts` |

Entregables:
- [ ] `ConfidenceBadge/` (4 archivos).
- [ ] `AgentCard/` (4 archivos).
- [ ] `TeamOverview/` (4 archivos).
- [ ] `AgentsService` implementa `IAgentsService` y consume `SessionsService`.
- [ ] `useSessionStream(sessionId)` composable que abre `EventSource` y actualiza `reactive`.

### Fase 6 — SessionHistory + AgentDetail (1 día)
- [ ] `SessionHistory/` — tabla paginada con `GET /sessions`.
- [ ] `AgentDetail/` — muestra `structured_output` JSON con highlight + `raw_response` colapsable.
- [ ] Router: `/sessions/:id/agents/:agentId`.

### Fase 7 — ProfileEditor (0.5 día, opcional)
- [ ] CRUD básico de perfiles.
- [ ] Validación: dependencias (`requires`) forman DAG.

### Fase 8 — Validación end-to-end (1 día)
- [ ] Cypress o Playwright: crear sesión desde UI → ver 13 cards transitionar idle→running→completed → ver veredicto.
- [ ] Stress: 5 sesiones concurrentes desde 5 pestañas, verificar aislamiento de SSE.
- [ ] Lighthouse pass en TeamOverview (target: perf >80, a11y >90).

---

## 7. Mapeo de los issues del código provisto

| Issue | Severidad | Resolución |
|---|---|---|
| `import { prop, emit } from 'vue'` | 🔴 Bloqueante (no compila) | Usar `defineComponent({props, emits, setup(props, ctx)})` |
| `state` de `getStatus()` retorna referencia muerta | 🔴 Bloqueante (no reactivo) | Servicio expone `state: Readonly<Reactive<AgentsState>>` |
| `as any` en `getAgentSummary` | 🟡 Viola principles | Discriminated union por `agent_name` |
| Catálogo agentes hardcoded en componente | 🟡 Acoplamiento | Mover a endpoint `/agents` |
| `runAllAgents` no especifica streaming | 🟡 Sin progreso real | Abrir `EventSource` interno + actualizar `reactive` |
| `progress` en template sin definir en setup | 🟢 Bug visual | Añadir `progress` al estado o quitar del template |
| Sin manejo de error en `AgentCard.error` | 🟢 UX faltante | Mostrar `error` text si `state.errors[name]` |

---

## 8. Trade-offs explícitos

| Decisión | Ganas | Pierdes |
|---|---|---|
| Engine in-process en API | Simplicidad, latencia baja | Escalado horizontal limitado; OOM si N sesiones grandes |
| SSE en lugar de WebSocket | Sin infra extra, reconexión gratis | Sin canal cliente→server |
| Servicio + InjectionKey (no Pinia) | Coherencia con backend, cero deps | Sin devtools dedicado |
| Subject por-sesión (no Redis) | Cero dependencias | No funciona multi-instancia |
| 4-File Split sin `<script setup>` | Tests del .ts sin Vue runtime, alineado principles | Más archivos por componente |
| Header `X-Tenant-Id` (sin auth) | Desbloquea POC | Inseguro para deploy público |
| Engine como package separado | Reutilizable desde CLI/worker/test | Build paso extra |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| SSE detrás de proxy con buffering corta stream | Media | Alto | Header `X-Accel-Buffering: no`, `Cache-Control: no-cache`; documentado en deploy notes |
| Llama3.2 local tarda demasiado, timeout del proxy | Alta en local | Medio | Heartbeat SSE cada 15s; configurar timeout del proxy >10min |
| Schemas Zod del engine no compatibles con Vue (imports node) | Baja | Medio | Build dual ESM del package `engine` |
| Reactividad rota en `state` cruzado por servicio | Media | Alto | Tests unitarios con `nextTick()` que verifiquen re-render |
| Bundle frontend pesa por reusar schemas Zod | Media | Bajo | Tree-shaking de Vite + import puntual; medir con `vite build --report` |
| Múltiples pestañas mismo usuario duplican `engine.run()` | Media | Medio | Backend rechaza `POST /run` si status != 'pending'; UI bloquea botón |

---

## 10. Criterios de aceptación

1. ✅ `pnpm --filter backend dev` arranca NestJS en :3000 con Swagger en `/docs`.
2. ✅ `pnpm --filter frontend dev` arranca Vite en :5173 conectado al backend.
3. ✅ Click en "Run Full Team" desde `TeamOverview` crea sesión, los 13 cards transitan de `idle` → `running` → `completed` en tiempo real (sin recargar).
4. ✅ Cerrar pestaña + reabrir = el estado se reconstruye desde `GET /sessions/:id`.
5. ✅ 5 pestañas con 5 sesiones distintas no se mezclan eventos.
6. ✅ Matar backend a mitad de sesión + restart + `POST /resume` → continúa sin reejecutar agentes ya persistidos (depende de Fase 4 del plan V2).
7. ✅ Cero `as any`, cero `process.env` fuera de `main.ts`, cero `<script setup>`.
8. ✅ Lighthouse en TeamOverview: perf ≥80, a11y ≥90.
9. ✅ E2E test pasa: crear → ejecutar → verificar veredicto en UI.

---

## 11. Lo que NO está en alcance

- ❌ Auth real (JWT/OIDC) — usar `X-Tenant-Id` header.
- ❌ Edición de prompts desde UI con preview live.
- ❌ Multi-instancia backend / load balancing.
- ❌ i18n del frontend.
- ❌ PWA / offline.
- ❌ Mobile-first profundo (responsive básico solo).
- ❌ Worker queue para el engine (queda para iteración siguiente).

---

## PROMPT DE VERIFICACIÓN (anti-loop)

> Eres un **auditor escéptico senior** revisando este plan antes de aprobar su ejecución. Tu trabajo NO es validar que suena bien — es encontrar dónde se romperá en la práctica. Sé duro, pero respetuoso con el trabajo previo: no pidas reescrituras totales si una corrección puntual basta.
>
> **Verifica con evidencia del código real (cita archivo:línea o resultado de grep):**
>
> 1. **Engine in-process (ADR-101 + Sec 2):** Si el grafo corre dentro del proceso del API, ¿qué pasa con `process.uncaughtException` durante una sesión? ¿El API se cae y arrastra a TODAS las sesiones activas? Propón mitigación concreta o acepta el riesgo.
> 2. **SSE detrás de Nginx/Cloudflare (ADR-102 + Riesgo SSE):** Confirma con docs oficiales si `X-Accel-Buffering: no` basta o se necesitan también `proxy_buffering off` y `proxy_read_timeout`. Si el deploy target no está definido, marca como `RESUELTO POR DECISIÓN: se documenta al desplegar`.
> 3. **`SessionStreamRegistry` (ADR-103):** ¿Qué pasa si un cliente se suscribe ANTES de que el engine emita el primer evento? El `Subject` debe ser `ReplaySubject(bufferSize=N)` o el cliente perderá eventos iniciales. Verifica que el plan lo especifica — si no, ajústalo.
> 4. **Reactividad de `state` (Fix F2 + ADR-105):** El código del usuario hace `const state = agentsService.getStatus()`. Si `AgentsService` internamente reasigna `this._state = {...}`, el `state` retornado queda obsoleto. El fix debe ser EXPLÍCITO: `getStatus()` devuelve `Readonly<UnwrapRef<typeof reactiveState>>`, NO un snapshot. Verifica que el plan lo deja claro.
> 5. **Catálogo de agentes (Fix F5):** El endpoint `GET /agents` requiere que el `engine` exporte metadata (icon, displayName, schema). ¿El POC actual tiene esa metadata? Lee `packages/engine/src/agents/*.ts` y dime si hay icons/displayNames o solo nombres técnicos. Si no existen, el plan debe añadir un `agents.catalog.ts` en el engine.
> 6. **Tokens DI (Sec 4 / `src/types.ts`):** Los principles dicen "Tokens definidos solo en `src/types.ts`". El plan crea tokens en `apps/backend/src/types.ts` y `apps/frontend/src/tokens/*.ts`. ¿Es una violación o el principle aplica solo intra-package? Aclara o decide.
> 7. **Workspace `engine` consumido por frontend (Sec 5):** Si `packages/engine` importa Node APIs (`fs`, `path` para `loadProfile`), va a romper en browser. Verifica con grep `from "fs"` o `from "node:fs"` en `src/`. Si hay, el split debe ser `engine-core` (puro) + `engine-node` (loaders).
> 8. **`engine.run()` en `setImmediate` (Fase 2):** Sin `await`, errores no atrapados van al `unhandledRejection`. ¿El plan especifica handler? Si no, añadir línea.
> 9. **Llama3.2 latencia + heartbeat SSE (Riesgo):** El heartbeat de 15s va por encima del `Subject` o del transporte HTTP? Si el `Subject` está vacío, el SSE no emite NADA. Hay que emitir un `event: ping` periódico desde el controller, no desde el engine. Verifica.
> 10. **Test E2E (Fase 8):** ¿Cypress/Playwright están en `devDependencies` del repo? Verifica `package.json`. Si no, añadir instalación a Fase 0 o eliminar el criterio.
>
> **Entrega:** lista numerada de hallazgos. Para cada uno:
> - **Severidad:** 🔴 bloqueante / 🟡 ajuste / 🟢 nota.
> - **Evidencia:** cita `archivo:línea` o resultado de grep.
> - **Acción concreta** (un cambio puntual al plan, no "rediseñar todo").
>
> Si no encuentras nada en un punto, di "verificado, sin hallazgos" — no inventes.

### Cómo romper el loop en la práctica

Si tras 2 iteraciones del auditor sigues recibiendo hallazgos en los MISMOS puntos:

1. **Hallazgos repetidos del mismo punto:** márcalo como `RESUELTO POR DECISIÓN: <texto breve>` en este plan y NO lo vuelvas a abrir. La duda permanente se documenta como ADR de seguimiento, no como bloqueo.

2. **Auditor pide "más datos" indefinidamente:** corta — ejecuta un spike de máximo 4 horas con código real (no más análisis). Documenta resultado en `## Anexo: Spike <fecha>` dentro de este plan.

3. **Hallazgos NUEVOS en cada iteración:** detén la planificación, empieza la Fase 0. Los hallazgos restantes se vuelven tickets en `todos` (SQLite de sesión) y se atacan durante implementación, no antes.

4. **Cuándo declarar el plan "good enough":**
   - 8 fases tienen criterios de aceptación verificables ✓
   - 7 ADRs con consequences explícitas ✓
   - 7 fixes del código provisto mapeados ✓
   - No hay riesgo 🔴 sin mitigación ✓
   → **Aprobar y ejecutar.**

5. **Regla dura:** este plan no debe re-escribirse más de 3 veces. En la 4ª revisión, el problema NO es el plan — es indecisión. Convoca decisión humana y cierra.
