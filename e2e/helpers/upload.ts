import { type Page, expect } from '@playwright/test';
import { UPLOAD_EXTENSIONS } from '../../src/lib/archive';

export const closeImportSummary = async (page: Page): Promise<string> => {
  const summary = page.getByTestId('import-summary');
  await expect(summary).toBeVisible({ timeout: 30_000 });
  const text = (await summary.textContent()) ?? '';
  await summary.getByRole('button', { name: /close/i }).click();
  await expect(summary).toBeHidden();
  return text;
};

/**
 * Uploads files via the hidden file input — the onboarding one when it is on screen,
 * otherwise the FIT files card in settings — then closes the import summary and returns its text.
 */
export const uploadFiles = async (page: Page, filePaths: string[]) => {
  const fileInput = page.locator(`input[type="file"][accept="${UPLOAD_EXTENSIONS.join(',')}"]`);
  if ((await fileInput.count()) === 0) await page.goto('/settings?tab=data');
  await fileInput.setInputFiles(filePaths);

  return closeImportSummary(page);
};

/**
 * @deprecated Use `uploadFiles` instead. Kept for backward compat.
 */
export const uploadFitFiles = uploadFiles;

/**
 * Simulates a file drop onto the document by dispatching native drag events
 * with a DataTransfer containing the given files.
 */
export const dropFiles = async (page: Page, filePaths: string[]) => {
  const fileBuffers = await Promise.all(
    filePaths.map(async (fp) => {
      const fs = await import('fs/promises');
      const path = await import('path');
      const buffer = await fs.readFile(fp);
      return { name: path.basename(fp), buffer: Array.from(buffer) };
    }),
  );

  await page.evaluate(async (files) => {
    const dt = new DataTransfer();
    for (const f of files) {
      const blob = new Blob([new Uint8Array(f.buffer)]);
      const file = new File([blob], f.name);
      dt.items.add(file);
    }

    const opts = { bubbles: true, cancelable: true, dataTransfer: dt };
    document.dispatchEvent(new DragEvent('dragenter', opts));
    document.dispatchEvent(new DragEvent('drop', opts));
  }, fileBuffers);

  return closeImportSummary(page);
};
