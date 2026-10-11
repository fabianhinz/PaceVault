import { expect, type Page } from '@playwright/test';

export const dockFilterButton = (page: Page) =>
  page
    .locator('[data-layout="dock"]')
    .getByRole('button', { name: /^filter$/i })
    .last();

export const filterList = (page: Page) => page.getByRole('group', { name: /choose filter/i });

export const openFilterList = async (page: Page) => {
  await dockFilterButton(page).click();
  await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'true');
};

export const closeFilterList = async (page: Page) => {
  await page.keyboard.press('Escape');
  await expect(dockFilterButton(page)).toHaveAttribute('aria-expanded', 'false');
};

export const applyFilter = async (page: Page, name: string) => {
  await openFilterList(page);
  await filterList(page).getByRole('button', { name, exact: true }).click();
  await closeFilterList(page);
};

/** Walks the filter input through every feedback state and checks the input never moves. */
export const expectFilterInputStaysPut = async (page: Page, nameWord: string) => {
  const input = page.getByLabel(/describe a filter/i);
  const tiles = page.getByTestId('filter-builder-tiles');
  const feedback = page.getByTestId('filter-feedback');
  await expect(input).toBeVisible();
  await page.waitForTimeout(400);
  const start = await input.boundingBox();
  if (!start) {
    throw new Error('filter input missing');
  }
  const expectInPlace = async () => {
    const box = await input.boundingBox();
    expect(box?.y ?? Number.NaN).toBeCloseTo(start.y, 0);
    expect(box?.height ?? Number.NaN).toBeCloseTo(start.height, 0);
  };

  await input.fill('run');
  await expect(tiles.getByRole('button').first()).toBeVisible();
  await expectInPlace();

  await input.fill('runing');
  await expect(feedback).toContainText('Did you mean running?');
  await expectInPlace();
  await feedback.getByRole('button', { name: 'running', exact: true }).click();
  await expect(input).toHaveValue('running');
  await expect(input).toBeFocused();
  await expect(feedback).toHaveCount(0);
  await expectInPlace();

  await input.fill('xyzzy');
  await expect(feedback).toContainText('Not understood: xyzzy');
  await expect(tiles).toContainText('Not understood');
  await expectInPlace();

  await input.fill('ride 5 km');
  await expect(tiles).toContainText('No sessions match');
  await expect(feedback).toHaveCount(0);
  await expectInPlace();

  await input.fill(nameWord);
  await expect(tiles.getByRole('button', { name: `Apply filter: “${nameWord}”` })).toBeVisible();
  await expectInPlace();

  await input.fill('');
  await expectInPlace();
};
