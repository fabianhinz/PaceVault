import { describe, it, expect } from 'vite-plus/test';
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
  'trainingZones',
  'aerobicTE',
  'anaerobicTE',
  'avgHr',
  'avgPace',
  'avgSpeed',
  'avgPower',
  'elevation',
  'vam',
  'cadence',
  'vdot',
  'calories',
  'movingTime',
  'decoupling',
  'intensityFactor',
  'variabilityIndex',
  'peakPower',
  'stepLength',
];

const REQUIRED_FIELDS: (keyof MetricExplanation)[] = [
  'shortLabel',
  'friendlyName',
  'oneLiner',
  'range',
];

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
      }
    }
  });

  it.each(ALL_METRIC_IDS)('"%s" id field matches its map key', (id) => {
    expect(METRIC_EXPLANATIONS[id].id).toBe(id);
  });

  it('direct lookup returns the correct entry', () => {
    const explanation = METRIC_EXPLANATIONS['ctl'];
    expect(explanation.id).toBe('ctl');
    expect(explanation.friendlyName).toBe('Fitness');
  });
});
