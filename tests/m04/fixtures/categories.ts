/**
 * M04's mocked categories-endpoint payloads. Extends the same naming style as the 5 real slugs
 * in TubiFixtures.categories (shared/anchor-helpers/tubi/endpoints.ts) with 5 more, so the fixture
 * reads as real Tubi category data rather than invented placeholder names.
 */
export type Category = { id: number; name: string; slug: string };

/** The category tests assert on by name — kept as a named export (not TEN_CATEGORIES[0]) so
 * consumers never need an indexed-access assertion under noUncheckedIndexedAccess. */
export const RECOMMENDED_FOR_YOU: Category = {
  id: 1,
  name: 'Recommended For You',
  slug: 'recommended_for_you',
};

export const TEN_CATEGORIES: Category[] = [
  RECOMMENDED_FOR_YOU,
  { id: 2, name: 'Movie Night', slug: 'movie_night' },
  { id: 3, name: 'Leaving Soon', slug: 'leaving_soon' },
  { id: 4, name: 'Creators', slug: 'creators' },
  { id: 5, name: 'Recommended TV', slug: 'recommended_tv' },
  { id: 6, name: 'Trending Now', slug: 'trending_now' },
  { id: 7, name: 'Action Movies', slug: 'action_movies' },
  { id: 8, name: 'Comedies', slug: 'comedies' },
  { id: 9, name: 'Documentaries', slug: 'documentaries' },
  { id: 10, name: 'Free Live TV', slug: 'free_live_tv' },
];

/**
 * The 4.C "mocks lie" contrast: an additive, believable production diff (one category added,
 * nothing removed or renamed) — not an invented break. Any assertion checking only for the
 * presence of a category from TEN_CATEGORIES still passes against this; only a count-based
 * assertion catches the drift.
 */
export const ELEVEN_CATEGORIES_DRIFTED: Category[] = [
  ...TEN_CATEGORIES,
  { id: 11, name: 'New This Week', slug: 'new_this_week' },
];

export type PersonalizationItem = { name: string };

/**
 * 4.D's pinned personalization response — the ONE endpoint the partial-mock test overrides.
 * Three items, not four: the shell picks poster art by index, and a fourth would wrap around to
 * the same poster the first category row already shows. The resulting gap in the 4-column grid
 * also reads, on camera, as "this row is different".
 */
export const PERSONALIZED_STRIP: { items: PersonalizationItem[] } = {
  items: [
    { name: 'Because you watched Rango' },
    { name: 'Picked for you' },
    { name: 'Jump back in' },
  ],
};

/**
 * 4.E's per-test override — the handler registered AFTER the baseline. Three, not ten, and named
 * nothing like TEN_CATEGORIES, so which handler answered is readable from the first row heading
 * at the top of frame (the only row that fully fits at 1080p).
 */
export const THREE_CATEGORIES_OVERRIDE: Category[] = [
  { id: 12, name: 'Tonight Only', slug: 'tonight_only' },
  { id: 13, name: 'Hidden Gems', slug: 'hidden_gems' },
  { id: 14, name: 'Cult Classics', slug: 'cult_classics' },
];
