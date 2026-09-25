import { describe, it, expect, beforeEach } from 'vitest';
import { useFiltersStore } from '@/store/filters.ts';
import { createEmptyAttributeFilters } from '@/lib/attributeFilters.ts';

describe('useFiltersStore', () => {
  beforeEach(() => {
    useFiltersStore.setState({
      timeRange: '90d',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
      attributeFilters: createEmptyAttributeFilters(),
      loadChartShowSportColors: false,
      loadChartGroupBy: 'week',
    });
  });

  it('has correct default state', () => {
    const state = useFiltersStore.getState();
    expect(state.timeRange).toBe('90d');
    expect(state.sportFilter).toBe('all');
    expect(state.attributeFilters).toEqual({ duration: null, distance: null, elevationGain: null });
  });

  it('updates time range', () => {
    useFiltersStore.getState().setTimeRange('7d');
    expect(useFiltersStore.getState().timeRange).toBe('7d');
  });

  it('updates sport filter', () => {
    useFiltersStore.getState().setSportFilter('cycling');
    expect(useFiltersStore.getState().sportFilter).toBe('cycling');
  });

  describe('attribute filters', () => {
    it('sets attribute filters', () => {
      useFiltersStore
        .getState()
        .setAttributeFilters({ duration: 3600, distance: 10000, elevationGain: 500 });
      expect(useFiltersStore.getState().attributeFilters).toEqual({
        duration: 3600,
        distance: 10000,
        elevationGain: 500,
      });
    });

    it('sanitizes invalid targets to null', () => {
      useFiltersStore
        .getState()
        .setAttributeFilters({ duration: -5, distance: NaN, elevationGain: 0 });
      expect(useFiltersStore.getState().attributeFilters).toEqual({
        duration: null,
        distance: null,
        elevationGain: null,
      });
    });

    it('clears attribute filters', () => {
      useFiltersStore.setState({
        attributeFilters: { duration: 3600, distance: 10000, elevationGain: 500 },
      });
      useFiltersStore.getState().clearAttributeFilters();
      expect(useFiltersStore.getState().attributeFilters).toEqual({
        duration: null,
        distance: null,
        elevationGain: null,
      });
    });

    it('persists attribute filters', () => {
      const options = useFiltersStore.persist.getOptions();
      if (!options.partialize) {
        throw new Error('partialize missing');
      }
      const persisted = options.partialize(useFiltersStore.getState());
      expect(persisted).toHaveProperty('attributeFilters');
    });
  });

  describe('load chart preferences', () => {
    it('defaults sport colors off and grouping to week', () => {
      const state = useFiltersStore.getState();
      expect(state.loadChartShowSportColors).toBe(false);
      expect(state.loadChartGroupBy).toBe('week');
    });

    it('updates grouping to day', () => {
      useFiltersStore.getState().setLoadChartGroupBy('day');
      expect(useFiltersStore.getState().loadChartGroupBy).toBe('day');
    });

    it('toggles sport colors', () => {
      useFiltersStore.getState().setLoadChartShowSportColors(true);
      expect(useFiltersStore.getState().loadChartShowSportColors).toBe(true);
    });

    it('updates grouping', () => {
      useFiltersStore.getState().setLoadChartGroupBy('week');
      expect(useFiltersStore.getState().loadChartGroupBy).toBe('week');
    });

    it('persists load chart preferences', () => {
      const options = useFiltersStore.persist.getOptions();
      if (!options.partialize) {
        throw new Error('partialize missing');
      }
      const persisted = options.partialize(useFiltersStore.getState());
      expect(persisted).toHaveProperty('loadChartShowSportColors');
      expect(persisted).toHaveProperty('loadChartGroupBy');
    });
  });

  describe('setDashboardChartRange', () => {
    it('sets custom range and switches to custom timeRange', () => {
      useFiltersStore.getState().setDashboardChartRange('2025-01-01', '2025-01-31');
      const state = useFiltersStore.getState();
      expect(state.timeRange).toBe('custom');
      expect(state.customRange).toEqual({ from: '2025-01-01', to: '2025-01-31' });
    });

    it('saves previous time range on first zoom', () => {
      useFiltersStore.setState({ timeRange: '30d' });
      useFiltersStore.getState().setDashboardChartRange('2025-01-01', '2025-01-15');
      expect(useFiltersStore.getState().prevDashboardRange).toBe('30d');
    });

    it('preserves previous time range on subsequent zooms', () => {
      useFiltersStore.setState({ timeRange: '30d' });
      useFiltersStore.getState().setDashboardChartRange('2025-01-01', '2025-01-15');
      useFiltersStore.getState().setDashboardChartRange('2025-01-05', '2025-01-10');
      expect(useFiltersStore.getState().prevDashboardRange).toBe('30d');
    });
  });

  describe('clearDashboardChartRange', () => {
    it('restores previous time range', () => {
      useFiltersStore.setState({ timeRange: '30d' });
      useFiltersStore.getState().setDashboardChartRange('2025-01-01', '2025-01-15');
      useFiltersStore.getState().clearDashboardChartRange();
      const state = useFiltersStore.getState();
      expect(state.timeRange).toBe('30d');
      expect(state.customRange).toBeNull();
      expect(state.prevDashboardRange).toBeNull();
    });

    it('falls back to 90d when no previous range', () => {
      useFiltersStore.setState({
        timeRange: 'custom',
        customRange: { from: '2025-01-01', to: '2025-01-15' },
        prevDashboardRange: null,
      });
      useFiltersStore.getState().clearDashboardChartRange();
      expect(useFiltersStore.getState().timeRange).toBe('90d');
    });
  });
});
