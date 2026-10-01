import { test as base } from '@playwright/test';

const hideQueryDevtools = () => {
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = '.tsqd-parent-container { display: none !important; }';
    document.head.append(style);
  });
};

export const test = base.extend<{ hideQueryDevtools: void }>({
  hideQueryDevtools: [
    async ({ page }, use) => {
      await page.addInitScript(hideQueryDevtools);
      await use();
    },
    { auto: true },
  ],
});

export { expect, type Page } from '@playwright/test';
