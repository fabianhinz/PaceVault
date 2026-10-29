import { describe, it, expect } from 'vite-plus/test';
import {
  EXPLANATION_BY_METRIC,
  type MetricId,
  type MetricExplanation,
} from '@/components/metricLabel/explanations.ts';

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
      expect(EXPLANATION_BY_METRIC[id], `Missing explanation entry for "${id}"`).toBeDefined();
    }
  });

  it('has no extra keys beyond MetricId values', () => {
    const registryKeys = Object.keys(EXPLANATION_BY_METRIC);
    expect(registryKeys.sort()).toEqual([...ALL_METRIC_IDS].sort());
  });

  it.each(ALL_METRIC_IDS)('"%s" has all required fields populated', (id) => {
    const entry = EXPLANATION_BY_METRIC[id];
    for (const field of REQUIRED_FIELDS) {
      const value = entry[field];
      if (typeof value === 'string') {
        expect(value.length, `${id}.${field} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it.each(ALL_METRIC_IDS)('"%s" id field matches its map key', (id) => {
    expect(EXPLANATION_BY_METRIC[id].id).toBe(id);
  });

  it('direct lookup returns the correct entry', () => {
    const explanation = EXPLANATION_BY_METRIC['ctl'];
    expect(explanation.id).toBe('ctl');
    expect(explanation.friendlyName).toBe('Fitness');
  });
});
