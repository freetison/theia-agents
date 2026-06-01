import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'src/**/__tests__/**/*.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@theia/engine': resolve(__dirname, '../../packages/engine/src/index.ts'),
    },
  },
});
