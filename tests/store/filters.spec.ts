import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { createEmptyAttributeFilters } from '@/lib/attributeFilters.ts';
import type { PersonalBest, Sport } from '@/packages/engine/types.ts';

vi.mock('@/lib/indexeddb.ts', () => ({
  getRecordsForSessions: vi.fn(),
}));

vi.mock('@/lib/records.ts', () => ({
  computePBsForSessions: vi.fn(),
  groupPBsBySport: vi.fn(),
}));

import { getRecordsForSessions } from '@/lib/indexeddb.ts';
import { computePBsForSessions, groupPBsBySport } from '@/lib/records.ts';

const mockedGetRecords = vi.mocked(getRecordsForSessions);
const mockedComputePBs = vi.mocked(computePBsForSessions);
const mockedGroupPBs = vi.mocked(groupPBsBySport);

describe('useFiltersStore', () => {
  beforeEach(() => {
    useFiltersStore.setState({
      timeRange: '90d',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
      attributeFilters: createEmptyAttributeFilters(),
      groupedPBs: { data: {}, loading: false },
    });
    useSessionsStore.setState({ sessions: [] });
    vi.clearAllMocks();
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

    it('triggers PB recomputation', () => {
      useSessionsStore.setState({ sessions: [makeSession({ id: 's-0' })] });
      mockedGetRecords.mockResolvedValue(new Map());
      mockedComputePBs.mockReturnValue([]);
      mockedGroupPBs.mockReturnValue({});

      useFiltersStore
        .getState()
        .setAttributeFilters({ duration: 3600, distance: null, elevationGain: null });

      expect(mockedGetRecords).toHaveBeenCalledWith(['s-0']);
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

    it('persists attribute filters but not groupedPBs', () => {
      const options = useFiltersStore.persist.getOptions();
      if (!options.partialize) {
        throw new Error('partialize missing');
      }
      const persisted = options.partialize(useFiltersStore.getState());
      expect(persisted).toHaveProperty('attributeFilters');
      expect(persisted).not.toHaveProperty('groupedPBs');
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

  describe('recomputePBs', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    const stubPBPipeline = (grouped: Partial<Record<Sport, PersonalBest[]>> = {}) => {
      mockedGetRecords.mockResolvedValue(new Map());
      mockedComputePBs.mockReturnValue([]);
      mockedGroupPBs.mockReturnValue(grouped);
    };

    it('populates groupedPBs on success', async () => {
      const pb: PersonalBest = {
        sport: 'cycling',
        category: 'peak-power',
        window: 5,
        value: 300,
        sessionId: 's-0',
        date: Date.now(),
      };
      useSessionsStore.setState({ sessions: [makeSession({ id: 's-0' })] });
      stubPBPipeline({ cycling: [pb] });

      await useFiltersStore.getState().recomputePBs();

      expect(useFiltersStore.getState().groupedPBs.loading).toBe(false);
      expect(useFiltersStore.getState().groupedPBs.data).toEqual({ cycling: [pb] });
      expect(mockedGetRecords).toHaveBeenCalledWith(['s-0']);
    });

    it('returns empty data when no sessions match the date range', async () => {
      useSessionsStore.setState({
        sessions: [makeSession({ id: 's-old', date: Date.now() - 365 * DAY_MS })],
      });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(useFiltersStore.getState().groupedPBs.data).toEqual({});
      expect(mockedGetRecords).not.toHaveBeenCalled();
    });

    it('filters sessions by sport', async () => {
      useSessionsStore.setState({
        sessions: [
          makeSession({ id: 'cyc', sport: 'cycling' }),
          makeSession({ id: 'run', sport: 'running' }),
        ],
      });
      useFiltersStore.setState({ sportFilter: 'cycling' });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).toHaveBeenCalledWith(['cyc']);
    });

    it('excludes planned sessions and sessions without records', async () => {
      useSessionsStore.setState({
        sessions: [
          makeSession({ id: 'valid' }),
          makeSession({ id: 'planned', isPlanned: true }),
          makeSession({ id: 'no-records', hasDetailedRecords: false }),
        ],
      });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).toHaveBeenCalledWith(['valid']);
    });

    it('respects custom date range', async () => {
      useSessionsStore.setState({
        sessions: [
          makeSession({ id: 'in', date: new Date('2026-01-15').getTime() }),
          makeSession({ id: 'out', date: new Date('2025-12-01').getTime() }),
        ],
      });
      useFiltersStore.setState({
        timeRange: 'custom',
        customRange: { from: '2026-01-01', to: '2026-01-31' },
      });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).toHaveBeenCalledWith(['in']);
    });

    it('filters sessions by fuzzy duration target', async () => {
      useSessionsStore.setState({
        sessions: [
          makeSession({ id: 'short', duration: 1800 }),
          makeSession({ id: 'match', duration: 3600 }),
          makeSession({ id: 'long', duration: 7200 }),
        ],
      });
      useFiltersStore.setState({
        attributeFilters: { duration: 3600, distance: null, elevationGain: null },
      });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).toHaveBeenCalledWith(['match']);
    });

    it('filters sessions by fuzzy distance target', async () => {
      useSessionsStore.setState({
        sessions: [
          makeSession({ id: 'short', distance: 5000 }),
          makeSession({ id: 'match', distance: 10000 }),
          makeSession({ id: 'long', distance: 30000 }),
        ],
      });
      useFiltersStore.setState({
        attributeFilters: { duration: null, distance: 10000, elevationGain: null },
      });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).toHaveBeenCalledWith(['match']);
    });

    it('filters sessions by fuzzy elevation gain target', async () => {
      useSessionsStore.setState({
        sessions: [
          makeSession({ id: 'flat', elevationGain: 100 }),
          makeSession({ id: 'match', elevationGain: 500 }),
          makeSession({ id: 'alpine', elevationGain: 2000 }),
        ],
      });
      useFiltersStore.setState({
        attributeFilters: { duration: null, distance: null, elevationGain: 500 },
      });
      stubPBPipeline();

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).toHaveBeenCalledWith(['match']);
    });

    it('skips recomputation when already loading', async () => {
      useSessionsStore.setState({ sessions: [makeSession({ id: 's-0' })] });
      useFiltersStore.setState({ groupedPBs: { data: {}, loading: true } });

      await useFiltersStore.getState().recomputePBs();

      expect(mockedGetRecords).not.toHaveBeenCalled();
    });

    it('resets to empty on IndexedDB error', async () => {
      useSessionsStore.setState({ sessions: [makeSession({ id: 's-0' })] });
      mockedGetRecords.mockRejectedValue(new Error('DB error'));

      await useFiltersStore.getState().recomputePBs();

      expect(useFiltersStore.getState().groupedPBs.data).toEqual({});
      expect(useFiltersStore.getState().groupedPBs.loading).toBe(false);
    });
  });
});
