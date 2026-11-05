import { describe, expect, it } from 'vite-plus/test';
import {
  segmentDraft,
  similarSegment,
  suggestedSegmentName,
} from '@/components/segments/segmentCreation.ts';
import { recordSpanOfMinutes } from '@/components/sessions/charts/railRange.ts';
import type { PathWaypoint } from '@pacevault/testing/series.ts';
import { gpsPathRecordSeries } from '@pacevault/testing/series.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import { createMockSegment } from '@tests/factories/segments.ts';
import { decodeTrackForRendering } from '@/lib/analysis/gpsTrack.ts';

const session = createMockTrainingSession({ id: 'run', name: 'Morning Run', sport: 'running' });

const NORTH_2_KM: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 2000 },
];

const polylineOf = (path: PathWaypoint[]): string => {
  const records = gpsPathRecordSeries({ path, speedMetersPerSec: 4 });
  const draft = segmentDraft({
    session,
    records,
    span: { startRecord: 0, endRecord: records.length - 1 },
    kind: 'session',
  });
  if (draft === null) throw new Error('no draft');
  return draft.encodedPolyline;
};

const stored = createMockSegment({
  id: 'stored',
  sport: 'running',
  distanceMeters: 2000,
  encodedPolyline: polylineOf(NORTH_2_KM),
});

const draftOn = (options: { path: PathWaypoint[]; distanceMeters: number }) =>
  createMockSegment({
    id: 'draft',
    sport: 'running',
    distanceMeters: options.distanceMeters,
    encodedPolyline: polylineOf(options.path),
  });

describe(segmentDraft.name, () => {
  it('finds the record span of a moving-minute range', () => {
    const records = gpsPathRecordSeries({ path: NORTH_2_KM, speedMetersPerSec: 4 });

    expect(recordSpanOfMinutes({ records, range: { from: 1, to: 2 } })).toEqual({
      startRecord: 60,
      endRecord: 120,
    });
  });

  it("cuts at the span's first and last record timestamp", () => {
    const records = gpsPathRecordSeries({ path: NORTH_2_KM, speedMetersPerSec: 4 });

    const draft = segmentDraft({
      session,
      records,
      span: { startRecord: 60, endRecord: 120 },
      kind: 'range',
    });

    expect(draft?.source).toEqual({ sessionId: 'run', kind: 'range', startSec: 60, endSec: 120 });
  });

  it('gives a segment for a 40 m range', () => {
    const records = gpsPathRecordSeries({ path: NORTH_2_KM, speedMetersPerSec: 4 });

    const draft = segmentDraft({
      session,
      records,
      span: { startRecord: 0, endRecord: 10 },
      kind: 'range',
    });

    expect(draft?.distanceMeters).toBe(40);
  });

  it('keeps a position jump without distance out of the polyline and bounds (R26)', () => {
    const stretch = gpsPathRecordSeries({ path: NORTH_2_KM, speedMetersPerSec: 4 });
    const last = stretch[stretch.length - 1] ?? createMockSessionRecord();
    const farAway = createMockSessionRecord({
      timestamp: last.timestamp + 600,
      lat: 48.25,
      lng: 11.4,
      distance: last.distance,
    });
    const records = [...stretch, farAway];

    const draft = segmentDraft({
      session,
      records,
      span: { startRecord: 0, endRecord: records.length - 1 },
      kind: 'range',
    });
    const northernmost = Math.max(
      ...decodeTrackForRendering(draft?.encodedPolyline ?? '').map((point) => point[1]),
    );

    expect(northernmost).toBeLessThan(48.2);
    expect(draft?.bounds.maxLat).toBeLessThan(48.2);
    expect(draft?.distanceMeters).toBe(2000);
  });

  it('gives no segment below two GPS points', () => {
    const records = Array.from({ length: 20 }, (_, i) => createMockSessionRecord({ timestamp: i }));

    expect(
      segmentDraft({ session, records, span: { startRecord: 0, endRecord: 19 }, kind: 'range' }),
    ).toBe(null);
  });
});

describe(suggestedSegmentName.name, () => {
  it('names a range after the session and its kilometres', () => {
    expect(
      suggestedSegmentName({ session, kind: 'range', startMeters: 2100, endMeters: 3500 }),
    ).toBe('Morning Run · km 2.1–3.5');
  });

  it('names a whole session after the session', () => {
    expect(
      suggestedSegmentName({ session, kind: 'session', startMeters: 0, endMeters: 9000 }),
    ).toBe('Morning Run');
  });
});

describe(similarSegment.name, () => {
  it('finds a segment of the same sport with both ends 40 m off and 5 % longer', () => {
    const draft = draftOn({
      path: [
        { eastMeters: 40, northMeters: 0 },
        { eastMeters: 40, northMeters: 2000 },
      ],
      distanceMeters: 2100,
    });

    expect(similarSegment({ segment: draft, segments: [stored] })?.id).toBe('stored');
  });

  it('finds none with one end 60 m off on a 2 km segment', () => {
    const draft = draftOn({
      path: [
        { eastMeters: 60, northMeters: 0 },
        { eastMeters: 0, northMeters: 2000 },
      ],
      distanceMeters: 2000,
    });

    expect(similarSegment({ segment: draft, segments: [stored] })).toBe(undefined);
  });

  it('finds none when the ends are close but the length differs by 15 %', () => {
    const draft = draftOn({ path: NORTH_2_KM, distanceMeters: 2300 });

    expect(similarSegment({ segment: draft, segments: [stored] })).toBe(undefined);
  });

  it('finds none of another sport', () => {
    const ride = createMockSegment({
      id: 'ride',
      sport: 'cycling',
      distanceMeters: 2000,
      encodedPolyline: stored.encodedPolyline,
    });

    expect(
      similarSegment({
        segment: draftOn({ path: NORTH_2_KM, distanceMeters: 2000 }),
        segments: [ride],
      }),
    ).toBe(undefined);
  });

  it('finds none in the reverse direction', () => {
    const draft = draftOn({ path: [...NORTH_2_KM].reverse(), distanceMeters: 2000 });

    expect(similarSegment({ segment: draft, segments: [stored] })).toBe(undefined);
  });
});
