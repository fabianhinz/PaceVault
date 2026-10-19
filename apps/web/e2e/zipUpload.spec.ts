import { test, expect } from './helpers/test';
import {
  seedOnboardingComplete,
  CYCLING_FIT,
  RUNNING_FIT,
  CYCLING_ONLY_ZIP,
  ACTIVITIES_ZIP,
} from './helpers/seed';
import { uploadFilesWithButton, dropFiles } from './helpers/upload';
import { fillOnboardingProfile, startOnboarding } from './helpers/onboarding';

test.describe('ZIP archive upload', () => {
  test.describe('onboarding (file picker only)', () => {
    test('upload a ZIP containing a single FIT file → session appears', async ({ page }) => {
      await startOnboarding(page, 'FIT files');
      await fillOnboardingProfile(page);
      const uploadButton = page.getByRole('button', { name: /upload fit files/i });
      await expect(uploadButton).toBeEnabled();

      const summary = await uploadFilesWithButton(page, uploadButton, [CYCLING_ONLY_ZIP]);
      expect(summary).toContain('1 new session');

      await expect(page.locator('[data-layout="dock"]')).toBeVisible();
    });

    test('upload a ZIP containing multiple FIT files → all sessions appear', async ({ page }) => {
      await startOnboarding(page, 'FIT files');
      await fillOnboardingProfile(page);
      const uploadButton = page.getByRole('button', { name: /upload fit files/i });
      await expect(uploadButton).toBeEnabled();

      const summary = await uploadFilesWithButton(page, uploadButton, [ACTIVITIES_ZIP]);
      expect(summary).toContain('2 new sessions');

      await expect(page.locator('[data-layout="dock"]')).toBeVisible();
    });
  });

  test.describe('post-onboarding (drag and drop)', () => {
    test.beforeEach(async ({ page }) => {
      await seedOnboardingComplete(page);
      await expect(page.locator('[data-layout="dock"]')).toBeVisible();
    });

    test('drop a ZIP file → sessions extracted and uploaded', async ({ page }) => {
      const summary = await dropFiles(page, [ACTIVITIES_ZIP]);
      expect(summary).toContain('2 new sessions');

      await page.getByRole('link', { name: /sessions/i }).click();
      await page.waitForURL('/sessions');

      const sessionLinks = page.locator('[data-testid="session-item"]');
      await expect(sessionLinks).toHaveCount(2, { timeout: 10_000 });
    });

    test('drop a FIT file directly → session uploaded', async ({ page }) => {
      const summary = await dropFiles(page, [CYCLING_FIT]);
      expect(summary).toContain('1 new session');
    });

    test('drop a mix of FIT and ZIP files → all sessions uploaded', async ({ page }) => {
      const summary = await dropFiles(page, [RUNNING_FIT, CYCLING_ONLY_ZIP]);
      expect(summary).toContain('2 new sessions');
    });

    test('drag hint toast appears while dragging files', async ({ page }) => {
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
