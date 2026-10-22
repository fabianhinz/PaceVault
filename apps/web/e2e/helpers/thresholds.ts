import { expect, type Locator, type Page } from './test';

export const thresholdTile = (page: Page, tileTitle: string): Locator =>
  page.getByRole('button', { name: new RegExp(`^${tileTitle}`) });

export const setThreshold = async (page: Page, tileTitle: string, value: string) => {
  await thresholdTile(page, tileTitle).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input').fill(value);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
};
