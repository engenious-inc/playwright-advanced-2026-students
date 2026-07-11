# Tubi brag demo — Test Plan

> **Pre-staged planner output.** This is the kind of Markdown plan the Playwright **Test Agents planner** produces from a goal (see M07 / M08). It's committed so `npm run brag` — the first-clone wow moment — has something real to run without a live agent session. M07 teaches you how to generate a plan like this yourself.

## Goal

A fast, reliable smoke of Tubi's home page and top-level browse, suitable as the very first thing a new student runs after cloning.

## Scenario 1: Home page loads with branding and navigation

**Given** the user opens Tubi
**When** the home page finishes loading
**Then** the page title identifies Tubi, the brand logo is visible, and the category navigation is visible

## Scenario 2: Browse to Movies via the menubar

**Given** the user is on the Tubi home page
**When** they activate the "Movies" menubar item
**Then** the URL moves to the Movies route

## Notes for the generator

- Import `test` / `expect` from `shared/fixtures/index.ts`; use the `tubiHome` fixture and the `TubiHomePage` adapter — no inline selectors (per `AGENTS.md`).
- Assert only on stable elements (title, logo, nav, route) — **not** lazy-loaded tile counts — so the demo is reliably green on a first run.
