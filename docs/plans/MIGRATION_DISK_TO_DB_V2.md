# Plan: Migración de Persistencia en Disco → PostgreSQL (Theia Agents v2)

> **Estado:** Propuesto
> **Autor:** Software Architect Agent
> **Fecha:** 2026-05-31
> **Versión:** 1.0
> **Esfuerzo estimado:** 4–5 días/dev

---

## 1. Contexto

Theia Agents es hoy un POC CLI single-shot:

- 13 agentes orquestados en grafo lineal (LangGraph).
- Configuración, prompts, perfiles sectoriales y outputs de sesión viven **en disco**.
- Pensado para una sola ejecución por proceso, sin concurrencia ni multi-tenant.

El objetivo es **migrar todo lo persistente en disco a PostgreSQL** para habilitar:

1. Histórico consultable de sesiones por tenant.
2. Versionado de prompts y perfiles.
3. Métricas operativas (costo, latencia, tokens) por agente.
4. Multi-tenancy alineado con Theia v2 (`applyTenantMiddleware`).
5. Reanudación de sesiones fallidas sin re-ejecutar agentes ya completados.

**Crítico:** este NO es un lift-and-shift. El POC tiene problemas estructurales (singleton de eventos, acoplamiento por orden, schemas con `z.any()`) que se vuelven bloqueantes en producción multi-tenant. El plan los aborda en la misma iteración.

---

## 2. Inventario actual (lo que vive en disco)

| Recurso | Ruta | Naturaleza | Cambio | Destino DB |
|---|---|---|---|---|
| Routing agente→LLM | `config/agents.json` | Config global | Medio | `agent_model_routing` |
| Prompts por agente | `config/prompts/*.txt` | Templates Mustache-like | **Alto** | `prompts` (versionado) |
| Problema default | `config/problem.txt` | Input | Por sesión | No persiste (input request) |
| Perfiles sectoriales | `profiles/*.json` | 5 perfiles (it, minorista…) | Medio | `profiles` + `profile_agents` |
| Outputs por agente | `sessions/<ts>/<agent>.md` | Write-once por sesión | Append-only | `session_agent_outputs` |
| Reporte final | `sessions/<ts>/result.md` | Write-once por sesión | Append-only | `sessions.final_report` |

---

## 3. Problemas estructurales detectados (deben abordarse en esta migración)

| # | Problema | Archivo | Severidad | Fix |
|---|---|---|---|---|
| P1 | `theiaEvents` es `EventEmitter` global → corrompe datos con sesiones concurrentes | `src/events.ts:12`, `src/session.ts:32` | 🔴 Bloqueante | Dispatcher por-sesión inyectado |
| P2 | Dependencias entre agentes implícitas por orden del array | `src/agents/softwareArchitect.ts:11` (`if (!state.bizOutput) throw`) | 🔴 Bloqueante | `requires: string[]` declarativo + validación al cargar perfil |
| P3 | Estado tipado nominalmente (12 campos hardcoded) vs perfiles dinámicos | `src/state.ts:36-84` | 🟡 Alto | `agentOutputs: Map<agentId, unknown>` + tipado en consumidor |
| P4 | Schemas con `z.any()` en campos críticos | `src/types.ts` (marketing, sales, cfo, legal, cxo, cs, competitor) | 🟡 Alto | Definir sub-schemas reales |
| P5 | `process.env` fuera de `main.ts` | `src/ollama.ts:1`, `src/providers/OllamaProvider.ts:3` | 🟡 Medio | Centralizar config |
| P6 | `as any` en construcción del grafo | `src/graph.ts:71` | 🟢 Bajo | Builder tipado |
| P7 | Sin reintentos ante fallos LLM | `src/llm.ts:6-10` | 🟡 Alto | Wrapper con backoff exponencial |
| P8 | Sin métricas de tokens/costo/latencia | `IProvider.generate` devuelve solo `string` | 🟡 Alto | Devolver `{text, usage}` |
| P9 | Sin checkpointing → fallo en agente N reejecuta N-1 LLM calls | Grafo entero | 🟡 Alto | `PostgresSaver` de LangGraph |

---

## 4. Modelo de datos propuesto (PostgreSQL + JSONB)

### 4.1 Diagrama de relaciones (texto)

```
tenants ──┬─< profiles ──< profile_agents
          ├─< prompts (versionado)
          ├─< agent_model_routing
          └─< sessions ──┬─< session_agent_outputs
                         └─< session_events (auditoría opcional)
```

### 4.2 DDL (Drizzle-friendly)

```sql
-- Multi-tenant root
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfiles sectoriales (lo que hoy vive en profiles/*.json)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  slug TEXT NOT NULL,            -- 'it', 'minorista', ...
  name TEXT NOT NULL,
  description TEXT,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, slug, version)
);

-- Agentes de un perfil con dependencias explícitas (resuelve P2)
CREATE TABLE profile_agents (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,         -- 'biz_evaluator', ...
  sequence INT NOT NULL,          -- orden de ejecución (legacy)
  context TEXT,                   -- contexto sectorial inyectado
  requires TEXT[] NOT NULL DEFAULT '{}',  -- ['biz_evaluator', ...]
  PRIMARY KEY (profile_id, agent_id)
);

-- Prompts versionados (resuelve "alta frecuencia de cambio")
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- NULL = global
  agent_id TEXT NOT NULL,
  version INT NOT NULL,
  template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, agent_id, version)
);
CREATE UNIQUE INDEX one_active_prompt_per_agent
  ON prompts (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), agent_id)
  WHERE is_active;

-- Routing agente → provider/model
CREATE TABLE agent_model_routing (
  tenant_id UUID REFERENCES tenants(id),  -- NULL = fallback global
  agent_id TEXT NOT NULL,                  -- '*' = default
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  PRIMARY KEY (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), agent_id)
);

-- Sesiones (1 ejecución = 1 fila)
CREATE TYPE session_status AS ENUM ('pending', 'running', 'completed', 'failed', 'partial');
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  problem TEXT NOT NULL,
  status session_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  final_report JSONB,
  error JSONB,
  total_cost_usd NUMERIC(10,4),
  total_tokens_in INT,
  total_tokens_out INT
);
CREATE INDEX sessions_tenant_created ON sessions (tenant_id, started_at DESC);
CREATE INDEX sessions_status ON sessions (status) WHERE status IN ('running', 'pending', 'failed');

-- Output por agente (lo que hoy es session/<ts>/<agent>.md)
CREATE TABLE session_agent_outputs (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  sequence INT NOT NULL,
  role TEXT NOT NULL,
  summary TEXT NOT NULL,
  structured_output JSONB NOT NULL,
  raw_response TEXT,
  prompt_id UUID REFERENCES prompts(id),     -- reproducibilidad
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  latency_ms INT,
  tokens_in INT,
  tokens_out INT,
  cost_usd NUMERIC(10,6),
  status TEXT NOT NULL DEFAULT 'completed',   -- 'completed' | 'failed' | 'retried'
  attempts INT NOT NULL DEFAULT 1,
  ts TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, agent_id)              -- idempotencia
);
CREATE INDEX outputs_session_seq ON session_agent_outputs (session_id, sequence);

-- Eventos de auditoría (opcional, append-only)
CREATE TABLE session_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,    -- 'agent:start', 'agent:done', 'agent:failed', 'session:completed'
  payload JSONB
);
```

### 4.3 Notas de diseño

- **`tenant_id NULL` = global**: permite seed con perfiles/prompts/routing por defecto. Tenants pueden sobreescribir.
- **`UNIQUE (session_id, agent_id)` en outputs**: garantiza idempotencia para reanudación.
- **Prompts versionados con flag `is_active`**: cada sesión persiste `prompt_id` para reproducibilidad exacta.
- **JSONB en `structured_output`**: tamaño esperado 5–200 KB. Si crece (>1MB sostenido), evaluar S3/Blob con puntero.
- **No se indexa JSONB por defecto**: solo añadir GIN si aparecen queries reales que lo justifiquen.

---

## 5. ADRs clave

### ADR-001: Persistencia en PostgreSQL con JSONB para outputs
**Status:** Propuesto
**Context:** Outputs estructurados de cada agente son objetos heterogéneos (12 schemas distintos) que evolucionan rápido y casi nunca se consultan por campo interno.
**Decision:** Postgres con JSONB para `structured_output` y `final_report`. Sin sub-tablas por agente.
**Consequences:**
- ✅ Esquema estable mientras los schemas Zod cambian.
- ✅ Una sola tabla para query histórica multi-agente.
- ❌ Queries por campo interno requieren GIN ad-hoc.
- ❌ Validación schema queda en aplicación (Zod), no en DB.

### ADR-002: Versionado de prompts con flag `is_active`
**Status:** Propuesto
**Context:** Prompts cambian con alta frecuencia. Sesiones históricas deben ser reproducibles.
**Decision:** Tabla `prompts` con `(tenant_id, agent_id, version)`. Una sola fila activa por agente vía índice parcial único. Sessions guardan `prompt_id` exacto usado.
**Consequences:**
- ✅ Reproducibilidad bit-exact de sesiones pasadas.
- ✅ Rollback de prompt = `UPDATE is_active`.
- ❌ Más complejo que sobreescribir.

### ADR-003: Dispatcher por-sesión (no singleton)
**Status:** Propuesto
**Context:** `theiaEvents` global causa cross-talk entre sesiones concurrentes.
**Decision:** Crear `SessionContext { dispatcher, sessionId, tenantId }` y pasarlo a cada nodo del grafo a través del `GraphState`.
**Consequences:**
- ✅ Habilita concurrencia segura.
- ✅ Tests pueden capturar eventos sin tocar global.
- ❌ Cada nodo recibe un parámetro más.

### ADR-004: Dependencias explícitas entre agentes
**Status:** Propuesto
**Context:** Hoy `softwareArchitect` rompe si no corrió `biz_evaluator`, pero esa dependencia no está declarada.
**Decision:** `profile_agents.requires TEXT[]`. Validar al cargar perfil (topological sort + fail-fast). LangGraph puede paralelizar agentes sin `requires` solapados.
**Consequences:**
- ✅ Falla en boot, no en runtime.
- ✅ Habilita paralelismo (e.g., brand + growth + marketing concurrentes).
- ❌ Más metadata por perfil.

### ADR-005: LangGraph PostgresSaver para checkpointing
**Status:** Propuesto
**Context:** Fallo en agente N reejecuta los N-1 anteriores (costo real con APIs pagas).
**Decision:** Usar `PostgresSaver` oficial. Reanudación via `sessionId` como thread_id.
**Consequences:**
- ✅ Resiliencia ante crashes / restarts.
- ✅ Cero código de persistencia incremental.
- ❌ Estado de LangGraph se duplica con `session_agent_outputs` (proyección consultable). Aceptable.

### ADR-006: `IProvider.generate()` devuelve `{text, usage}`
**Status:** Propuesto
**Context:** Operar LLM en producción sin métricas de tokens/costo es ciego.
**Decision:** Cambiar firma a `Promise<{text: string, usage: {tokensIn, tokensOut, latencyMs, costUsd?}}>`. Cada provider mapea según su API.
**Consequences:**
- ✅ Telemetría desde día uno.
- ❌ Breaking change interno (8 archivos).

### ADR-007: Cache in-memory con TTL para prompts/perfiles/routing
**Status:** Propuesto
**Context:** Hot path de 13 agentes × N llamadas = 13+ round-trips a DB por sesión si no hay cache.
**Decision:** Cache `Map<key, {value, expiresAt}>` con TTL 5min. Invalidación por bumpeo de versión (lectura en cada start de sesión).
**Consequences:**
- ✅ <1ms lookup en hot path.
- ❌ Cambios de prompt pueden tardar hasta 5min en propagar (aceptable).

---

## 5.bis Regla de testing (NO NEGOCIABLE)

🚫 **No se hace commit sin todos los tests en verde.**

- Cada repo/feature incluye unit tests en el MISMO commit.
- Hook `pre-commit` con Husky + lint-staged corre `pnpm test` y bloquea si falla.
- CI corre `pnpm test` en cada PR; merge bloqueado si rojo.
- Cobertura mínima: **80% líneas, 70% branches** por package.
- Repos: tests con DB efímera (Testcontainers o pg-mem para casos simples). Mocks solo para LLM providers.

---

## 6. Plan de ejecución por fases

### Fase 0 — Preparación (0.5 día)
- [ ] Decidir ORM (Drizzle, alineado con Theia v2).
- [ ] Configurar Postgres local (Docker compose) + migraciones.
- [ ] Crear `src/types.ts` con tokens DI (`TYPES.IProfileRepo`, etc.) — alineado con principles.

### Fase 1 — Capa de repositorios (1 día)
- [ ] DDL + migración inicial.
- [ ] Interfaces: `IProfileRepo`, `IPromptRepo`, `IRoutingRepo`, `ISessionRepo`, `IAgentOutputRepo`.
- [ ] Implementaciones Drizzle con `applyTenantMiddleware`.
- [ ] Seed script: lee `profiles/*.json`, `config/prompts/*.txt`, `config/agents.json` → inserta como `tenant_id = NULL`.
- [ ] Cache wrapper (`CachedProfileRepo`, etc.) con TTL 5min.
- [ ] Tests: seed + roundtrip por repo.

### Fase 2 — Dispatcher por-sesión + dependencias declarativas (1 día)
- [ ] Eliminar `theiaEvents` singleton. Crear `SessionContext` inyectado en `GraphState`.
- [ ] Refactor `setupSessionListeners` → método de `SessionContext`.
- [ ] Añadir `requires: string[]` a `profile_agents` + validación topológica al cargar perfil.
- [ ] Refactor `state.ts`: `agentOutputs: Map<string, unknown>` (resuelve P3).
- [ ] Tests: 2 sesiones concurrentes en el mismo proceso, verificar aislamiento.

### Fase 3 — Persistencia de sesiones (1 día)
- [ ] Reemplazar escritura a `.md` por `ISessionRepo.persistAgentOutput()`.
- [ ] Hook `agent:done` → INSERT en `session_agent_outputs` con `ON CONFLICT DO NOTHING` (idempotente).
- [ ] Sessions transitan estados: `pending → running → completed | failed | partial`.
- [ ] Generación de `result.md` queda como endpoint opcional de export, no como side-effect del grafo.

### Fase 4 — Métricas + retry + checkpointing (1 día)
- [ ] Cambiar `IProvider.generate()` → `{text, usage}` (ADR-006).
- [ ] Wrapper `RetryingLLM` con backoff exponencial (3 intentos, jitter).
- [ ] Integrar `PostgresSaver` de LangGraph con `thread_id = session_id`.
- [ ] Endpoint `POST /sessions/:id/resume` reanuda desde último checkpoint.

### Fase 5 — Schemas Zod estrictos + cleanup (0.5 día)
- [ ] Reemplazar `z.any()` en marketing/sales/cfo/legal/cxo/cs/competitor con sub-schemas reales.
- [ ] Mover `process.env` restantes a `main.ts` (P5).
- [ ] Eliminar `as any` en `graph.ts:71` con builder tipado (P6).

### Fase 6 — Validación end-to-end (0.5 día)
- [ ] Correr las 5 perfiles existentes contra DB; comparar outputs vs archivos de referencia.
- [ ] Stress test: 10 sesiones concurrentes en mismo tenant + 5 tenants distintos.
- [ ] Verificar resume tras matar proceso a mitad de sesión.

---

## 7. Trade-offs explícitos

| Decisión | Ganas | Pierdes |
|---|---|---|
| Postgres + JSONB | Esquema estable, queries históricas | Validación schema en DB |
| Versionado de prompts | Reproducibilidad, A/B testing | Complejidad operativa |
| Cache TTL 5min | Performance | Cambios tardan hasta 5min |
| `PostgresSaver` + tabla propia | Resiliencia + queries amigables | Duplicación parcial de estado |
| Dependencias declarativas | Fail-fast, paralelismo | Más metadata por perfil |
| Dispatcher por-sesión | Concurrencia segura | Refactor de signatures |

---

## 8. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Outputs JSONB > 1MB sostenido | Baja | Medio | Monitor p95; migrar a S3 con puntero si pasa |
| Migración de seed pierde prompts en vivo | Media | Alto | Seed idempotente; backup `config/` a Git tag pre-migración |
| `PostgresSaver` no soporta nuestra versión LangGraph | Media | Alto | Spike de 2h antes de Fase 4; fallback: persistencia propia |
| Cache stale en perfiles | Baja | Bajo | Invalidación manual via endpoint admin |
| Schemas estrictos rompen runs con llama3.2 | Alta | Medio | Mantener `flexString`/`flexStringArray`; estrictez solo en sub-objetos hoy `z.any()` |

---

## 9. Criterios de aceptación

1. ✅ `npm start "problema" it` produce resultados idénticos (semánticamente) que la versión disco.
2. ✅ Cero accesos a `config/` o `profiles/` en runtime (solo en seed).
3. ✅ Cero escrituras a `sessions/` en runtime (solo si se invoca export explícito).
4. ✅ 10 sesiones concurrentes no se mezclan en DB.
5. ✅ Matar proceso a mitad de sesión + restart + resume → completa sin reejecutar agentes ya persistidos.
6. ✅ Cada `session_agent_outputs` tiene `tokens_in`, `tokens_out`, `latency_ms`, `cost_usd` (cuando el provider los expone).
7. ✅ Cambiar un prompt vía DB (no archivo) afecta la siguiente sesión dentro de 5min.
8. ✅ Cargar un perfil con dependencias rotas falla al boot, no en runtime.

---

## 10. Lo que NO está en alcance

- ❌ UI web / API HTTP (siguiente iteración).
- ❌ Auth/SSO multi-tenant (asumimos `tenantId` viene resuelto).
- ❌ Streaming de outputs LLM (sigue siendo `stream: false`).
- ❌ Cambio de orquestador (LangGraph se mantiene).
- ❌ Migrar lógica de agentes (los prompts siguen siendo los mismos).

---

## PROMPT DE VERIFICACIÓN (anti-loop)

> Eres un **auditor escéptico senior** revisando este plan de migración antes de aprobar su ejecución. Tu trabajo NO es validar que el plan suena bien — es encontrar dónde se romperá en la práctica. Audita con dureza, pero respeta el trabajo previo: no propongas reescrituras totales si una corrección puntual basta.
>
> **Verifica con evidencia del código real (cita archivo:línea):**
>
> 1. **`theiaEvents` singleton (P1):** ¿Hay OTRAS rutas de side-effect global que el plan omite? Busca `EventEmitter`, `process.on`, `global.`, `globalThis.` en `src/`. Lista cada hallazgo o confirma que no existe.
> 2. **Dependencias entre agentes (P2):** Recorre los 13 nodos en `src/agents/*.ts` y lista CADA `state.XxxOutput` leído. ¿El plan captura todas las dependencias o solo `biz_evaluator`? Si hay más, el modelo `requires: string[]` debe contemplarlas.
> 3. **Schemas `z.any()` (P4):** ¿Es realista definir sub-schemas en 0.5 día (Fase 5) sin romper sesiones existentes con llama3.2? Estima el tamaño real (cuenta los `z.any()` por agente en `src/types.ts`).
> 4. **`PostgresSaver` (ADR-005):** ¿La versión `@langchain/langgraph: ^0.2.34` declarada en `package.json` realmente expone `PostgresSaver`? Si no, ¿el fallback "persistencia propia" añade cuántos días al plan?
> 5. **Cache TTL 5min (ADR-007):** ¿Qué pasa en un deploy multi-instancia (2+ procesos)? El TTL local no se sincroniza entre instancias. ¿El plan necesita pub/sub (Redis) o aceptamos drift hasta 5min entre instancias?
> 6. **`UNIQUE (session_id, agent_id)`:** Si un agente reintenta y persiste 2 versiones (failed + completed), `ON CONFLICT DO NOTHING` mantiene la PRIMERA (failed). ¿Es correcto o debería ser `DO UPDATE` cuando el nuevo status es mejor?
> 7. **Idempotencia del seed:** Si `config/prompts/auth.txt` cambia entre dos corridas del seed, ¿se crea version 2 o se sobreescribe? El plan no lo especifica.
> 8. **Multi-tenant en POC:** El POC actual NO tiene concepto de tenant. ¿Justifica el costo añadirlo ahora o se puede diferir? Si se difiere, ¿qué del plan se simplifica?
> 9. **Tamaño JSONB:** Lee `tests/` o `sessions/` (si hay archivos) y mide tamaño real de un output estructurado. ¿La estimación "5–200 KB" es realista o especulativa?
> 10. **Cobertura de tests:** El plan dice "Tests" en cada fase pero no especifica framework. ¿Existe ya Vitest/Jest configurado? Verifica `package.json` y `tests/`.
>
> **Entrega:** lista numerada de hallazgos. Para cada uno:
> - **Severidad:** 🔴 bloqueante / 🟡 ajuste / 🟢 nota.
> - **Evidencia:** cita `archivo:línea` o resultado de grep.
> - **Acción concreta** (un cambio puntual al plan, no "rediseñar todo").
>
> Si no encuentras nada en un punto, di "verificado, sin hallazgos" — no inventes.

### Cómo romper el loop en la práctica

Si tras 2 iteraciones del auditor sigues recibiendo hallazgos en los MISMOS puntos:

1. **Para hallazgos repetidos del mismo punto:** marca ese punto como `RESUELTO POR DECISIÓN: <texto breve>` en este plan y NO lo vuelvas a abrir. La duda permanente se documenta como ADR de seguimiento, no como bloqueo.

2. **Si el auditor pide "más datos" indefinidamente:** corta — ejecuta un spike de máximo 4 horas para responder con código real (no con más análisis). Documenta el resultado del spike en este plan como `## Anexo: Spike <fecha>`.

3. **Si aparecen hallazgos NUEVOS en cada iteración:** detén la planificación, empieza la Fase 0 con lo que tienes. Los hallazgos restantes se vuelven tickets en `todos` (SQLite de sesión) y se atacan durante implementación, no antes.

4. **Cuándo declarar el plan "good enough":**
   - Las 6 fases tienen criterios de aceptación verificables ✓
   - Los 9 problemas estructurales tienen fix asignado o decisión documentada ✓
   - No hay riesgo 🔴 sin mitigación ✓
   → **Aprobar y ejecutar.** Lo demás se aprende construyendo.

5. **Regla dura:** este plan no debe re-escribirse más de 3 veces. Si llegas a la 4ª revisión, el problema NO es el plan — es indecisión. Convoca decisión humana y cierra.
