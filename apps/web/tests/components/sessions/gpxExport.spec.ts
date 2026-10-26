import { describe, it, expect } from 'vite-plus/test';
import {
  buildGpxFilename,
  buildSessionGpx,
  buildRouteGpx,
  buildRouteSegmentGpx,
} from '@/components/sessions/gpxExport.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import type { StudioMarker } from '@/types.ts';
import { gpsRunningRecordSeries, indoorRecordSeries } from '@pacevault/testing/series.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockRoutePoint } from '@pacevault/testing/route.ts';
import { MS_PER_MINUTE } from '@pacevault/engine/time.ts';

const routePointsAlong = (count: number): RoutePoint[] =>
  Array.from({ length: count }, (_, i) =>
    createMockRoutePoint({
      lat: 47 + i * 0.001,
      lng: 11 + i * 0.001,
      ele: 600 + i,
      dist: i * 1000,
      time: 1700000000000 + i * MS_PER_MINUTE,
    }),
  );

describe(buildSessionGpx.name, () => {
  it('produces valid GPX from GPS records', () => {
    const session = createMockTrainingSession({
      id: 'test-1',
      name: 'Morning Run',
      date: 1700000000000,
    });
    const records = gpsRunningRecordSeries(10);
    const gpx = buildSessionGpx({ session, records });

    expect(gpx).not.toBeNull();
    expect(gpx).toContain('<?xml');
    expect(gpx).toContain('<gpx');
    expect(gpx).toContain('<trkpt');
    expect(gpx).toContain('<ele>');
    expect(gpx).toContain('<time>');
    expect(gpx).toContain('Morning Run');
  });

  it('exports every recorded GPS point instead of a simplified track', () => {
    const session = createMockTrainingSession({ id: 'test-full', date: 1700000000000 });
    const records = gpsRunningRecordSeries(200);
    const gpx = buildSessionGpx({ session, records });
    expect((gpx?.match(/<trkpt/g) ?? []).length).toBe(200);
  });

  it('returns null for indoor records with no GPS', () => {
    const session = createMockTrainingSession({ id: 'test-2' });
    const records = indoorRecordSeries(50);
    const gpx = buildSessionGpx({ session, records });

    expect(gpx).toBeNull();
  });

  it('returns null when fewer than 2 valid GPS points', () => {
    const session = createMockTrainingSession({ id: 'test-3' });
    const records = gpsRunningRecordSeries(1);
    const gpx = buildSessionGpx({ session, records });

    expect(gpx).toBeNull();
  });

  it('filters out records with invalid coordinates', () => {
    const session = createMockTrainingSession({ id: 'test-4', date: 1700000000000 });
    const validRecords = gpsRunningRecordSeries(5);
    const invalidRecords = [
      { sessionId: 'test-4', timestamp: 100, lat: undefined, lng: undefined },
      { sessionId: 'test-4', timestamp: 101, lat: 999, lng: 999 },
    ];
    const mixed = [...validRecords, ...invalidRecords];
    const gpx = buildSessionGpx({ session, records: mixed });

    expect(gpx).not.toBeNull();
    const trkptCount = (gpx?.match(/<trkpt/g) ?? []).length;
    expect(trkptCount).toBe(5);
  });

  it('returns null for empty records', () => {
    const session = createMockTrainingSession({ id: 'test-5' });
    const gpx = buildSessionGpx({ session, records: [] });

    expect(gpx).toBeNull();
  });
});

const markers: StudioMarker[] = [
  { id: 'split', type: 'track_modifier', distanceM: 5000 },
  { id: 'poi-a', type: 'point_of_interest', distanceM: 1500, label: 'Fountain' },
  {
    id: 'poi-b',
    type: 'point_of_interest',
    distanceM: 4000,
    label: 'Hut',
    description: 'Closed Mondays',
  },
];

describe(buildRouteGpx.name, () => {
  const meta = { name: 'Alpine Loop', time: new Date(1700000000000) };

  it('exports every point', () => {
    const gpx = buildRouteGpx({ points: routePointsAlong(10), markers: [], metadata: meta });
    expect(gpx?.match(/<trkpt/g)).toHaveLength(10);
    expect(gpx).toContain('<name>Alpine Loop</name>');
  });

  it('places POIs at their route distance and ignores split markers', () => {
    const gpx = buildRouteGpx({ points: routePointsAlong(10), markers, metadata: meta });
    const wpts = gpx?.match(/<wpt[\s\S]*?<\/wpt>/g) ?? [];
    expect(wpts).toEqual([
      '<wpt lat="47.001500" lon="11.001500">\n<ele>601.5</ele>\n<name>Fountain</name>\n</wpt>',
      '<wpt lat="47.004000" lon="11.004000">\n<ele>604.0</ele>\n<name>Hut</name>\n<desc>Closed Mondays</desc>\n</wpt>',
    ]);
  });

  it('keeps one track segment per source segment', () => {
    const points = routePointsAlong(6).map((p, i) => ({ ...p, seg: Math.floor(i / 3) }));
    const gpx = buildRouteGpx({ points, markers: [], metadata: meta });
    expect(gpx?.match(/<trkseg>/g)).toHaveLength(2);
  });
});

describe(buildRouteSegmentGpx.name, () => {
  const meta = { name: 'Alpine Loop - segment 2', time: new Date(1700000000000) };

  it('keeps only the POIs inside the segment', () => {
    const gpx = buildRouteSegmentGpx({
      points: routePointsAlong(10),
      markers,
      startM: 3500,
      endM: 6000,
      metadata: meta,
    });
    const names = gpx
      ?.match(/<wpt[\s\S]*?<\/wpt>/g)
      ?.map((w) => w.match(/<name>(.*)<\/name>/)?.[1]);
    expect(names).toEqual(['Hut']);
  });

  it('export filters points instead of cutting at the split', () => {
    const gpx = buildRouteSegmentGpx({
      points: routePointsAlong(10),
      markers: [],
      startM: 3500,
      endM: 6000,
      metadata: meta,
    });
    const trkpts = gpx?.match(/<trkpt[\s\S]*?<\/trkpt>/g) ?? [];
    expect(trkpts).toHaveLength(4);
    expect(trkpts[0]).toContain('lat="47.003500" lon="11.003500"');
    expect(trkpts[0]).toContain('<ele>603.5</ele>');
    expect(trkpts[0]).toContain('<time>2023-11-14T22:16:50.000Z</time>');
    expect(trkpts[3]).toContain('<time>2023-11-14T22:19:20.000Z</time>');
    expect(gpx).toContain('Alpine Loop - segment 2');
  });

  it('exports no <time> for points that never had one', () => {
    const points = routePointsAlong(10).map((p) => ({ ...p, time: undefined }));
    const gpx = buildRouteSegmentGpx({
      points,
      markers: [],
      startM: 3500,
      endM: 6000,
      metadata: meta,
    });
    expect(gpx).not.toBeNull();
    expect(gpx).not.toContain('<trkpt lat="47.003500" lon="11.003500">\n<ele>603.5</ele>\n<time>');
    expect((gpx?.match(/<time>/g) ?? []).length).toBe(1);
  });

  it('returns null when the slice has fewer than two points', () => {
    expect(
      buildRouteSegmentGpx({
        points: routePointsAlong(10),
        markers: [],
        startM: 3000,
        endM: 3000,
        metadata: meta,
      }),
    ).toBeNull();
  });
});

describe(buildGpxFilename.name, () => {
  it('formats filename with capitalized sport and ISO date', () => {
    const filename = buildGpxFilename({ sport: 'running', dateMs: 1700000000000 });
    expect(filename).toBe('PaceVault_Running_2023-11-14.gpx');
  });

  it('capitalizes first letter of sport', () => {
    const filename = buildGpxFilename({ sport: 'cycling', dateMs: 1700000000000 });
    expect(filename).toBe('PaceVault_Cycling_2023-11-14.gpx');
  });
});
