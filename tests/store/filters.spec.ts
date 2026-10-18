import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { migrateFilters, useFiltersStore } from '@/store/filters.ts';
import { type FilterCriteria, emptyCriteria } from '@/lib/savedFilters.ts';

const criteria = (overrides: Partial<FilterCriteria>): FilterCriteria => ({
  ...emptyCriteria(),
  ...overrides,
});

const store = () => useFiltersStore.getState();
const savedCriteria = () => store().savedFilters.map((f) => f.criteria);

const runLast30 = criteria({
  sport: 'running',
  time: { kind: 'relative', amount: 30, unit: 'day' },
});

describe('useFiltersStore', () => {
  beforeEach(() => {
    store().resetFilters();
  });

  it('seeds last 7 days, last 30 days and this year', () => {
    expect(savedCriteria()).toEqual([
      criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } }),
      criteria({ time: { kind: 'relative', amount: 30, unit: 'day' } }),
      criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }),
    ]);
    expect(store().activeFilter).toBeNull();
  });

  it('applies a saved filter and clears it when picked again', () => {
    const id = store().savedFilters[0]?.id ?? '';
    store().toggleSavedFilter(id);
    expect(store().activeFilter).toEqual(savedCriteria()[0]);
    store().toggleSavedFilter(id);
    expect(store().activeFilter).toBeNull();
  });

  it('saves a new filter at the top and applies it', () => {
    store().saveBuilderFilter(runLast30);
    expect(savedCriteria()).toHaveLength(4);
    expect(savedCriteria()[0]).toEqual(runLast30);
    expect(store().activeFilter).toEqual(runLast30);
  });

  it('drops the oldest filter when a 16th is saved', () => {
    const thisYear = criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } });
    for (let days = 1; days <= 12; days++) {
      store().saveBuilderFilter(
        criteria({ sport: 'running', time: { kind: 'relative', amount: days, unit: 'day' } }),
      );
    }
    expect(savedCriteria()).toHaveLength(15);
    expect(savedCriteria()[14]).toEqual(thisYear);
    store().saveBuilderFilter(runLast30);
    expect(savedCriteria()).toHaveLength(15);
    expect(savedCriteria()[0]).toEqual(runLast30);
    expect(savedCriteria()).not.toContainEqual(thisYear);
    expect(savedCriteria()[14]).toEqual(
      criteria({ time: { kind: 'relative', amount: 30, unit: 'day' } }),
    );
  });

  it('selects an existing filter without moving or duplicating it', () => {
    const before = store().savedFilters;
    const last30 = criteria({ time: { kind: 'relative', amount: 30, unit: 'day' } });
    store().saveBuilderFilter(last30);
    expect(store().savedFilters).toEqual(before);
    expect(store().activeFilter).toEqual(last30);
  });

  it('zooms the active filter to a chart range', () => {
    store().saveBuilderFilter(runLast30);
    store().setDashboardChartRange('2026-01-05', '2026-01-18');
    store().setDashboardChartRange('2026-01-08', '2026-01-12');
    expect(store().activeFilter).toEqual(
      criteria({
        sport: 'running',
        time: { kind: 'range', from: '2026-01-08', to: '2026-01-12', source: 'zoom' },
      }),
    );
  });

  it('clearing the zoom does not bring back the filter that was active before zooming', () => {
    store().saveBuilderFilter(runLast30);
    store().setDashboardChartRange('2026-01-05', '2026-01-18');
    store().clearActiveFilter();
    expect(store().activeFilter).toBeNull();
    store().setDashboardChartRange('2026-01-08', '2026-01-12');
    expect(store().activeFilter).toEqual(
      criteria({ time: { kind: 'range', from: '2026-01-08', to: '2026-01-12', source: 'zoom' } }),
    );
  });

  it('persists saved and active filters', () => {
    const options = useFiltersStore.persist.getOptions();
    if (!options.partialize) {
      throw new Error('partialize missing');
    }
    const persisted = options.partialize(store());
    expect(persisted).toHaveProperty('savedFilters');
    expect(persisted).toHaveProperty('activeFilter');
    expect(persisted).toHaveProperty('loadChartGroupBy');
    expect(persisted).toHaveProperty('volumeChartMetric');
  });
});

describe('migrateFilters', () => {
  it('drops the v2 sport, range and attribute state, keeps the load grouping and seeds the default filters', () => {
    const migrated = migrateFilters(
      {
        timeRange: 'custom',
        customRange: { from: '2025-01-01', to: '2025-01-31' },
        prevDashboardRange: '30d',
        sportFilter: 'cycling',
        attributeFilters: { duration: 3600, distance: null, elevationGain: null },
        loadChartShowSportColors: false,
        loadChartGroupBy: 'day',
      },
      2,
    );
    expect(Object.keys(migrated).toSorted()).toEqual([
      'activeFilter',
      'loadChartGroupBy',
      'savedFilters',
      'volumeChartMetric',
    ]);
    expect(migrated.savedFilters.map((f) => f.criteria)).toEqual([
      criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } }),
      criteria({ time: { kind: 'relative', amount: 30, unit: 'day' } }),
      criteria({ time: { kind: 'calendarYear', yearsAgo: 0 } }),
    ]);
    expect(migrated.activeFilter).toBeNull();
    expect(migrated.loadChartGroupBy).toBe('day');
    expect(migrated.volumeChartMetric).toBe('distance');
  });

  it('gives v1 state the chart defaults', () => {
    const migrated = migrateFilters({ timeRange: '7d', sportFilter: 'all' }, 1);
    expect(migrated.loadChartGroupBy).toBe('week');
    expect(migrated.volumeChartMetric).toBe('distance');
    expect(migrated.savedFilters).toHaveLength(3);
  });

  it('falls back to defaults for unrecognised state', () => {
    for (const fromVersion of [2, 3]) {
      for (const state of [null, 'broken', { loadChartGroupBy: 'year' }]) {
        const migrated = migrateFilters(state, fromVersion);
        expect(migrated.savedFilters).toHaveLength(3);
        expect(migrated.activeFilter).toBeNull();
        expect(migrated.loadChartGroupBy).toBe('week');
        expect(migrated.volumeChartMetric).toBe('distance');
      }
    }
  });

  it('v3 keeps saved filters and adds an empty name', () => {
    const v3Run = {
      sport: 'running',
      time: { kind: 'relative', amount: 30, unit: 'day' },
      distance: 10000,
      duration: null,
      elevationGain: null,
    };
    const migrated = migrateFilters(
      {
        savedFilters: [
          { id: 'a', criteria: v3Run },
          { id: 'b', criteria: { sport: 'swimming', time: null } },
          {
            id: 'c',
            criteria: {
              sport: null,
              time: { kind: 'range', from: '2025-01-01', to: '2025-12-31', source: 'year' },
              distance: null,
              duration: null,
              elevationGain: 1000,
            },
          },
        ],
        activeFilter: v3Run,
        loadChartGroupBy: 'month',
        volumeChartMetric: 'elevation',
      },
      3,
    );
    expect(migrated.savedFilters).toEqual([
      { id: 'a', criteria: { ...v3Run, name: null } },
      {
        id: 'c',
        criteria: criteria({
          time: { kind: 'range', from: '2025-01-01', to: '2025-12-31', source: 'year' },
          elevationGain: 1000,
        }),
      },
    ]);
    expect(migrated.activeFilter).toEqual({ ...v3Run, name: null });
    expect(migrated.loadChartGroupBy).toBe('month');
    expect(migrated.volumeChartMetric).toBe('elevation');
  });

  it('v3 "last year" becomes the rolling 365 days', () => {
    const lastYear = {
      sport: null,
      time: { kind: 'calendarYear', yearsAgo: 1 },
      distance: null,
      duration: null,
      elevationGain: null,
    };
    const rolling = criteria({ time: { kind: 'relative', amount: 365, unit: 'day' } });
    const migrated = migrateFilters(
      {
        savedFilters: [
          { id: 'a', criteria: lastYear },
          { id: 'b', criteria: { ...rolling, name: undefined } },
        ],
        activeFilter: lastYear,
        volumeChartMetric: 'distance',
      },
      3,
    );
    expect(migrated.savedFilters).toEqual([{ id: 'a', criteria: rolling }]);
    expect(migrated.activeFilter).toEqual(rolling);
  });
});
