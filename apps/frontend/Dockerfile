# Dev-mode container — mirrors local `pnpm --filter @theia/frontend dev`
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

COPY apps/frontend/ ./apps/frontend/

EXPOSE 5173

ENV NODE_ENV=development

# --host 0.0.0.0 makes Vite reachable from outside the container
CMD ["pnpm", "--filter", "@theia/frontend", "exec", "vite", "--host", "0.0.0.0"]
