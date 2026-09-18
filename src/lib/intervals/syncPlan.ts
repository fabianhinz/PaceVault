import type { IntervalsActivity } from './intervalsSchemas.ts';

type SkipReason = 'already-imported' | 'stub-source' | 'no-file' | 'unsupported-type';

export interface SyncCandidate {
  id: string;
  name?: string;
  type?: string;
  fileType?: string;
}

interface SkippedActivity {
  candidate: SyncCandidate;
  reason: SkipReason;
}

interface SyncPlan {
  toImport: SyncCandidate[];
  skipped: SkippedActivity[];
  totalListed: number;
}

interface SyncPlanInput {
  listing: IntervalsActivity[];
  knownActivityIds: string[];
  limit?: number;
}

const IMPORTABLE_TYPE_SUFFIXES = ['ride', 'run'];

const IMPORTABLE_TYPE_EXTRAS = new Set(['cyclocross', 'handcycle', 'velomobile', 'treadmill']);

export const isStubActivity = (activity: IntervalsActivity): boolean => {
  if (activity.source === 'STRAVA') return true;
  if (activity._note != null) return true;
  return false;
};

export const isImportableType = (type: string | null | undefined): boolean => {
  if (type == null) return true;

  const normalized = type.trim().toLowerCase();
  if (normalized === '') return true;
  if (IMPORTABLE_TYPE_EXTRAS.has(normalized)) return true;

  for (const suffix of IMPORTABLE_TYPE_SUFFIXES) {
    if (normalized.endsWith(suffix)) return true;
  }
  return false;
};

export const preferOriginalFile = (fileType: string | null | undefined): boolean => {
  if (fileType == null) return false;
  return fileType.trim().toLowerCase() === 'fit';
};

const toCandidate = (activity: IntervalsActivity): SyncCandidate => {
  const candidate: SyncCandidate = { id: activity.id };
  if (activity.name != null) candidate.name = activity.name;
  if (activity.type != null) candidate.type = activity.type;
  if (activity.file_type != null) candidate.fileType = activity.file_type;
  return candidate;
};

const classify = (activity: IntervalsActivity, knownIds: Set<string>): SkipReason | undefined => {
  if (knownIds.has(activity.id)) return 'already-imported';
  if (isStubActivity(activity)) return 'stub-source';
  if (activity.file_type == null && activity.source === 'MANUAL') return 'no-file';
  if (!isImportableType(activity.type)) return 'unsupported-type';
  return undefined;
};

export const buildSyncPlan = (input: SyncPlanInput): SyncPlan => {
  const knownIds = new Set(input.knownActivityIds);

  const toImport: SyncCandidate[] = [];
  const skipped: SkippedActivity[] = [];

  for (const activity of input.listing) {
    const candidate = toCandidate(activity);
    const reason = classify(activity, knownIds);

    if (reason === undefined) {
      toImport.push(candidate);
    } else {
      skipped.push({ candidate, reason });
    }
  }

  let limited = toImport;
  if (input.limit !== undefined && input.limit < toImport.length) {
    limited = toImport.slice(0, input.limit);
  }

  return { toImport: limited, skipped, totalListed: input.listing.length };
};

export const countSkipReasons = (plan: SyncPlan): Record<SkipReason, number> => {
  const counts: Record<SkipReason, number> = {
    'already-imported': 0,
    'stub-source': 0,
    'no-file': 0,
    'unsupported-type': 0,
  };
  for (const entry of plan.skipped) {
    counts[entry.reason]++;
  }
  return counts;
};
