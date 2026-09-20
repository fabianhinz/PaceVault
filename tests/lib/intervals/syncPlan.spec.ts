import { describe, it, expect } from 'vitest';
import {
  buildSyncPlan,
  countSkipReasons,
  isImportableType,
  isStubActivity,
  preferOriginalFile,
} from '@/lib/intervals/syncPlan.ts';
import type { IntervalsActivity } from '@/lib/intervals/intervalsSchemas.ts';

const activity = (over: Partial<IntervalsActivity> & { id: string }): IntervalsActivity => ({
  name: 'Ride',
  type: 'Ride',
  sub_type: null,
  start_date_local: '2026-08-23T17:05:02',
  source: 'GARMIN_CONNECT',
  file_type: 'fit',
  moving_time: 3600,
  distance: 30000,
  icu_training_load: 80,
  ...over,
});

describe('isImportableType', () => {
  it('accepts every ride and run variant intervals.icu emits', () => {
    const types = [
      'Ride',
      'VirtualRide',
      'GravelRide',
      'MountainBikeRide',
      'EMountainBikeRide',
      'EBikeRide',
      'TrackRide',
      'Run',
      'TrailRun',
      'VirtualRun',
    ];
    for (const type of types) {
      expect(isImportableType(type), type).toBe(true);
    }
  });

  it('rejects sports PaceVault cannot parse', () => {
    const types = ['Swim', 'OpenWaterSwim', 'Walk', 'Hike', 'WeightTraining', 'Yoga', 'VirtualRow'];
    for (const type of types) {
      expect(isImportableType(type), type).toBe(false);
    }
  });

  it('accepts cycling types that do not end in Ride', () => {
    expect(isImportableType('Cyclocross')).toBe(true);
    expect(isImportableType('Handcycle')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isImportableType('trailrun')).toBe(true);
    expect(isImportableType('SWIM')).toBe(false);
  });

  it('attempts when the type is missing, rather than dropping data', () => {
    expect(isImportableType(null)).toBe(true);
    expect(isImportableType(undefined)).toBe(true);
    expect(isImportableType('')).toBe(true);
  });
});

describe('isStubActivity', () => {
  it('detects a Strava stub via source', () => {
    expect(isStubActivity(activity({ id: 'i1', source: 'STRAVA' }))).toBe(true);
  });

  it('does not treat a non-Strava activity as a stub', () => {
    expect(isStubActivity(activity({ id: 'i1', source: 'UPLOAD' }))).toBe(false);
    expect(isStubActivity(activity({ id: 'i1', source: null }))).toBe(false);
  });

  it('passes a normal activity', () => {
    expect(isStubActivity(activity({ id: 'i1' }))).toBe(false);
  });
});

describe('preferOriginalFile', () => {
  it('prefers the original only for FIT uploads', () => {
    expect(preferOriginalFile('fit')).toBe(true);
    expect(preferOriginalFile('FIT')).toBe(true);
    expect(preferOriginalFile('tcx')).toBe(false);
    expect(preferOriginalFile('gpx')).toBe(false);
    expect(preferOriginalFile(null)).toBe(false);
    expect(preferOriginalFile(undefined)).toBe(false);
  });
});

describe('buildSyncPlan', () => {
  it('skips already imported activities before anything else', () => {
    const plan = buildSyncPlan({
      listing: [activity({ id: 'i1' }), activity({ id: 'i2' })],
      knownActivityIds: ['i1'],
    });
    expect(plan.toImport.map((c) => c.id)).toEqual(['i2']);
    expect(plan.skipped).toEqual([
      {
        candidate: { id: 'i1', name: 'Ride', type: 'Ride', fileType: 'fit' },
        reason: 'already-imported',
      },
    ]);
  });

  it('skips Strava stubs, unsupported sports and manual entries without a file', () => {
    const plan = buildSyncPlan({
      listing: [
        activity({ id: 'i1' }),
        activity({ id: 'i2', source: 'STRAVA', name: null, type: null }),
        activity({ id: 'i3', type: 'Swim' }),
        activity({ id: 'i4', source: 'MANUAL', file_type: null }),
      ],
      knownActivityIds: [],
    });

    expect(plan.toImport.map((c) => c.id)).toEqual(['i1']);
    expect(countSkipReasons(plan)).toEqual({
      'already-imported': 0,
      'stub-source': 1,
      'no-file': 1,
      'unsupported-type': 1,
    });
    expect(plan.totalListed).toBe(4);
  });

  it('preserves the newest-first order the API returned', () => {
    const plan = buildSyncPlan({
      listing: [activity({ id: 'i3' }), activity({ id: 'i2' }), activity({ id: 'i1' })],
      knownActivityIds: [],
    });
    expect(plan.toImport.map((c) => c.id)).toEqual(['i3', 'i2', 'i1']);
  });

  it('truncates to the limit from the head', () => {
    const plan = buildSyncPlan({
      listing: [activity({ id: 'i3' }), activity({ id: 'i2' }), activity({ id: 'i1' })],
      knownActivityIds: [],
      limit: 2,
    });
    expect(plan.toImport.map((c) => c.id)).toEqual(['i3', 'i2']);
  });

  it('handles an empty listing', () => {
    const plan = buildSyncPlan({ listing: [], knownActivityIds: ['i1'] });
    expect(plan).toEqual({ toImport: [], skipped: [], totalListed: 0 });
  });

  it('omits absent optional fields from the candidate', () => {
    const plan = buildSyncPlan({
      listing: [activity({ id: 'i1', name: null, type: null, file_type: null })],
      knownActivityIds: [],
    });
    expect(plan.toImport[0]).toEqual({ id: 'i1' });
  });
});
