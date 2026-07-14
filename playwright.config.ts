import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run against a locally-served production build backed by local D1.
 * Prereqs: `npm run build` and `npm run db:migrate:local && npm run db:seed:local`.
 * The webServer below boots `wrangler pages dev` on the built output.
 */
const PORT = 8788;
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the sandbox's preinstalled Chromium if present (CI/sandbox);
        // otherwise Playwright uses its managed browser.
        ...(process.env.PW_CHROME_PATH ? { launchOptions: { executablePath: process.env.PW_CHROME_PATH } } : {}),
      },
    },
  ],
  webServer: {
    command: `npx wrangler pages dev ./dist --port ${PORT} --ip 127.0.0.1`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 60_000,
    env: { WRANGLER_SEND_METRICS: 'false', CI: '1' },
  },
});
