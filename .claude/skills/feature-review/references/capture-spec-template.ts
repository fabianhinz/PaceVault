// Copied to workbench/<f>/review/capture.spec.ts. One test per review entry; the shot name
// is the entry's image name: <d|p>-<en|de>-<name>.png in review/after/ (review/before/ with
// WB_SHOTS=before). Run: vp run workbench:capture -- workbench/<f>/review
import { loadDemoData, prepare, seedSessions, shootAll, test } from '../../_shared/capture';

test('dashboard with two sessions', async ({ page }) => {
  await prepare(page, 'en');
  await seedSessions(page, [
    { sport: 'running', date: Date.parse('2026-09-14T08:00:00+02:00') },
    { sport: 'cycling', date: Date.parse('2026-09-15T17:00:00+02:00'), distance: 42_000 },
  ]);
  await shootAll(page, 'dashboard', async (p) => {
    await p.goto('/');
  });
});

test('map with the demo data', async ({ page }) => {
  await prepare(page, 'en');
  await loadDemoData(page);
  // The scene's second argument, { device: 'd' | 'p', locale: 'en' | 'de' }, is for screens
  // that are set up differently per shot.
  await shootAll(page, 'map-demo', async (p) => {
    await p.goto('/');
  });
});
