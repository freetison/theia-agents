import { defineConfig } from '@playwright/test';

// E2E tests require the Vite dev server running at http://localhost:5173.
// They are NOT included in the pre-commit hook (too slow).
// Run manually: npx playwright test --config playwright.config.ts

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
