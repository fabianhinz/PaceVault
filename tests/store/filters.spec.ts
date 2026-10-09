import { describe, it, expect, beforeEach } from 'vitest';
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

  it('saves a new filter from the builder and applies it', () => {
    store().saveBuilderFilter(runLast30, null);
    expect(savedCriteria()).toHaveLength(4);
    expect(savedCriteria()[3]).toEqual(runLast30);
    expect(store().activeFilter).toEqual(runLast30);
  });

  it('selects an identical filter instead of saving it twice', () => {
    const last7 = criteria({ time: { kind: 'relative', amount: 7, unit: 'day' } });
    store().saveBuilderFilter(last7, null);
    expect(savedCriteria()).toHaveLength(3);
    expect(store().activeFilter).toEqual(last7);
  });

  it('replaces an edited filter in place', () => {
    const edited = store().savedFilters[1];
    store().saveBuilderFilter(runLast30, edited?.id ?? null);
    expect(store().savedFilters[1]).toEqual({ id: edited?.id, criteria: runLast30 });
    expect(savedCriteria()).toHaveLength(3);
  });

  it('deletes a filter and clears it when it was active', () => {
    const first = store().savedFilters[0];
    store().toggleSavedFilter(first?.id ?? '');
    store().deleteSavedFilter(first?.id ?? '');
    expect(savedCriteria()).toHaveLength(2);
    expect(store().activeFilter).toBeNull();
  });

  it('zooms the active filter to a chart range and restores its time on reset', () => {
    store().saveBuilderFilter(runLast30, null);
    store().setDashboardChartRange('2026-01-05', '2026-01-18');
    store().setDashboardChartRange('2026-01-08', '2026-01-12');
    expect(store().activeFilter).toEqual(
      criteria({
        sport: 'running',
        time: { kind: 'range', from: '2026-01-08', to: '2026-01-12', source: 'zoom' },
      }),
    );
    store().clearDashboardChartRange();
    expect(store().activeFilter).toEqual(runLast30);
  });

  it('clears the active filter when a reset zoom leaves nothing', () => {
    store().setDashboardChartRange('2026-01-05', '2026-01-18');
    store().clearDashboardChartRange();
    expect(store().activeFilter).toBeNull();
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
  it('drops the v2 sport, range and attribute state and keeps the load grouping', () => {
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
    expect(migrated.activeFilter).toBeNull();
    expect(migrated.zoomRestoreTime).toBeNull();
    expect(migrated.savedFilters).toHaveLength(3);
    expect(migrated.loadChartGroupBy).toBe('day');
    expect(migrated.volumeChartMetric).toBe('distance');
    expect(migrated).not.toHaveProperty('sportFilter');
    expect(migrated).not.toHaveProperty('loadChartShowSportColors');
  });

  it('keeps v3 saved and active filters, drops the sport colour switch and defaults the volume metric', () => {
    const saved = [{ id: 'a', criteria: runLast30 }];
    const zoomed = criteria({
      sport: 'running',
      time: { kind: 'range', from: '2026-01-08', to: '2026-01-12', source: 'zoom' },
    });
    const migrated = migrateFilters(
      {
        savedFilters: saved,
        activeFilter: zoomed,
        zoomRestoreTime: runLast30.time,
        loadChartShowSportColors: false,
        loadChartGroupBy: 'month',
      },
      3,
    );
    expect(migrated).toEqual({
      savedFilters: saved,
      activeFilter: zoomed,
      zoomRestoreTime: runLast30.time,
      loadChartGroupBy: 'month',
      volumeChartMetric: 'distance',
    });
  });

  it('falls back to default filters when v3 filters are unrecognised', () => {
    const migrated = migrateFilters(
      {
        savedFilters: [{ id: 'a', criteria: { sport: 'swimming' } }],
        activeFilter: null,
        zoomRestoreTime: null,
        loadChartGroupBy: 'day',
      },
      3,
    );
    expect(migrated.savedFilters).toHaveLength(3);
    expect(migrated.activeFilter).toBeNull();
    expect(migrated.loadChartGroupBy).toBe('day');
  });

  it('gives v1 state the chart defaults', () => {
    const migrated = migrateFilters({ timeRange: '7d', sportFilter: 'all' }, 1);
    expect(migrated.loadChartGroupBy).toBe('week');
    expect(migrated.volumeChartMetric).toBe('distance');
    expect(migrated.savedFilters).toHaveLength(3);
  });

  it('falls back to defaults for unrecognised state', () => {
    for (const state of [null, 'broken', { loadChartGroupBy: 'year' }]) {
      const migrated = migrateFilters(state, 3);
      expect(migrated.savedFilters).toHaveLength(3);
      expect(migrated.activeFilter).toBeNull();
      expect(migrated.loadChartGroupBy).toBe('week');
    }
  });
});
