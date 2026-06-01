# Dev-mode container — mirrors local `pnpm --filter @theia/backend dev`
# Uses tsx so @theia/engine .ts exports resolve correctly (no separate engine build needed)
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Package manifests (so pnpm can link workspace deps)
COPY packages/engine/package.json ./packages/engine/
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

# Copy full source (engine needed by tsconfig paths)
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

EXPOSE 3000

ENV NODE_ENV=development

CMD ["pnpm", "--filter", "@theia/backend", "dev"]

