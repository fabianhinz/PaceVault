import { expect, type Locator, type Page } from '@playwright/test';

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

const settledBox = async (locator: Locator) => {
  let last: Awaited<ReturnType<Locator['boundingBox']>> = null;
  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      const settled =
        box !== null && last !== null && box.y === last.y && box.height === last.height;
      last = box;
      return settled;
    })
    .toBe(true);
  if (last === null) {
    throw new Error('element missing');
  }
  return last;
};

export const expectFilterInputStaysPut = async (page: Page, nameWord: string) => {
  const input = page.getByLabel(/describe a filter/i);
  const list = filterList(page);
  const tiles = page.getByTestId('filter-builder-tiles');
  const notUnderstood = tiles.getByText('Not understood', { exact: true });
  await expect(input).toBeVisible();
  const inputStart = await settledBox(input);
  const listStart = await settledBox(list);
  const expectInPlace = async () => {
    const inputBox = await input.boundingBox();
    expect(inputBox?.y ?? Number.NaN).toBeCloseTo(inputStart.y, 0);
    expect(inputBox?.height ?? Number.NaN).toBeCloseTo(inputStart.height, 0);
    const listBox = await list.boundingBox();
    expect(listBox?.y ?? Number.NaN).toBeCloseTo(listStart.y, 0);
    expect(listBox?.height ?? Number.NaN).toBeCloseTo(listStart.height, 0);
  };

  await input.fill('run');
  await expect(tiles.getByRole('button').first()).toBeVisible();
  await expectInPlace();

  await input.fill('');
  await input.pressSequentially('xyzzy', { delay: 50 });
  await expect(notUnderstood).toHaveCount(0);
  await expectInPlace();
  await expect(notUnderstood).toBeVisible();
  await expectInPlace();

  await input.fill('last 3 10');
  await expect(tiles.getByRole('button')).toHaveCount(6);
  await expect(notUnderstood).toHaveCount(0);
  await expectInPlace();
  await tiles.getByRole('button').last().scrollIntoViewIfNeeded();
  await expect(tiles.getByRole('button').last()).toBeInViewport();
  await expectInPlace();

  await input.fill(nameWord);
  await expect(notUnderstood).toBeVisible();
  await expectInPlace();

  await input.fill(`"${nameWord}"`);
  await expect(notUnderstood).toHaveCount(0);
  await expect(tiles.getByRole('button', { name: `Apply filter: “${nameWord}”` })).toBeVisible();
  await expectInPlace();

  await input.fill('');
  await expectInPlace();
};
