import type { Config } from 'drizzle-kit';

const config: Config = {
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgres://theia:theia_dev_pass@localhost:5432/theia_dev',
  },
};

export default config;
