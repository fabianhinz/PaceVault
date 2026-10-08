import { describe, it, expect } from 'vitest';
import { buildSessionGpx, buildRouteSegmentGpx } from '@/lib/gpxExport.ts';
import { buildGpxFilename } from '@/packages/gpx/buildGpx.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';
import { makeGPSRunningRecords, makeIndoorRecords } from '../factories/gps.ts';
import { makeSession } from '../factories/sessions.ts';

const routePoints = (count: number): RoutePoint[] =>
  Array.from({ length: count }, (_, i) => ({
    lat: 47 + i * 0.001,
    lng: 11 + i * 0.001,
    ele: 600 + i,
    seg: 0,
    dist: i * 1000,
    time: 1700000000000 + i * 60_000,
  }));

describe('buildSessionGpx', () => {
  it('produces valid GPX from GPS records', () => {
    const session = makeSession({ id: 'test-1', name: 'Morning Run', date: 1700000000000 });
    const records = makeGPSRunningRecords(10);
    const gpx = buildSessionGpx(session, records);

    expect(gpx).not.toBeNull();
    expect(gpx).toContain('<?xml');
    expect(gpx).toContain('<gpx');
    expect(gpx).toContain('<trkpt');
    expect(gpx).toContain('<ele>');
    expect(gpx).toContain('<time>');
    expect(gpx).toContain('Morning Run');
  });

  it('exports every recorded GPS point instead of a simplified track', () => {
    const session = makeSession({ id: 'test-full', date: 1700000000000 });
    const records = makeGPSRunningRecords(200);
    const gpx = buildSessionGpx(session, records);
    expect((gpx?.match(/<trkpt/g) ?? []).length).toBe(200);
  });

  it('returns null for indoor records with no GPS', () => {
    const session = makeSession({ id: 'test-2' });
    const records = makeIndoorRecords(50);
    const gpx = buildSessionGpx(session, records);

    expect(gpx).toBeNull();
  });

  it('returns null when fewer than 2 valid GPS points', () => {
    const session = makeSession({ id: 'test-3' });
    const records = makeGPSRunningRecords(1);
    const gpx = buildSessionGpx(session, records);

    expect(gpx).toBeNull();
  });

  it('filters out records with invalid coordinates', () => {
    const session = makeSession({ id: 'test-4', date: 1700000000000 });
    const validRecords = makeGPSRunningRecords(5);
    const invalidRecords = [
      { sessionId: 'test-4', timestamp: 100, lat: undefined, lng: undefined },
      { sessionId: 'test-4', timestamp: 101, lat: 999, lng: 999 },
    ];
    const mixed = [...validRecords, ...invalidRecords];
    const gpx = buildSessionGpx(session, mixed);

    expect(gpx).not.toBeNull();
    const trkptCount = (gpx?.match(/<trkpt/g) ?? []).length;
    expect(trkptCount).toBe(5);
  });

  it('returns null for empty records', () => {
    const session = makeSession({ id: 'test-5' });
    const gpx = buildSessionGpx(session, []);

    expect(gpx).toBeNull();
  });
});

describe('buildRouteSegmentGpx', () => {
  const meta = { name: 'Alpine Loop - segment 2', time: new Date(1700000000000) };

  it('export filters points instead of cutting at the split', () => {
    const gpx = buildRouteSegmentGpx(routePoints(10), 3500, 6000, meta);
    const trkpts = gpx?.match(/<trkpt[\s\S]*?<\/trkpt>/g) ?? [];
    expect(trkpts).toHaveLength(4);
    expect(trkpts[0]).toContain('lat="47.003500" lon="11.003500"');
    expect(trkpts[0]).toContain('<ele>603.5</ele>');
    expect(trkpts[0]).toContain('<time>2023-11-14T22:16:50.000Z</time>');
    expect(trkpts[3]).toContain('<time>2023-11-14T22:19:20.000Z</time>');
    expect(gpx).toContain('Alpine Loop - segment 2');
  });

  it('exports no <time> for points that never had one', () => {
    const points = routePoints(10).map((p) => ({ ...p, time: undefined }));
    const gpx = buildRouteSegmentGpx(points, 3500, 6000, meta);
    expect(gpx).not.toBeNull();
    expect(gpx).not.toContain('<trkpt lat="47.003500" lon="11.003500">\n<ele>603.5</ele>\n<time>');
    expect((gpx?.match(/<time>/g) ?? []).length).toBe(1);
  });

  it('returns null when the slice has fewer than two points', () => {
    expect(buildRouteSegmentGpx(routePoints(10), 3000, 3000, meta)).toBeNull();
  });
});

describe('buildGpxFilename', () => {
  it('formats filename with capitalized sport and ISO date', () => {
    const filename = buildGpxFilename('running', 1700000000000);
    expect(filename).toBe('PaceVault_Running_2023-11-14.gpx');
  });

  it('capitalizes first letter of sport', () => {
    const filename = buildGpxFilename('cycling', 1700000000000);
    expect(filename).toBe('PaceVault_Cycling_2023-11-14.gpx');
  });
});
