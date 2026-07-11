export interface TestFailure {
  test_path: string;
  line: number;
  timestamp: string;
  message: string;
  attempt: number;
}

export interface FlakeRecord {
  test_path: string;
  runs: number;
  flakes: number;
  flake_rate: number;
}

export interface DeployRecord {
  timestamp: string;
  commit: string;
  services: string[];
  author: string;
}

export interface AriaSnapshot {
  id: string;
  captured_at: string;
  url: string;
  tree: string;
}

const now = Date.now();
const hoursAgo = (h: number): string => new Date(now - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number): string => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

export const fixtureFailures: TestFailure[] = [
  {
    test_path: 'tests/auth/login.spec.ts',
    line: 32,
    timestamp: hoursAgo(2),
    message: 'Timed out waiting for getByRole("button", { name: "Sign in" })',
    attempt: 2,
  },
  {
    test_path: 'tests/checkout/checkout.spec.ts',
    line: 18,
    timestamp: hoursAgo(5),
    message: 'expect(received).toBe(expected): received "Order #1234", expected "Order #1233"',
    attempt: 1,
  },
  {
    test_path: 'tests/browse/category.spec.ts',
    line: 47,
    timestamp: hoursAgo(20),
    message: 'Locator not found: data-testid="hero-carousel"',
    attempt: 3,
  },
];

export const fixtureFlakes: FlakeRecord[] = [
  { test_path: 'tests/auth/login.spec.ts', runs: 50, flakes: 9, flake_rate: 0.18 },
  { test_path: 'tests/auth/logout.spec.ts', runs: 50, flakes: 1, flake_rate: 0.02 },
  { test_path: 'tests/checkout/checkout.spec.ts', runs: 50, flakes: 5, flake_rate: 0.1 },
  { test_path: 'tests/browse/category.spec.ts', runs: 50, flakes: 0, flake_rate: 0 },
];

export const fixtureDeploys: DeployRecord[] = [
  {
    timestamp: daysAgo(5),
    commit: 'abc123def456',
    services: ['auth', 'session'],
    author: 'platform-bot',
  },
  {
    timestamp: daysAgo(2),
    commit: '789xyz012345',
    services: ['checkout'],
    author: 'platform-bot',
  },
  {
    timestamp: hoursAgo(8),
    commit: 'fed987cba654',
    services: ['catalog', 'browse'],
    author: 'platform-bot',
  },
];

export const fixtureSnapshots: Record<string, AriaSnapshot> = {
  'home-baseline': {
    id: 'home-baseline',
    captured_at: daysAgo(6),
    url: 'https://tubitv.com/',
    tree: '- banner\n  - link "Tubi home"\n  - navigation\n    - menubar\n      - menuitem "Movies"\n      - menuitem "TV Shows"',
  },
  'home-candidate': {
    id: 'home-candidate',
    captured_at: hoursAgo(1),
    url: 'https://tubitv.com/',
    tree: '- banner\n  - link "Tubi home"\n  - navigation\n    - menubar\n      - menuitem "Movies"\n      - menuitem "TV Shows"\n      - menuitem "Live"',
  },
};
