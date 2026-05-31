# Backend E2E Curl Commands

> Reference for manual testing and future automated e2e tests.
> All commands assume backend on `http://localhost:3000` and Postgres via `podman-compose up -d`.

## Setup

```bash
# Start Postgres
podman-compose up -d

# Push schema (first time or after schema changes)
pnpm --filter @theia/backend exec drizzle-kit push

# Seed data from disk config
DATABASE_URL=postgresql://theia:theia_dev_pass@localhost:5432/theia_dev \
  pnpm --filter @theia/backend seed

# Start backend
DATABASE_URL=postgresql://theia:theia_dev_pass@localhost:5432/theia_dev \
  pnpm --filter @theia/backend dev
```

## Global tenant ID

```bash
# Get the global tenant ID (seeded automatically)
podman exec theia_postgres psql -U theia -d theia_dev -tAc "SELECT id FROM tenants WHERE slug='global'"
# → ead3c900-58bc-4036-940f-cea3c79e86d4  (may differ per environment)
```

Export it for subsequent calls:
```bash
export TENANT_ID=ead3c900-58bc-4036-940f-cea3c79e86d4
```

---

## Health

```bash
curl http://localhost:3000/health
# → {"status":"ok","version":"1.0.0","timestamp":"..."}
```

---

## Profiles

### List all profiles for tenant
```bash
curl -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/profiles
# → [{id, tenantId, name, description, agentCount}, ...]
```

### Get profile by ID
```bash
PROFILE_ID=2a33dbce-405b-4071-a637-6038cbce1e5a  # Tecnología / Software
curl -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/profiles/$PROFILE_ID
```

---

## Prompts

### Get active prompt for an agent (tenant cascade: tenant → global fallback)
```bash
curl -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/prompts/agents/biz_evaluator
# → {id, agentName, version, content}
```

Available agent names (from seed):
- `biz_evaluator`, `brand_guardian`, `cfo_finance`, `competitor_analyst`
- `customer_success`, `cxo_designer`, `growth_hacker`, `legal_expert`
- `marketing_strategist`, `product_manager`, `sales_lead`, `software_architect`
- `synthesizer`

---

## Sessions

### Create session (returns immediately with status=pending)
```bash
PROFILE_ID=2a33dbce-405b-4071-a637-6038cbce1e5a
curl -s -X POST \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"profileId":"'"$PROFILE_ID"'","problem":"Evaluate B2B SaaS market for Theia Platform in Spain and LATAM"}' \
  http://localhost:3000/sessions
# → {id, tenantId, profileId, problem, status:"pending", createdAt}
```

### Get session by ID
```bash
SESSION_ID=01e0f45f-de91-463c-bb50-e3beddd8bf3f
curl -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/sessions/$SESSION_ID
```

### List sessions for tenant
```bash
curl -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/sessions
```

---

## Agents (SSE)

### Run agents for a session (Server-Sent Events stream)
```bash
SESSION_ID=<from POST /sessions>
curl -N -H "X-Tenant-Id: $TENANT_ID" \
  http://localhost:3000/agents/sessions/$SESSION_ID/progress
# → SSE stream: event: progress / data: {agentId, status, ...}
```

### Trigger full agent run
```bash
curl -s -X POST \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"'"$SESSION_ID"'"}' \
  http://localhost:3000/agents/run
```

---

## Swagger UI

```
http://localhost:3000/docs
```

---

## PowerShell variants (Windows)

```powershell
$TENANT_ID = "ead3c900-58bc-4036-940f-cea3c79e86d4"

# Health
curl -s http://localhost:3000/health | ConvertFrom-Json

# Profiles
curl -s -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/profiles | ConvertFrom-Json

# Prompt
curl -s -H "X-Tenant-Id: $TENANT_ID" http://localhost:3000/prompts/agents/biz_evaluator | ConvertFrom-Json

# Create session
$body = @{ profileId = "2a33dbce-405b-4071-a637-6038cbce1e5a"; problem = "Evaluate B2B SaaS market" } | ConvertTo-Json
curl -s -X POST -H "X-Tenant-Id: $TENANT_ID" -H "Content-Type: application/json" -d $body http://localhost:3000/sessions | ConvertFrom-Json
```
