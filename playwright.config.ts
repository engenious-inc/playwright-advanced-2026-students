import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

/** Paths relative to testDir; root testIgnore alone does not filter all projects. */
const ciSkipPatterns = isCI ? ['m07/**', 'm08/**', 'brag/**', 'seed.spec.ts'] : [];
/** Recording-only specs: minutes of deliberate padTo/beat pacing, no assertions worth gating on.
 *  Run them explicitly with --config=playwright.capture-fullframe.config.ts when capturing. */
const CAPTURE_SPECS = '**/*.capture.spec.ts';

export default defineConfig({
  testDir: './tests',
  // CI gates on the controlled Juice Shop anchor + the static checks (typecheck /
  // lint / format). The live-Tubi specs target a real production site that
  // throttles and varies its markup by browser + datacenter IP (the module's own
  // "where this breaks" lesson) — so they are not a deterministic CI signal. They
  // run locally and headed for recording; in CI we skip the Tubi-only spec files.
  // (smoke.spec.ts is mixed Tubi + Juice Shop, so its Tubi test self-skips on CI.)
  testIgnore: [CAPTURE_SPECS, ...ciSkipPatterns],
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
      // Only specs that actually drive the Juice Shop anchor route here. M16's sharding-demo is
      // pure logic and runs under chromium.
      //
      // m16/messy-suite joined this list as the final move of the 16.G capstone refactor. At
      // `m16-messy-start` it was testIgnore'd everywhere — a catalogue of anti-patterns whose
      // hard waits would have made CI slow and flaky for no benefit. Once refactored it drives
      // the real anchor and deserves to gate the build like any other suite. Earning a place in
      // CI is the outcome the capstone is graded on; this line is where that shows up.
      testMatch: [
        /m06\/.*\.spec\.ts/,
        /m14\/.*\.spec\.ts/,
        /m15\/storage-state\.spec\.ts/,
        /m16\/messy-suite\/.*\.spec\.ts/,
      ],
      testIgnore: [CAPTURE_SPECS, ...ciSkipPatterns],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.JUICE_SHOP_BASE_URL ?? 'http://localhost:3000',
      },
    },
    {
      name: 'chromium',
      testIgnore: [
        CAPTURE_SPECS,
        '**/m06/**',
        '**/m14/**',
        '**/m15/storage-state.spec.ts',
        // m16/messy-suite now runs in the `juice-shop` project (it needs Docker + auth setup),
        // so it is excluded here the same way m06/m14 are — not because it is broken.
        '**/m16/messy-suite/**',
        ...ciSkipPatterns,
      ],
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      testIgnore: [
        CAPTURE_SPECS,
        '**/m06/**',
        '**/m14/**',
        '**/m15/**',
        '**/m16/**',
        ...ciSkipPatterns,
      ],
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      testIgnore: [
        CAPTURE_SPECS,
        '**/m06/**',
        '**/m14/**',
        '**/m15/**',
        '**/m16/**',
        ...ciSkipPatterns,
      ],
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      testIgnore: [
        CAPTURE_SPECS,
        '**/m06/**',
        '**/m14/**',
        '**/m15/**',
        '**/m16/**',
        ...ciSkipPatterns,
      ],
      use: { ...devices['Pixel 7'] },
      dependencies: ['setup'],
      // Tubi's desktop menubar specs assume a wide viewport — they fail on Pixel 7.
      grepInvert: /@desktop-menubar|@desktop-nav/,
    },
  ],
});
