import { describe, expect, it } from 'vite-plus/test';
import { matchSegment, segmentMatchSessions } from '@/lib/analysis/segmentMatching.ts';
import { reprocessOutdatedSessions } from '@/lib/analysis/reprocessSessions.ts';
import { buildSessionGPS } from '@/lib/analysis/gpsTrack.ts';
import { bulkSaveSessionData } from '@/lib/storage/db.ts';
import { segmentDraft } from '@/components/segments/segmentCreation.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import type { SegmentMatchInput } from '@/lib/workers/segmentsContract.ts';
import type { SessionGPS, SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { SESSION_DERIVATION_VERSION } from '@pacevault/engine/sessionDerivation.ts';
import { gpsPathRecordSeries, type PathWaypoint } from '@pacevault/testing/series.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';

const NORTH_2_KM: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 2000 },
];

const RECORDS_BY_SESSION_ID: Record<string, SessionRecord[]> = {
  source: gpsPathRecordSeries({ path: NORTH_2_KM, speedMetersPerSec: 4 }),
  other: gpsPathRecordSeries({
    path: NORTH_2_KM,
    speedMetersPerSec: 5,
    jitter: { meters: 4, seed: 3 },
  }),
};

const outdatedSession = (id: string): TrainingSession =>
  createMockTrainingSession({
    id,
    sport: 'running',
    derivationVersion: 0,
    hasDetailedRecords: true,
    isPlanned: false,
    source: { kind: 'demo' },
  });

const storeSessions = async (sessions: TrainingSession[]) => {
  useSessionReprocessingStore.setState({ phase: 'running' });
  useSessionsStore.setState({ sessions });
  await guardedSessionsStorage.flush();
  useSessionReprocessingStore.setState({ phase: 'pending' });
};

const gpsBySessionId = (): Map<string, SessionGPS> =>
  new Map(
    Object.entries(RECORDS_BY_SESSION_ID).flatMap(([sessionId, records]) => {
      const gps = buildSessionGPS({ sessionId, records });
      if (gps === null) return [];
      return [[sessionId, gps]];
    }),
  );

const segmentInput = (): SegmentMatchInput => {
  const records = RECORDS_BY_SESSION_ID.source ?? [];
  const draft = segmentDraft({
    session: outdatedSession('source'),
    records,
    span: { startRecord: 0, endRecord: records.length - 1 },
    kind: 'session',
  });
  if (draft === null) throw new Error('no segment draft');
  return {
    segmentId: draft.id,
    sport: draft.sport,
    bounds: draft.bounds,
    source: { sessionId: 'source', startSec: draft.source.startSec, endSec: draft.source.endSec },
  };
};

const matchCurrentSessions = (segment: SegmentMatchInput) =>
  matchSegment({
    segment,
    sessions: segmentMatchSessions(useSessionsStore.getState().sessions),
    gpsBySessionId: gpsBySessionId(),
    tracks: new Map(),
    ignoreCache: false,
  });

describe(matchSegment.name, () => {
  it('re-matches reprocessed sessions under their new key and keeps their passes', async () => {
    useUserStore.setState({ profile: createMockUserProfile() });
    await bulkSaveSessionData(
      Object.entries(RECORDS_BY_SESSION_ID).map(([sessionId, records]) => ({
        sessionId,
        records,
        laps: [],
      })),
    );
    await storeSessions([outdatedSession('source'), outdatedSession('other')]);
    const segment = segmentInput();

    const before = await matchCurrentSessions(segment);
    await reprocessOutdatedSessions();
    const after = await matchCurrentSessions(segment);

    expect(before.entry.checkedSessionKeys.sort()).toEqual(['other@0', 'source@0']);
    expect(before.entry.passes.map((pass) => pass.sessionId).sort()).toEqual(['other', 'source']);
    expect(after.metrics.missReason).toBe('sourceSession');
    expect(after.metrics.sessionsChecked).toBe(2);
    expect(after.entry.checkedSessionKeys.sort()).toEqual([
      `other@${SESSION_DERIVATION_VERSION}`,
      `source@${SESSION_DERIVATION_VERSION}`,
    ]);
    expect(after.entry.passes.map((pass) => pass.sessionId).sort()).toEqual(['other', 'source']);
  });
});
