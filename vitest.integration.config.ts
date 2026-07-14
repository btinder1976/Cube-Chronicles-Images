import { defineConfig } from 'vitest/config';

// Integration tests hit a real local D1 via wrangler's platform proxy.
// Run migrations first: npm run db:migrate:local
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
