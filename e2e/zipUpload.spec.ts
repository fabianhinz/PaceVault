import { test, expect } from '@playwright/test';
import {
  seedOnboardingComplete,
  CYCLING_FIT,
  RUNNING_FIT,
  CYCLING_ONLY_ZIP,
  ACTIVITIES_ZIP,
} from './helpers/seed';
import { uploadFiles, dropFiles } from './helpers/upload';

test.describe('ZIP archive upload', () => {
  test.describe('onboarding (file picker only)', () => {
    test('upload a ZIP containing a single FIT file → session appears', async ({ page }) => {
      await page.goto('/');

      // Select the "Files & archives" path and fill thresholds
      await page.getByText(/FIT files & archives/i).click();
      await page.fill('#thresh-restHr', '50');
      await page.fill('#thresh-maxHr', '185');

      const uploadButton = page.getByRole('button', { name: /upload/i }).first();
      await expect(uploadButton).toBeEnabled({ timeout: 3000 });

      // Upload a ZIP via the file picker
      const doneBanner = await uploadFiles(page, [CYCLING_ONLY_ZIP]);
      await expect(doneBanner).toContainText('1 session');

      // Onboarding should auto-complete — dock should be visible
      await expect(page.locator('[data-layout="dock"]')).toBeVisible();
    });

    test('upload a ZIP containing multiple FIT files → all sessions appear', async ({ page }) => {
      await page.goto('/');

      await page.getByText(/FIT files & archives/i).click();
      await page.fill('#thresh-restHr', '50');
      await page.fill('#thresh-maxHr', '185');

      const uploadButton = page.getByRole('button', { name: /upload/i }).first();
      await expect(uploadButton).toBeEnabled({ timeout: 3000 });

      const doneBanner = await uploadFiles(page, [ACTIVITIES_ZIP]);
      await expect(doneBanner).toContainText('2 sessions');

      await expect(page.locator('[data-layout="dock"]')).toBeVisible();
    });
  });

  test.describe('post-onboarding (drag and drop)', () => {
    test.beforeEach(async ({ page }) => {
      await seedOnboardingComplete(page);
    });

    test('drop a ZIP file → sessions extracted and uploaded', async ({ page }) => {
      const doneBanner = await dropFiles(page, [ACTIVITIES_ZIP]);
      await expect(doneBanner).toContainText('2 sessions');

      // Navigate to sessions page and verify sessions are listed
      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
    });

    test('drop a FIT file directly → session uploaded', async ({ page }) => {
      const doneBanner = await dropFiles(page, [CYCLING_FIT]);
      await expect(doneBanner).toContainText('1 session');
    });

    test('drop a mix of FIT and ZIP files → all sessions uploaded', async ({ page }) => {
      const doneBanner = await dropFiles(page, [RUNNING_FIT, CYCLING_ONLY_ZIP]);
      await expect(doneBanner).toContainText('2 sessions');
    });

    test('drag hint toast appears while dragging files', async ({ page }) => {
      // Wait for the dock (and its useFileDropEffect) to be fully mounted
      await expect(page.locator('[data-layout="dock"]')).toBeVisible();

      // Use a custom event class to bypass DragEvent.dataTransfer being non-configurable
      await page.evaluate(() => {
        const mockDt = { types: ['Files'], files: [], items: [] };
        class MockDragEvent extends Event {
          dataTransfer = mockDt;
          constructor(type: string) {
            super(type, { bubbles: true, cancelable: true });
          }
        }
        document.dispatchEvent(new MockDragEvent('dragenter'));
      });

      const hint = page
        .getByRole('region', { name: /notifications/i })
        .getByText(/drop files to import/i);
      await expect(hint).toBeVisible({ timeout: 5_000 });

      await page.evaluate(() => {
        const mockDt = { types: ['Files'], files: [], items: [] };
        class MockDragEvent extends Event {
          dataTransfer = mockDt;
          constructor(type: string) {
            super(type, { bubbles: true, cancelable: true });
          }
        }
        document.dispatchEvent(new MockDragEvent('dragleave'));
      });

      await expect(hint).not.toBeVisible({ timeout: 5_000 });
    });
  });
});
