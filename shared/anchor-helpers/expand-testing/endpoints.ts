/**
 * Expand Testing — edge-case detour anchor (M03 iframes, M15 auth variants).
 * Public practice site; no credentials required for browse-only flows.
 */
export const ExpandTestingEndpoints = {
  baseUrl: process.env.EXPAND_TESTING_BASE_URL ?? 'https://practice.expandtesting.com',
  paths: {
    login: '/login',
    webauthn: '/webauthn',
    dynamicId: '/dynamicid',
    iframe: '/iframe',
  },
} as const;
