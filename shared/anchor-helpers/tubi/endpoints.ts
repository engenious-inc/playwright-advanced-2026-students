/**
 * Tubi endpoints. Centralized so an environment swap (staging URL, mirror, etc.)
 * is a single-file change.
 */
export const TubiEndpoints = {
  baseUrl: process.env.TUBI_BASE_URL ?? 'https://tubitv.com',
  // Tubi's API is internal — modules needing a documented public API use Juice Shop instead.
} as const;

/**
 * Known content slugs surfaced during 2026-05-27 reconnaissance.
 * If Tubi rotates these out, update here; tests reference them by name so swaps
 * to other slugs (e.g., picking a stable evergreen category) are a one-line change.
 */
export const TubiFixtures = {
  categories: {
    recommended: 'recommended_for_you',
    movieNight: 'movie_night',
    leavingSoon: 'leaving_soon',
    creators: 'creators',
    recommendedTv: 'recommended_tv',
  },
  sampleSearchQueries: ['action', 'comedy', 'documentary'] as const,
  /** Stable VOD path for M12 playback demos — update when Tubi rotates titles. */
  stableVod: '/movies/339881/state-property',
  expectedPageTitlePattern: /Watch Free Movies and TV Shows Online \| Tubi/i,
} as const;
