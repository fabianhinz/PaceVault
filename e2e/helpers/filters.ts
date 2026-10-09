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
