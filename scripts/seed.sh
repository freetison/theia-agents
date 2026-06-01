#!/bin/sh
# Seed script — run once after first `docker compose up`
# Usage: docker compose exec backend sh scripts/seed.sh

echo "Running database seed..."
DATABASE_URL="postgres://theia:theia_dev_pass@postgres:5432/theia_dev" \
  pnpm --filter @theia/backend seed
echo "Seed complete."
