import { describe, it, expect } from 'vitest';
import { METRIC_EXPLANATIONS, type MetricId, type MetricExplanation } from '@/lib/explanations.ts';

const ALL_METRIC_IDS: MetricId[] = [
  'tss',
  'trimp',
  'duration',
  'tripLoad',
  'ctl',
  'atl',
  'tsb',
  'acwr',
  'normalizedPower',
  'gradeAdjustedPace',
  'recovery',
  'pacingTrend',
  'trainingZones',
  'aerobicTE',
  'anaerobicTE',
  'avgHr',
  'avgPace',
  'avgSpeed',
  'avgPower',
  'elevation',
  'cadence',
  'vdot',
];

const REQUIRED_FIELDS: (keyof MetricExplanation)[] = [
  'shortLabel',
  'friendlyName',
  'oneLiner',
  'range',
  'sports',
];

const VALID_SPORTS = ['running', 'cycling', 'all'] as const;

describe('Metric Explanation Registry', () => {
  it('has an entry for every MetricId', () => {
    for (const id of ALL_METRIC_IDS) {
      expect(METRIC_EXPLANATIONS[id], `Missing explanation entry for "${id}"`).toBeDefined();
    }
  });

  it('has no extra keys beyond MetricId values', () => {
    const registryKeys = Object.keys(METRIC_EXPLANATIONS);
    expect(registryKeys.sort()).toEqual([...ALL_METRIC_IDS].sort());
  });

  it.each(ALL_METRIC_IDS)('"%s" has all required fields populated', (id) => {
    const entry = METRIC_EXPLANATIONS[id];
    for (const field of REQUIRED_FIELDS) {
      const value = entry[field];
      if (typeof value === 'string') {
        expect(value.length, `${id}.${field} is empty`).toBeGreaterThan(0);
      } else if (Array.isArray(value)) {
        expect(value.length, `${id}.${field} is empty array`).toBeGreaterThan(0);
      }
    }
  });

  it.each(ALL_METRIC_IDS)('"%s" id field matches its map key', (id) => {
    expect(METRIC_EXPLANATIONS[id].id).toBe(id);
  });

  it.each(ALL_METRIC_IDS)('"%s" sports array contains only valid values', (id) => {
    const entry = METRIC_EXPLANATIONS[id];
    for (const sport of entry.sports) {
      expect(VALID_SPORTS).toContain(sport);
    }
  });

  it('direct lookup returns the correct entry', () => {
    const explanation = METRIC_EXPLANATIONS['ctl'];
    expect(explanation.id).toBe('ctl');
    expect(explanation.friendlyName).toBe('Fitness');
  });
});
