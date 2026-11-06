import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { matchSegment } from '@/lib/analysis/segmentMatching.ts';
import {
  getSegmentPassesEntry,
  getSessionRecords,
  saveSegmentPassesEntry,
} from '@/lib/storage/db.ts';
import { segmentPasses, segmentReference, segmentTrack } from '@pacevault/engine/segments.ts';
import { reachesSegmentEnds } from '@/lib/analysis/segmentPrefilter.ts';
import { SEGMENT_MATCHER_VERSION, type SegmentMatchInput } from '@/lib/workers/segmentsContract.ts';
import type { SessionGPS, SessionRecord } from '@pacevault/engine/types.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import { createMockSessionGPS } from '@pacevault/testing/gps.ts';
import {
  createMockSegmentPass,
  createMockSegmentReferencePoint,
  createMockSegmentTrack,
} from '@pacevault/testing/segments.ts';
import {
  createMockSegmentPassesEntry,
  createMockSegmentSessionMeta,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/lib/storage/db.ts', () => ({
  getSegmentPassesEntry: vi.fn(),
  getSessionRecords: vi.fn(),
  saveSegmentPassesEntry: vi.fn(),
}));

vi.mock('@/lib/analysis/segmentPrefilter.ts', () => ({
  reachesSegmentEnds: vi.fn(),
}));

vi.mock('@pacevault/engine/segments.ts', () => ({
  segmentPasses: vi.fn(),
  segmentReference: vi.fn(),
  segmentTrack: vi.fn(),
}));

const NEAR = { minLat: 48, maxLat: 48.1, minLng: 11, maxLng: 11.1 };
const FAR = { minLat: 50, maxLat: 50.1, minLng: 9, maxLng: 9.1 };

const segment: SegmentMatchInput = {
  segmentId: 'segment-1',
  sport: 'running',
  bounds: NEAR,
  source: { sessionId: 'source', startSec: 3, endSec: 6 },
};

const source = createMockSegmentSessionMeta({ sessionId: 'source' });
const other = createMockSegmentSessionMeta({ sessionId: 'other' });

const recordsOf = (): SessionRecord[] =>
  Array.from({ length: 10 }, (_, i) => createMockSessionRecord({ timestamp: i }));

const gpsOf = (entries: Array<[string, SessionGPS['bounds']]>): Map<string, SessionGPS> =>
  new Map(
    entries.map(([sessionId, bounds]) => [sessionId, createMockSessionGPS({ sessionId, bounds })]),
  );

const run = (options: {
  sessions: Array<ReturnType<typeof createMockSegmentSessionMeta>>;
  gps?: Map<string, SessionGPS>;
  ignoreCache?: boolean;
}) =>
  matchSegment({
    segment,
    sessions: options.sessions,
    gpsBySessionId:
      options.gps ??
      gpsOf(
        options.sessions.map((session): [string, SessionGPS['bounds']] => [
          session.sessionId,
          NEAR,
        ]),
      ),
    tracks: new Map(),
    ignoreCache: options.ignoreCache ?? false,
  });

const trackedSessionIds = (): string[] =>
  vi.mocked(segmentTrack).mock.calls.map((call) => call[0].sessionId);

describe(matchSegment.name, () => {
  beforeEach(() => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(undefined);
    vi.mocked(reachesSegmentEnds).mockReturnValue(true);
    vi.mocked(getSessionRecords).mockImplementation(() => Promise.resolve(recordsOf()));
    vi.mocked(saveSegmentPassesEntry).mockResolvedValue(undefined);
    vi.mocked(segmentReference).mockReturnValue([
      createMockSegmentReferencePoint(),
      createMockSegmentReferencePoint({ distanceMeters: 10 }),
    ]);
    vi.mocked(segmentTrack).mockImplementation((input) =>
      createMockSegmentTrack({ sessionId: input.sessionId }),
    );
    vi.mocked(segmentPasses).mockImplementation((input) =>
      input.tracks.map((track) => createMockSegmentPass({ sessionId: track.sessionId })),
    );
  });

  it('matches every candidate and saves the entry when nothing is cached', async () => {
    const match = await run({ sessions: [source, other] });

    expect(match.entry.passes.map((pass) => pass.sessionId)).toEqual(['source', 'other']);
    expect(match.entry.checkedSessionKeys).toEqual(['source@1', 'other@1']);
    expect(saveSegmentPassesEntry).toHaveBeenCalledWith(match.entry);
  });

  it('reads no records when the cached entry is current', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1', 'other@1'],
        passes: [createMockStoredSegmentPass({ sessionId: 'source' })],
      }),
    );

    const match = await run({ sessions: [source, other] });

    expect(getSessionRecords).not.toHaveBeenCalled();
    expect(saveSegmentPassesEntry).not.toHaveBeenCalled();
    expect(match.metrics.cache).toBe('hit');
  });

  it('matches only a newly imported session', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1'],
        passes: [createMockStoredSegmentPass({ sessionId: 'source' })],
      }),
    );

    const match = await run({ sessions: [source, other] });

    expect(trackedSessionIds()).toEqual(['other']);
    expect(match.entry.passes.map((pass) => pass.sessionId)).toEqual(['source', 'other']);
  });

  it('drops the pass of a deleted session without reading records', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1', 'other@1'],
        passes: [
          createMockStoredSegmentPass({ sessionId: 'source' }),
          createMockStoredSegmentPass({ sessionId: 'other' }),
        ],
      }),
    );

    const match = await run({ sessions: [source] });

    expect(getSessionRecords).not.toHaveBeenCalled();
    expect(match.entry.passes.map((pass) => pass.sessionId)).toEqual(['source']);
    expect(saveSegmentPassesEntry).toHaveBeenCalledWith(match.entry);
  });

  it('re-matches a reprocessed session', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1', 'other@1'],
        passes: [createMockStoredSegmentPass({ sessionId: 'source' })],
      }),
    );

    await run({
      sessions: [
        source,
        createMockSegmentSessionMeta({ sessionId: 'other', derivationVersion: 2 }),
      ],
    });

    expect(trackedSessionIds()).toEqual(['other']);
  });

  it('saves the entry when a reprocessed session swaps its key and its pass', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1', 'other@1'],
        passes: [
          createMockStoredSegmentPass({ sessionId: 'source' }),
          createMockStoredSegmentPass({ sessionId: 'other' }),
        ],
      }),
    );

    const match = await run({
      sessions: [
        source,
        createMockSegmentSessionMeta({ sessionId: 'other', derivationVersion: 2 }),
      ],
    });

    expect(match.entry.checkedSessionKeys).toEqual(['source@1', 'other@2']);
    expect(saveSegmentPassesEntry).toHaveBeenCalledWith(match.entry);
  });

  it('matches everything again when the source session was reprocessed', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1', 'other@1'],
      }),
    );

    const match = await run({
      sessions: [
        createMockSegmentSessionMeta({ sessionId: 'source', derivationVersion: 2 }),
        other,
      ],
    });

    expect(trackedSessionIds()).toEqual(['source', 'other']);
    expect(match.metrics.missReason).toBe('sourceSession');
  });

  it('matches everything again for another matcher version', async () => {
    vi.mocked(getSegmentPassesEntry).mockResolvedValue(
      createMockSegmentPassesEntry({
        matcherVersion: SEGMENT_MATCHER_VERSION + 1,
        sourceSessionKey: 'source@1',
        checkedSessionKeys: ['source@1', 'other@1'],
      }),
    );

    const match = await run({ sessions: [source, other] });

    expect(trackedSessionIds()).toEqual(['source', 'other']);
    expect(match.metrics.missReason).toBe('matcherVersion');
  });

  it('builds the reference from the source records between the cuts', async () => {
    await run({ sessions: [source] });

    expect(segmentReference).toHaveBeenCalledWith(recordsOf().slice(3, 7));
  });

  it('never reads a session outside the segment bounds', async () => {
    await run({
      sessions: [source, other],
      gps: gpsOf([
        ['source', NEAR],
        ['other', FAR],
      ]),
    });

    expect(getSessionRecords).not.toHaveBeenCalledWith('other');
  });

  it('never reads a session whose track misses the segment start or end', async () => {
    vi.mocked(reachesSegmentEnds).mockReturnValue(false);

    const match = await run({ sessions: [source, other] });

    expect(getSessionRecords).not.toHaveBeenCalledWith('other');
    expect(match.entry.checkedSessionKeys).toEqual(['source@1', 'other@1']);
  });

  it('stores the pass time as moving time without a timer pause', async () => {
    vi.mocked(getSessionRecords).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => {
        let pauseSec = 0;
        if (i >= 5) pauseSec = 300;
        return createMockSessionRecord({ timestamp: i + pauseSec, timerTime: i });
      }),
    );
    vi.mocked(segmentPasses).mockImplementation((input) =>
      input.tracks.map((track) =>
        createMockSegmentPass({
          sessionId: track.sessionId,
          startTimestampSec: 0,
          endTimestampSec: 309,
          durationSec: 309,
        }),
      ),
    );

    const match = await run({ sessions: [source] });

    expect(match.entry.passes.map((pass) => pass.movingSec)).toEqual([9]);
  });

  it('never reads a session of another sport', async () => {
    await run({
      sessions: [source, createMockSegmentSessionMeta({ sessionId: 'other', sport: 'cycling' })],
    });

    expect(getSessionRecords).not.toHaveBeenCalledWith('other');
  });

  it('returns an empty entry when the source records are missing', async () => {
    vi.mocked(getSessionRecords).mockResolvedValue([]);
    vi.mocked(segmentReference).mockReturnValue([]);

    const match = await run({ sessions: [source, other] });

    expect(match.entry.passes).toEqual([]);
    expect(match.entry.checkedSessionKeys).toEqual([]);
  });
});
