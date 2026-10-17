import { expect, type Page } from './test';

// The logo loader runs at least one 3 s cycle before the intro shows.
const LOADER_TIMEOUT_MS = 15_000;

/** Intro → "Get started" → pick a source tile (by its title) → Continue. */
export const startOnboarding = async (page: Page, source: string | RegExp) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click({ timeout: LOADER_TIMEOUT_MS });
  let name = source;
  if (typeof source === 'string') name = new RegExp(`^${source}`);
  await page.getByRole('radio', { name }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
};

/** "You and your heart rate" with Male, 50 / 185 bpm, then skips the optional FTP screen. */
export const fillOnboardingProfile = async (page: Page) => {
  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByLabel(/^Resting HR/).fill('50');
  await page.getByLabel(/^Max HR/).fill('185');
  const next = page.getByRole('button', { name: 'Continue', exact: true });
  await next.click();
  await expect(page.getByLabel(/^FTP/)).toBeVisible();
  await next.click();
};
