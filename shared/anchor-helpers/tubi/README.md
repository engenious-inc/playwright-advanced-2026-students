# Tubi adapter

The primary + video anchor for the course. Tubi (`tubitv.com`) is FOX-owned, free, ad-supported streaming, no auth required for browsing.

## Why Tubi

- Real streaming service — modern React SPA, real HLS playback, ad insertion, real-world UI complexity
- FOX-cleared for course use
- No auth required for the modules that don't need it (M03–M09, M11, M12, M13)
- Greg's domain expertise (FOX Video Engineering QA)

## Constraints students should know

- **Geographic restrictions** — Tubi is primarily US-available. Students outside the US may need to use the secondary anchor (Juice Shop) for modules that depend on Tubi access.
- **UI volatility** — Tubi is a production streaming service. Selectors change without notice. **All Tubi interactions go through this adapter**; when Tubi changes, the adapter changes here only.
- **No documented public API** — Tubi's API is internal. Modules that need contract testing (M06) use Juice Shop instead.
- **Ad insertion in playback** — M12 tests use video-player state introspection (`HTMLMediaElement.currentTime`, `paused`, `duration`) rather than full-playback runs. We don't watch full ad slots.

## Adapter contract

Exports:

- `TubiHomePage` — home page object (browse, search, category nav)
- `TubiPlayerPage` — video player surface (M11/M12 only)
- `TubiSearchPage` — search results surface
- `TubiEndpoints` — base URL config (override with `TUBI_BASE_URL` env var)
- `TubiFixtures` — known stable category slugs and sample queries

## Maintenance protocol

When Tubi redesigns and tests start failing:

1. Identify which adapter methods broke (Playwright trace will show the specific locator failures)
2. Update the locators in this directory only — do not touch module test files
3. Run `npm test -- --grep="tubi-adapter"` to verify the adapter's own integration tests pass
4. Cross-reference any modules that may have called the broken methods and re-run them to confirm no behavioral regressions
