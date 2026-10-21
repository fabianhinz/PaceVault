/// <reference lib="dom" />
// studio-marker-dialog-phone review shots, from capture-spec-template.ts: the studio marker
// dialog (StudioMarkerDialog) in edit mode, opened from a waypoint row on the route's Tools tab.
// - marker-edit: the footer with Delete · Cancel · Save.
// - marker-edit-empty-km: the same dialog with the km field cleared. Save is enabled before the
//   change and disabled after it, so the scene does not assert its state.
// Setup as in apps/web/e2e/studio.spec.ts ("adds, edits and deletes markers in the Tools tab"):
// the e2e route fixture imported and one waypoint added, in en at the default viewport. A waypoint
// rather than a split point, because its row is named by its label, the same in en and de.
// Shot names: <d|p>-<en|de>-<name>.png in review/after/ (review/before/ with WB_SHOTS=before).
// Run: vp run workbench:capture -- tools/workbench/backlog/studio-marker-dialog-phone/review
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { FIXTURES_DIR } from '../../../../../apps/web/e2e/helpers/seed.ts';
import { DB_NAME } from '../../../../../apps/web/src/lib/db.ts';
import {
  expect,
  prepare,
  seedSessions,
  shootAll,
  test,
  type Locale,
  type Page,
} from '../../../shared/capture';

const ROUTE_GPX = resolve(FIXTURES_DIR, 'route.gpx');
const WAYPOINT = 'Fountain';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const t = (locale: Locale, key: string) => {
  const file = resolve(repoRoot, 'packages/i18n/messages', `${locale}.json`);
  const parsed = z.record(z.string(), z.unknown()).parse(JSON.parse(readFileSync(file, 'utf8')));
  const value = parsed[key];
  if (typeof value !== 'string') throw new Error(`message "${key}" is not a plain string`);
  return value;
};

/** True once the persisted studio store in IndexedDB holds the waypoint (as the e2e checks). */
const waypointPersisted = (page: Page) =>
  page.evaluate(
    async (args) => {
      const open = indexedDB.open(args.dbName);
      const db = await new Promise<IDBDatabase>((done, fail) => {
        open.onsuccess = () => done(open.result);
        open.onerror = () => fail(open.error);
      });
      const value = await new Promise<unknown>((done) => {
        const get = db.transaction('kv').objectStore('kv').get('store-studio');
        get.onsuccess = () => done(get.result);
        get.onerror = () => done(undefined);
      });
      db.close();
      return typeof value === 'string' && value.includes(args.label);
    },
    { dbName: DB_NAME, label: WAYPOINT },
  );

/**
 * The e2e flow: imports the route fixture, adds the waypoint on the Tools tab and waits until it
 * is persisted, since every shot starts with a reload. Returns the route's detail path.
 */
const importRouteWithWaypoint = async (page: Page) => {
  await seedSessions(page, []);
  await page.goto('/labs?tab=studio');
  await page.locator('[data-testid="studio-gpx-input"]').setInputFiles(ROUTE_GPX);
  await page.getByRole('button', { name: 'Alpine Loop' }).click();
  await page.waitForURL(/\/studio\/.+/);

  await page.getByRole('tab', { name: /tools/i }).click();
  await page.getByRole('button', { name: /add waypoint/i }).click();
  await page.getByPlaceholder(/water stop/i).fill(WAYPOINT);
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByText(WAYPOINT, { exact: true })).toBeVisible();
  await expect.poll(() => waypointPersisted(page)).toBe(true);
  return new URL(page.url()).pathname;
};

/** The Tools tab with the waypoint's edit dialog open: Delete · Cancel · Save in its footer. */
const openWaypointDialog = async (page: Page, locale: Locale, path: string) => {
  await page.goto(`${path}?tab=tools`);
  const row = page.getByRole('button', { name: WAYPOINT });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.click();
  const dialog = page.getByRole('dialog', {
    name: t(locale, 'ui_studio_marker_edit_waypoint'),
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const label = dialog.getByPlaceholder(t(locale, 'ui_studio_marker_label_placeholder'), {
    exact: true,
  });
  await expect(label).toHaveValue(WAYPOINT);
  // By accessible name: Delete is spelled out before the change, an icon button with that
  // aria-label after it.
  const button = (key: string) => dialog.getByRole('button', { name: t(locale, key), exact: true });
  await expect(button('ui_btn_delete')).toBeVisible();
  await expect(button('ui_btn_cancel')).toBeVisible();
  await expect(button('ui_btn_save')).toBeVisible();
  return dialog;
};

test('marker dialog in edit mode: Delete, Cancel and Save in the footer', async ({ page }) => {
  await prepare(page, 'en');
  const path = await importRouteWithWaypoint(page);
  await shootAll(page, 'marker-edit', async (p, shot) => {
    await openWaypointDialog(p, shot.locale, path);
  });
});

test('marker dialog in edit mode with the km field cleared', async ({ page }) => {
  await prepare(page, 'en');
  const path = await importRouteWithWaypoint(page);
  await shootAll(page, 'marker-edit-empty-km', async (p, shot) => {
    const dialog = await openWaypointDialog(p, shot.locale, path);
    // A waypoint's only number field: the distance from the start in km.
    const km = dialog.getByRole('spinbutton');
    await expect(km).not.toHaveValue('');
    await km.fill('');
    await expect(km).toHaveValue('');
  });
});
