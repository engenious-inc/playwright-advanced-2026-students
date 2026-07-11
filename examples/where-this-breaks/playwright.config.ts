import { defineConfig } from '@playwright/test';

/** Isolated config for intentional failure-mode demos — not part of `npm test`. */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  reporter: 'list',
});
