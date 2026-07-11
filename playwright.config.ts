import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

/** Paths relative to testDir; root testIgnore alone does not filter all projects. */
const ciSkipPatterns = isCI ? ['m07/**', 'm08/**', 'brag/**', 'seed.spec.ts'] : [];

export default defineConfig({
  testDir: './tests',
  // CI gates on the controlled Juice Shop anchor + the static checks (typecheck /
  // lint / format). The live-Tubi specs target a real production site that
  // throttles and varies its markup by browser + datacenter IP (the module's own
  // "where this breaks" lesson) — so they are not a deterministic CI signal. They
  // run locally and headed for recording; in CI we skip the Tubi-only spec files.
  // (smoke.spec.ts is mixed Tubi + Juice Shop, so its Tubi test self-skips on CI.)
  testIgnore: ciSkipPatterns,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ...(isCI ? [['github'] as const] : []),
    ['./shared/reporters/AiDegradedReporter.ts'],
  ],
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Some production sites (Tubi included) serve a stripped layout when the User-Agent
    // contains "HeadlessChrome". Override with a stable modern Chrome UA so tests see
    // what real users see. Anchor-specific overrides can layer on top of this default.
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  },
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled',
    },
  },
  projects: [
    {
      // Auth/storage-state setup project (`tests/auth.setup.ts` — M15).
      name: 'setup',
      testMatch: /.*\.setup\.ts$/,
    },
    {
      name: 'juice-shop',
      // Only specs that actually drive the Juice Shop anchor route here. M16's live spec
      // (sharding-demo) is pure logic and runs under chromium; the messy-suite is a
      // deliberately-broken teaching catalogue that is testIgnore'd everywhere — so no
      // m16 spec belongs behind Docker + auth setup.
      testMatch: [/m06\/.*\.spec\.ts/, /m14\/.*\.spec\.ts/, /m15\/storage-state\.spec\.ts/],
      testIgnore: [...ciSkipPatterns],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.JUICE_SHOP_BASE_URL ?? 'http://localhost:3000',
      },
    },
    {
      name: 'chromium',
      testIgnore: [
        '**/m06/**',
        '**/m14/**',
        '**/m15/storage-state.spec.ts',
        '**/m16/messy-suite/**',
        ...ciSkipPatterns,
      ],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testIgnore: ['**/m06/**', '**/m14/**', '**/m15/**', '**/m16/**', ...ciSkipPatterns],
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testIgnore: ['**/m06/**', '**/m14/**', '**/m15/**', '**/m16/**', ...ciSkipPatterns],
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      testIgnore: ['**/m06/**', '**/m14/**', '**/m15/**', '**/m16/**', ...ciSkipPatterns],
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
      // Tubi's desktop menubar specs assume a wide viewport — they fail on Pixel 7.
      grepInvert: /@desktop-menubar|@desktop-nav/,
    },
  ],
});
