import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  expect,
  loadDemoData,
  prepare,
  shootAll,
  test,
  type Locator,
  type Page,
  type Shot,
} from '../../../shared/capture';
import {
  FLAUCHER_EASY,
  STARNBERGER_LONG_RIDE,
} from '../../../../../apps/web/src/lib/demo/demoSchedule.ts';
import { DB_NAME } from '../../../../../apps/web/src/lib/storage/db.ts';
import { exposeMap } from '../../../../../apps/web/e2e/helpers/map.ts';

const SPEC_DIR = dirname(fileURLToPath(import.meta.url));
const MATCHING_TIMEOUT_MS = 180_000;
const SCENE_TIMEOUT_MS = 900_000;
const CAMERA_SETTLE_MS = 2_500;
const TORBOLE_RUN = 'Torbole lakeside run';
const FLAUCHER_RANGES: [number, number][] = [
  [0.05, 0.18],
  [0.2, 0.33],
  [0.35, 0.48],
  [0.5, 0.63],
  [0.65, 0.78],
  [0.8, 0.93],
];

type Locale = Shot['locale'];
type Device = Shot['device'];

interface SegmentSeed {
  sessionName: string;
  sessionIndex: number;
  kind: 'range' | 'session';
  fromFraction: number;
  toFraction: number;
}

interface Seeded {
  flaucherSessionId: string;
  olderFlaucherSessionId: string;
  starnbergerSessionId: string;
  rangeSegmentId: string;
  flaucherReferenceId: string;
  torboleSegmentId: string;
}

const messagesByLocale = {
  en: JSON.parse(
    readFileSync(resolve(SPEC_DIR, '../../../../../packages/i18n/messages/en.json'), 'utf8'),
  ) as Record<string, string>,
  de: JSON.parse(
    readFileSync(resolve(SPEC_DIR, '../../../../../packages/i18n/messages/de.json'), 'utf8'),
  ) as Record<string, string>,
};

const t = (locale: Locale, key: string): string => {
  const value = messagesByLocale[locale][key];
  if (value === undefined) throw new Error(`message ${key} missing`);
  return value;
};

const readKv = async (page: Page, args: { dbName: string; store: string; key?: string }) =>
  page.evaluate(
    async (input) =>
      new Promise<unknown>((resolveRead, reject) => {
        const openRequest = indexedDB.open(input.dbName);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const store = database.transaction(input.store).objectStore(input.store);
          const request = input.key === undefined ? store.getAll() : store.get(input.key);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            database.close();
            resolveRead(request.result);
          };
        };
      }),
    args,
  );

const sessionIdByName = async (page: Page, args: { name: string; index: number }) => {
  const raw = await readKv(page, { dbName: DB_NAME, store: 'kv', key: 'store-sessions' });
  if (typeof raw !== 'string') throw new Error('store-sessions missing');
  const persisted: { state: { sessions: { id: string; name?: string; date: number }[] } } =
    JSON.parse(raw);
  const session = persisted.state.sessions
    .filter((candidate) => candidate.name === args.name)
    .sort((first, second) => second.date - first.date)[args.index];
  if (session === undefined) throw new Error(`no session ${args.index} named ${args.name}`);
  return session.id;
};

const persistedSegmentCount = async (page: Page) => {
  const raw = await readKv(page, { dbName: DB_NAME, store: 'kv', key: 'store-segments' });
  if (typeof raw !== 'string') return 0;
  const persisted: { state: { segments: unknown[] } } = JSON.parse(raw);
  return persisted.state.segments.length;
};

// Builds each segment with the app's own draft code in the page, as "Save as segment" and
// "Use as reference segment" do, without driving the dialog for every one of them.
const createSegments = async (page: Page, seeds: SegmentSeed[]): Promise<string[]> => {
  const ids = await page.evaluate(async (input) => {
    const sessionsModule = await import('/src/store/sessions.ts');
    const segmentsModule = await import('/src/store/segments.ts');
    const db = await import('/src/lib/storage/db.ts');
    const creation = await import('/src/components/segments/segmentCreation.ts');
    const created: string[] = [];
    for (const seed of input) {
      const session = sessionsModule.useSessionsStore
        .getState()
        .sessions.filter((candidate: { name?: string }) => candidate.name === seed.sessionName)
        .sort((first: { date: number }, second: { date: number }) => second.date - first.date)[
        seed.sessionIndex
      ];
      if (session === undefined) throw new Error(`no session ${seed.sessionName}`);
      const records = await db.getSessionRecords(session.id);
      const last = records.length - 1;
      const span = {
        startRecord: Math.floor(seed.fromFraction * last),
        endRecord: Math.floor(seed.toFraction * last),
      };
      const draft = creation.segmentDraft({ session, records, span, kind: seed.kind });
      if (draft === null) throw new Error(`no draft for ${seed.sessionName}`);
      segmentsModule.useSegmentsStore.getState().addSegment(draft);
      created.push(draft.id);
    }
    return created;
  }, seeds);
  await expect.poll(() => persistedSegmentCount(page), { timeout: 30_000 }).toBe(ids.length);
  return ids;
};

const waitForMatching = async (page: Page, count: number) => {
  await page.goto('/?tab=segments');
  await expect(page.getByTestId('segment-item')).toHaveCount(count, {
    timeout: MATCHING_TIMEOUT_MS,
  });
};

const setUpEmpty = async (page: Page) => {
  test.setTimeout(SCENE_TIMEOUT_MS);
  await prepare(page, 'en');
  await loadDemoData(page);
};

const setUp = async (page: Page): Promise<Seeded> => {
  await setUpEmpty(page);
  const flaucherSeeds: SegmentSeed[] = FLAUCHER_RANGES.map((range) => ({
    sessionName: FLAUCHER_EASY,
    sessionIndex: 0,
    kind: 'range',
    fromFraction: range[0],
    toFraction: range[1],
  }));
  const ids = await createSegments(page, [
    ...flaucherSeeds,
    {
      sessionName: FLAUCHER_EASY,
      sessionIndex: 0,
      kind: 'session',
      fromFraction: 0,
      toFraction: 1,
    },
    { sessionName: TORBOLE_RUN, sessionIndex: 0, kind: 'session', fromFraction: 0, toFraction: 1 },
  ]);
  await waitForMatching(page, ids.length);
  const rangeSegmentId = ids[2];
  const flaucherReferenceId = ids[6];
  const torboleSegmentId = ids[7];
  if (
    rangeSegmentId === undefined ||
    flaucherReferenceId === undefined ||
    torboleSegmentId === undefined
  ) {
    throw new Error('segments missing');
  }
  return {
    flaucherSessionId: await sessionIdByName(page, { name: FLAUCHER_EASY, index: 0 }),
    olderFlaucherSessionId: await sessionIdByName(page, { name: FLAUCHER_EASY, index: 1 }),
    starnbergerSessionId: await sessionIdByName(page, { name: STARNBERGER_LONG_RIDE, index: 0 }),
    rangeSegmentId,
    flaucherReferenceId,
    torboleSegmentId,
  };
};

const sessionUrl = (sessionId: string) => `/sessions/${encodeURIComponent(sessionId)}`;
const segmentUrl = (segmentId: string, from?: string) => {
  if (from === undefined) return `/segments/${encodeURIComponent(segmentId)}`;
  return `/segments/${encodeURIComponent(segmentId)}?from=${encodeURIComponent(from)}`;
};

const waitForSegmentPage = async (page: Page) => {
  await expect(page.getByTestId('pass-strip')).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  await expect(page.getByTestId('segment-explorer')).toBeVisible({ timeout: 60_000 });
};

const selectPassChip = async (page: Page, chip: Locator) => {
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
};

// Scrolls so the second year group starts just right of where the first year's sticky header
// sits, so that header is pushed left by its group's end while the second one sits at its own
// place. Reads the stuck offset from the last group's header, which is stuck at scroll end.
const STRIP_HEADER_PUSH_PX = 8;

const scrollStripToYearBoundary = async (page: Page) => {
  const strip = page.getByTestId('plot-strip');
  const groupCount = await strip.evaluate((element, pushPx) => {
    const headers = [
      ...element.querySelectorAll<HTMLElement>(':scope > div > [role="group"] > :first-child'),
    ];
    const first = headers[0];
    const last = headers.at(-1);
    const second = headers[1]?.parentElement;
    if (first === undefined || last === undefined || second == null) return headers.length;
    const stripLeft = element.getBoundingClientRect().left;
    const stuckOffset = last.getBoundingClientRect().left - stripLeft;
    const targetOffset = stuckOffset + first.getBoundingClientRect().width - pushPx;
    element.scrollLeft += second.getBoundingClientRect().left - stripLeft - targetOffset;
    return headers.length;
  }, STRIP_HEADER_PUSH_PX);
  if (groupCount < 2) throw new Error(`strip has ${groupCount} year group(s), needs two`);
};

const centerOnPhone = async (locator: Locator, device: Device) => {
  if (device !== 'p') return;
  await locator.evaluate((element) => element.scrollIntoView({ block: 'center' }));
};

const LOCALES = ['en', 'de'] as const;
const VIEWPORTS = { d: { width: 1280, height: 800 }, p: { width: 390, height: 844 } };

const shootKeepingPointer = async (
  page: Page,
  args: { name: string; devices: readonly Device[]; locales?: readonly Locale[] },
  scene: (page: Page, shot: Shot) => Promise<void>,
) => {
  const outDir = resolve(dirname(test.info().file), 'after');
  mkdirSync(outDir, { recursive: true });
  for (const locale of args.locales ?? LOCALES) {
    for (const device of args.devices) {
      await page.setViewportSize(VIEWPORTS[device]);
      await page.evaluate((value) => sessionStorage.setItem('wb-locale', value), locale);
      await page.reload();
      await scene(page, { device, locale });
      await page.waitForTimeout(CAMERA_SETTLE_MS);
      await page.screenshot({ path: resolve(outDir, `${device}-${locale}-${args.name}.png`) });
    }
  }
};

const BOTH = ['d', 'p'] as const;
const DESKTOP = ['d'] as const;

const switchMapTo3d = async (page: Page) => {
  const pill = page.getByTestId('map-view-pill');
  await expect(pill).toBeVisible({ timeout: 30_000 });
  const name = (await pill.getAttribute('aria-label')) ?? '';
  if (name.endsWith('3D')) return;
  await pill.click();
  await page.getByRole('radio', { name: /^3D/ }).click();
  await expect(pill).toHaveAttribute('aria-label', /3D$/);
};

const settledBox = async (locator: Locator) => {
  let previous = '';
  await expect
    .poll(
      async () => {
        await locator.scrollIntoViewIfNeeded();
        const current = JSON.stringify(await locator.boundingBox());
        const settled = current === previous;
        previous = current;
        return settled;
      },
      { intervals: [300], timeout: 30_000 },
    )
    .toBe(true);
  const box = await locator.boundingBox();
  if (box === null) throw new Error('no box');
  return box;
};

const zoomHeartRateChart = async (page: Page, locale: Locale) => {
  const chart = page
    .getByRole('region', { name: t(locale, 'ui_chart_title_hr') })
    .locator('.recharts-surface');
  await expect(chart).toBeVisible({ timeout: 60_000 });
  const box = await settledBox(chart);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.29, y);
  await advanceClock(page, POINTER_STEP_MS);
  await page.mouse.move(box.x + box.width * 0.3, y);
  await page.waitForTimeout(FRAME_WAIT_MS);
  await page.mouse.down();
  for (let step = 1; step <= 8; step++) {
    await advanceClock(page, POINTER_STEP_MS);
    await page.mouse.move(box.x + box.width * (0.3 + 0.025 * step), y);
    await page.waitForTimeout(FRAME_WAIT_MS);
  }
  await page.mouse.up();
  await expect(page.getByTestId('zoom-reset-chip')).toBeVisible();
};

const openSessionMenu = async (page: Page, locale: Locale) => {
  await page.getByRole('button', { name: t(locale, 'ui_session_actions') }).click();
};

const openSegmentMenu = async (page: Page, locale: Locale) => {
  await expect(page.getByTestId('segment-header')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: t(locale, 'ui_segment_actions') }).click();
};

const openSegmentsRow = async (page: Page) => {
  const row = page.getByTestId('segments-row');
  await expect(row).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  await row.getByRole('button').first().click();
  await expect(row.getByTestId('segment-item').first()).toBeVisible();
  return row;
};

const zoomOntoSegment = async (page: Page, args: { segmentId: string; device: Device }) => {
  await expect(page.locator('.maplibregl-map')).toBeAttached({ timeout: 60_000 });
  await exposeMap(page);
  const area = {
    d: { left: 90, right: 740, top: 60, bottom: 690 },
    p: { left: 20, right: 370, top: 60, bottom: 290 },
  }[args.device];
  const projected: { x: number; y: number }[] = await page.evaluate(
    async (input) => {
      const segmentId = input.segmentId;
      const segmentsModule = await import('/src/store/segments.ts');
      const gpsTrack = await import('/src/lib/analysis/gpsTrack.ts');
      const segment = segmentsModule.useSegmentsStore
        .getState()
        .segments.find((candidate: { id: string }) => candidate.id === segmentId);
      if (segment === undefined) throw new Error('segment missing');
      const map = Reflect.get(window, '__map') as {
        project: (lngLat: [number, number]) => { x: number; y: number };
      };
      const path: [number, number][] = gpsTrack.decodeTrackForRendering(segment.encodedPolyline);
      const middle = path[Math.floor(path.length / 2)];
      if (middle !== undefined) {
        const jumpable = map as unknown as {
          jumpTo: (options: { center: [number, number]; zoom: number; padding: object }) => void;
        };
        jumpable.jumpTo({ center: middle, zoom: input.zoom, padding: input.padding });
        await new Promise((done) => setTimeout(done, input.renderWaitMs));
      }
      return path.map((point) => map.project(point));
    },
    {
      segmentId: args.segmentId,
      zoom: HOVER_ZOOM,
      padding: HOVER_PADDING_BY_DEVICE[args.device],
      renderWaitMs: CAMERA_SETTLE_MS,
    },
  );
  return projected.filter(
    (point) =>
      point.x > area.left && point.x < area.right && point.y > area.top && point.y < area.bottom,
  );
};

const HOVER_ZOOM = 14;
const HOVER_PADDING_BY_DEVICE = {
  d: { top: 0, bottom: 0, left: 0, right: 540 },
  p: { top: 0, bottom: 520, left: 0, right: 0 },
};
const FRAME_WAIT_MS = 120;
const CLOCK_ANCHOR_MS = Date.parse('2026-09-16T12:00:00+02:00');
const POINTER_STEP_MS = 60;
let clockOffsetMs = 0;

// prepare() freezes Date at the anchor; chart drag throttling and deck.gl's tap detection read
// Date, so the fixed time is moved forward between pointer events.
const advanceClock = async (page: Page, ms: number) => {
  clockOffsetMs += ms;
  await page.clock.setFixedTime(CLOCK_ANCHOR_MS + clockOffsetMs);
};

const FADE_STEPS = 8;

// The track fade on hover is a 300 ms deck.gl transition timed by Date, so it only finishes
// when the fixed time moves on.
const finishMapFade = async (page: Page) => {
  for (let step = 0; step < FADE_STEPS; step++) {
    await advanceClock(page, POINTER_STEP_MS);
    await page.waitForTimeout(FRAME_WAIT_MS);
  }
};

test('empty state, no-segments row and chart creation', async ({ page }) => {
  await setUpEmpty(page);
  const flaucherSessionId = await sessionIdByName(page, { name: FLAUCHER_EASY, index: 0 });

  await shootAll(page, 'segments-tab-empty', async (p) => {
    await p.goto('/?tab=segments');
    await expect(p.getByTestId('segments-tab')).toBeVisible({ timeout: 60_000 });
    await expect(p.getByTestId('segment-item')).toHaveCount(0);
  });

  await shootAll(page, 'session-segments-none', async (p) => {
    await p.goto(sessionUrl(flaucherSessionId));
    await expect(p.getByTestId('segments-row')).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  });

  await shootKeepingPointer(
    page,
    { name: 'session-chart-zoom-save', devices: DESKTOP },
    async (p, shot) => {
      await p.goto(sessionUrl(flaucherSessionId));
      await zoomHeartRateChart(p, shot.locale);
      await expect(
        p.getByRole('button', { name: t(shot.locale, 'ui_segment_save_as') }),
      ).toBeVisible();
      await p.mouse.move(2, 2);
    },
  );

  await shootKeepingPointer(
    page,
    { name: 'segment-name-dialog', devices: DESKTOP },
    async (p, shot) => {
      await p.goto(sessionUrl(flaucherSessionId));
      await zoomHeartRateChart(p, shot.locale);
      await p.getByRole('button', { name: t(shot.locale, 'ui_segment_save_as') }).click();
      await expect(
        p.getByRole('textbox', { name: t(shot.locale, 'ui_segment_name_label') }),
      ).toBeVisible();
    },
  );
});

test('dashboard, tab and session row', async ({ page }) => {
  const seeded = await setUp(page);

  await shootAll(page, 'dashboard', async (p) => {
    await p.goto('/');
  });

  await shootAll(page, 'segments-tab', async (p) => {
    await p.goto('/?tab=segments');
    await expect(p.getByTestId('segment-item').first()).toBeVisible({ timeout: 60_000 });
    await p.waitForTimeout(CAMERA_SETTLE_MS);
  });

  await shootAll(page, 'session-summary', async (p) => {
    await p.goto(sessionUrl(seeded.flaucherSessionId));
    await expect(p.getByTestId('segments-row')).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  });

  await shootAll(page, 'session-segments-expanded', async (p, shot) => {
    await p.goto(sessionUrl(seeded.flaucherSessionId));
    const row = await openSegmentsRow(p);
    await centerOnPhone(row.getByTestId('segment-item').nth(1), shot.device);
  });

  await shootAll(page, 'session-segments-show-more', async (p, shot) => {
    await p.goto(sessionUrl(seeded.flaucherSessionId));
    const row = await openSegmentsRow(p);
    await row.getByRole('button', { expanded: false }).last().click();
    await expect(row.getByRole('button', { expanded: true }).last()).toBeVisible();
    await centerOnPhone(row.getByTestId('segment-item').nth(5), shot.device);
  });
});

test('segment page', async ({ page }) => {
  const seeded = await setUp(page);

  await shootAll(page, 'segment-page', async (p) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await waitForSegmentPage(p);
  });

  await shootAll(page, 'segment-page-from-session', async (p) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId, seeded.flaucherSessionId));
    await waitForSegmentPage(p);
  });

  await shootAll(page, 'segment-page-pass-tapped', async (p) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await waitForSegmentPage(p);
    const label = await p
      .getByTestId('pass-chip')
      .and(p.locator('[data-tone="neutral"][aria-pressed="false"]'))
      .nth(-3)
      .getAttribute('aria-label');
    if (label === null) throw new Error('pass chip has no label');
    await selectPassChip(p, p.getByRole('button', { name: label, exact: true }));
  });

  await shootAll(page, 'segment-page-best-selected', async (p) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await waitForSegmentPage(p);
    const best = p.getByTestId('pass-chip').and(p.locator('[data-tone="best"]'));
    await best.scrollIntoViewIfNeeded();
    await selectPassChip(p, best);
  });

  await shootAll(page, 'segment-page-strip-years', async (p) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await waitForSegmentPage(p);
    await scrollStripToYearBoundary(p);
  });

  await shootKeepingPointer(
    page,
    { name: 'segment-page-explorer-hover', devices: BOTH },
    async (p, shot) => {
      await p.goto(segmentUrl(seeded.rangeSegmentId));
      await waitForSegmentPage(p);
      const surface = p.getByTestId('segment-explorer').locator('.recharts-surface').first();
      await expect(surface).toBeVisible({ timeout: 60_000 });
      if (shot.device === 'p') {
        await centerOnPhone(surface, 'p');
        await p.waitForTimeout(CAMERA_SETTLE_MS);
      }
      const box = await surface.boundingBox();
      if (box === null) throw new Error('explorer chart has no box');
      await p.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
      await p.mouse.move(box.x + box.width * 0.55, box.y + box.height / 2, { steps: 8 });
    },
  );
});

test('session segment hover', async ({ page }) => {
  const seeded = await setUp(page);

  const hoverSessionSegment = async (p: Page, device: Device) => {
    const row = await openSegmentsRow(p);
    const item = row.getByTestId('segment-item').nth(2);
    await centerOnPhone(item, device);
    await p.waitForTimeout(CAMERA_SETTLE_MS);
    await item.hover();
    await finishMapFade(p);
  };

  await shootKeepingPointer(
    page,
    { name: 'session-segment-hover', devices: BOTH },
    async (p, shot) => {
      await p.goto(sessionUrl(seeded.flaucherSessionId));
      await hoverSessionSegment(p, shot.device);
    },
  );

  await shootKeepingPointer(
    page,
    { name: 'session-segment-hover-3d', devices: BOTH },
    async (p, shot) => {
      await p.goto(sessionUrl(seeded.flaucherSessionId));
      await switchMapTo3d(p);
      await p.waitForTimeout(CAMERA_SETTLE_MS);
      await hoverSessionSegment(p, shot.device);
    },
  );
});

test('segments tab hover', async ({ page }) => {
  const seeded = await setUp(page);

  await shootKeepingPointer(
    page,
    { name: 'segments-tab-hover', devices: BOTH },
    async (p, shot) => {
      await p.goto('/?tab=segments');
      const item = p.getByTestId('segment-item').nth(1);
      await expect(item).toBeVisible({ timeout: 60_000 });
      await p.waitForTimeout(CAMERA_SETTLE_MS);
      await zoomOntoSegment(p, { segmentId: seeded.rangeSegmentId, device: shot.device });
      await centerOnPhone(item, shot.device);
      await item.hover();
      await finishMapFade(p);
    },
  );
});

test('session menu entries and the delete warning', async ({ page }) => {
  const seeded = await setUp(page);

  await shootAll(page, 'session-menu-open-segment', async (p, shot) => {
    await p.goto(sessionUrl(seeded.flaucherSessionId));
    await openSessionMenu(p, shot.locale);
    await expect(
      p.getByRole('menuitem', { name: t(shot.locale, 'ui_segment_open') }),
    ).toBeVisible();
  });

  await shootAll(page, 'session-menu-reference', async (p, shot) => {
    await p.goto(sessionUrl(seeded.olderFlaucherSessionId));
    await openSessionMenu(p, shot.locale);
    await expect(
      p.getByRole('menuitem', { name: t(shot.locale, 'ui_segment_use_as_reference') }),
    ).toBeVisible();
  });

  await shootAll(page, 'segment-name-dialog-similar', async (p, shot) => {
    await p.goto(sessionUrl(seeded.olderFlaucherSessionId));
    await openSessionMenu(p, shot.locale);
    await p.getByRole('menuitem', { name: t(shot.locale, 'ui_segment_use_as_reference') }).click();
    await expect(p.getByTestId('similar-segment')).toBeVisible({ timeout: 30_000 });
  });

  await shootAll(page, 'session-delete-segments', async (p, shot) => {
    await p.goto(sessionUrl(seeded.flaucherSessionId));
    await openSessionMenu(p, shot.locale);
    await p.getByRole('menuitem', { name: t(shot.locale, 'ui_btn_delete') }).click();
    await expect(
      p.getByRole('dialog', { name: t(shot.locale, 'ui_session_delete_title') }),
    ).toBeVisible();
  });
});

test('segment page states and segment menu', async ({ page }) => {
  const seeded = await setUp(page);

  await shootAll(page, 'segment-page-single-pass', async (p) => {
    await p.goto(segmentUrl(seeded.torboleSegmentId));
    await expect(p.getByTestId('pass-strip')).toBeVisible({ timeout: MATCHING_TIMEOUT_MS });
  });

  await shootAll(page, 'segment-menu', async (p, shot) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await openSegmentMenu(p, shot.locale);
    await expect(p.getByRole('menuitem', { name: t(shot.locale, 'ui_btn_rename') })).toBeVisible();
  });

  await shootAll(page, 'segment-rename-dialog', async (p, shot) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await openSegmentMenu(p, shot.locale);
    await p.getByRole('menuitem', { name: t(shot.locale, 'ui_btn_rename') }).click();
    await expect(
      p.getByRole('dialog', { name: t(shot.locale, 'ui_segment_rename_title') }),
    ).toBeVisible();
  });

  await shootAll(page, 'segment-delete-confirm', async (p, shot) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await openSegmentMenu(p, shot.locale);
    await p.getByRole('menuitem', { name: t(shot.locale, 'ui_btn_delete') }).click();
    await expect(
      p.getByRole('dialog', { name: t(shot.locale, 'ui_segment_delete_title') }),
    ).toBeVisible();
  });

  await page.route('**/segments.worker.ts*', () => undefined);
  await shootAll(page, 'segment-page-finding', async (p) => {
    await p.goto(segmentUrl(seeded.flaucherReferenceId));
    await expect(p.getByTestId('pass-strip-skeleton')).toBeVisible({ timeout: 30_000 });
    await expect(p.getByTestId('segment-explorer-frame')).toBeVisible();
  });
  await page.unroute('**/segments.worker.ts*');
});

const applyLastMonthFilter = async (page: Page) => {
  await page.evaluate(async () => {
    const filtersModule = await import('/src/store/filters.ts');
    const filtering = await import('/src/lib/filtering/filters.ts');
    filtersModule.useFiltersStore.setState({
      activeFilter: {
        ...filtering.emptyCriteria(),
        time: { kind: 'relative', amount: 30, unit: 'day' },
      },
    });
  });
  await expect
    .poll(
      async () => {
        const raw = await readKv(page, { dbName: DB_NAME, store: 'kv', key: 'store-filters' });
        return typeof raw === 'string' && raw.includes('"relative"');
      },
      { timeout: 30_000 },
    )
    .toBe(true);
};

test('segment page and session row under a dashboard filter', async ({ page }) => {
  const seeded = await setUp(page);
  await applyLastMonthFilter(page);

  await shootAll(page, 'segment-page-filtered', async (p) => {
    await p.goto(segmentUrl(seeded.rangeSegmentId));
    await waitForSegmentPage(p);
  });

  await shootAll(page, 'session-segments-filtered', async (p, shot) => {
    await p.goto(sessionUrl(seeded.flaucherSessionId));
    const row = await openSegmentsRow(p);
    await centerOnPhone(row.getByTestId('segment-item').nth(1), shot.device);
  });
});
