import { test, expect } from '@playwright/test';

/**
 * 3.E failure mode 1 — "Role names collide."
 *
 * Two buttons both labelled "Submit" on the same page. `getByRole('button', { name: 'Submit' })`
 * matches both, and Playwright refuses to guess: it throws a strict-mode violation rather than
 * silently acting on the first match. That refusal is the feature — a framework that picked one
 * would give you a test that passes today and clicks the wrong control after the next redesign.
 *
 * Production shape: any page with a repeated control. A feedback form and a newsletter form in
 * the same footer. Two modals. A list where every row has its own "Remove" button.
 */

// Two independent forms, each with its own Submit. Realistic, completely ordinary markup.
// `onsubmit="return false"` only stops the demo page from navigating away on click and wiping
// itself — the buttons stay genuine type="submit" controls so the roles are what a real page has.
const PAGE = `
  <form aria-label="Feedback" onsubmit="return false">
    <label>Comment <input name="comment" /></label>
    <button type="submit">Submit</button>
  </form>
  <form aria-label="Newsletter" onsubmit="return false">
    <label>Email <input name="email" /></label>
    <button type="submit">Submit</button>
  </form>
`;

test('THE FAILURE — an unscoped role+name matches both forms and throws', async ({ page }) => {
  await page.setContent(PAGE);

  // Anti-pattern: the locator reads unambiguously in English but is ambiguous in the DOM.
  // This is where the strict-mode violation surfaces — on the action, not on construction.
  await page.getByRole('button', { name: 'Submit' }).click();
});

test('THE FIX A — scope through the parent form', async ({ page }) => {
  await page.setContent(PAGE);

  // The accessible name of the FORM disambiguates. This is the preferred fix: it says what the
  // test means ("the Submit inside Feedback") instead of relying on document order.
  const feedback = page.getByRole('form', { name: 'Feedback' });
  await feedback.getByRole('button', { name: 'Submit' }).click();

  await expect(feedback.getByRole('button', { name: 'Submit' })).toHaveCount(1);
});

test('THE FIX B — filter by a sibling the locator can see', async ({ page }) => {
  await page.setContent(PAGE);

  // Use when there is no useful parent to scope through: narrow by something the target sits
  // beside. Still semantic — no CSS chain, so a restructure that keeps the semantics survives.
  const newsletter = page
    .getByRole('form')
    .filter({ has: page.getByRole('textbox', { name: 'Email' }) });
  await newsletter.getByRole('button', { name: 'Submit' }).click();

  await expect(newsletter.getByRole('button', { name: 'Submit' })).toHaveCount(1);
});
