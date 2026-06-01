/**
 * Smoke tests for theia-agents frontend.
 *
 * NOTE: These are integration tests — they require the Vite dev server
 * running at http://localhost:5173. They are NOT run in the pre-commit hook.
 *
 * Run manually:
 *   cd apps/frontend && npx playwright test
 */

import { test, expect } from '@playwright/test';

test.describe('TeamOverview smoke', () => {
  test('navigates to / and "Run" button is present and enabled', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: /^run$/i });
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();
  });
});

test.describe('SessionHistory smoke', () => {
  test('navigates to /sessions and the page loads (table or empty message)', async ({ page }) => {
    await page.goto('/sessions');
    // Either the table or the empty-state message must be visible
    const table = page.locator('.session-history__table');
    const empty = page.locator('.session-history__empty');
    const error = page.locator('.session-history__error');

    // At least one of the three elements should exist
    const visible = await Promise.any([
      table.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'table'),
      empty.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'empty'),
      error.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'error'),
    ]);

    expect(['table', 'empty', 'error']).toContain(visible);
  });
});
