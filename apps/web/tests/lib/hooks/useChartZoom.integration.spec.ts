import { describe, it, expect } from 'vite-plus/test';
import { useMemo } from 'react';
import { act } from '@testing-library/react';
import { useChartZoom } from '@/lib/hooks/useChartZoom.ts';
import { useSyncedChartZoom } from '@/lib/hooks/useSyncedChartZoom.ts';
import type { MouseHandlerDataParam } from 'recharts/types/synchronisation/types';
import { renderHookWithProviders } from '@testUtils/render.ts';

const sampleData = [
  { date: '2024-01-01', value: 10 },
  { date: '2024-01-02', value: 20 },
  { date: '2024-01-03', value: 30 },
  { date: '2024-01-04', value: 40 },
  { date: '2024-01-05', value: 50 },
];

const mockEvent = (activeLabel: string | number | undefined): MouseHandlerDataParam => {
  return {
    activeLabel,
    activeTooltipIndex: undefined,
    isTooltipActive: false,
    activeIndex: undefined,
    activeDataKey: undefined,
    activeCoordinate: undefined,
  };
};

const series = Array.from({ length: 10 }, (_, i) => ({ time: i, value: i * 10 }));

describe(useChartZoom.name, () => {
  it('returns full data initially with zoomed false', () => {
    const hook = renderHookWithProviders(() => useChartZoom({ data: sampleData, xKey: 'date' }));
    expect(hook.result.current.zoomedData).toEqual(sampleData);
    expect(hook.result.current.zoomed).toBe(false);
    expect(hook.result.current.refAreaLeft).toBeNull();
    expect(hook.result.current.refAreaRight).toBeNull();
  });

  it('zooms to selected range on mousedown + mousemove + mouseup', () => {
    const hook = renderHookWithProviders(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => hook.result.current.onMouseDown(mockEvent('2024-01-02')));
    act(() => hook.result.current.onMouseMove(mockEvent('2024-01-04')));
    act(() => hook.result.current.onMouseUp());

    expect(hook.result.current.zoomed).toBe(true);
    expect(hook.result.current.zoomedData).toEqual([
      { date: '2024-01-02', value: 20 },
      { date: '2024-01-03', value: 30 },
      { date: '2024-01-04', value: 40 },
    ]);
  });

  it('handles reversed selection (right-to-left drag)', () => {
    const hook = renderHookWithProviders(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => hook.result.current.onMouseDown(mockEvent('2024-01-04')));
    act(() => hook.result.current.onMouseMove(mockEvent('2024-01-02')));
    act(() => hook.result.current.onMouseUp());

    expect(hook.result.current.zoomed).toBe(true);
    expect(hook.result.current.zoomedData).toHaveLength(3);
    expect(hook.result.current.zoomedData[0]).toEqual({ date: '2024-01-02', value: 20 });
  });

  it('single-point selection does not zoom', () => {
    const hook = renderHookWithProviders(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => hook.result.current.onMouseDown(mockEvent('2024-01-03')));
    act(() => hook.result.current.onMouseMove(mockEvent('2024-01-03')));
    act(() => hook.result.current.onMouseUp());

    expect(hook.result.current.zoomed).toBe(false);
    expect(hook.result.current.zoomedData).toEqual(sampleData);
  });

  it('resetZoom returns to full data', () => {
    const hook = renderHookWithProviders(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => hook.result.current.onMouseDown(mockEvent('2024-01-02')));
    act(() => hook.result.current.onMouseMove(mockEvent('2024-01-04')));
    act(() => hook.result.current.onMouseUp());
    expect(hook.result.current.zoomed).toBe(true);

    act(() => hook.result.current.resetZoom());
    expect(hook.result.current.zoomed).toBe(false);
    expect(hook.result.current.zoomedData).toEqual(sampleData);
  });

  it('onMouseDown with undefined activeLabel is a no-op', () => {
    const hook = renderHookWithProviders(() => useChartZoom({ data: sampleData, xKey: 'date' }));

    act(() => hook.result.current.onMouseDown(mockEvent(undefined)));
    expect(hook.result.current.refAreaLeft).toBeNull();
  });

  it('zooms correctly with numeric x-axis data', () => {
    const numericData = [
      { time: 1.23, value: 10 },
      { time: 2.46, value: 20 },
      { time: 3.69, value: 30 },
      { time: 4.92, value: 40 },
      { time: 6.15, value: 50 },
    ];
    const hook = renderHookWithProviders(() => useChartZoom({ data: numericData, xKey: 'time' }));

    act(() => hook.result.current.onMouseDown(mockEvent(2.46)));
    expect(hook.result.current.refAreaLeft).toBe(2.46);

    act(() => hook.result.current.onMouseMove(mockEvent(4.92)));
    expect(hook.result.current.refAreaRight).toBe(4.92);

    act(() => hook.result.current.onMouseUp());

    expect(hook.result.current.zoomed).toBe(true);
    expect(hook.result.current.zoomedData).toEqual([
      { time: 2.46, value: 20 },
      { time: 3.69, value: 30 },
      { time: 4.92, value: 40 },
    ]);
  });

  it('resets zoom when data changes', () => {
    const hook = renderHookWithProviders(
      (props) => useChartZoom({ data: props.data, xKey: 'date' }),
      {
        initialProps: { data: sampleData },
      },
    );

    act(() => hook.result.current.onMouseDown(mockEvent('2024-01-02')));
    act(() => hook.result.current.onMouseMove(mockEvent('2024-01-04')));
    act(() => hook.result.current.onMouseUp());
    expect(hook.result.current.zoomed).toBe(true);

    const newData = sampleData.slice(0, 3);
    hook.rerender({ data: newData });
    expect(hook.result.current.zoomed).toBe(false);
    expect(hook.result.current.zoomedData).toEqual(newData);
  });

  it('a click without drag selects the clicked x, including x = 0', () => {
    const clicked: Array<string | number> = [];
    const hook = renderHookWithProviders(() =>
      useChartZoom({ data: series, xKey: 'time', onClick: (x) => clicked.push(x) }),
    );

    act(() => hook.result.current.onMouseDown(mockEvent(0)));
    act(() => hook.result.current.onMouseUp());
    act(() => hook.result.current.onMouseDown(mockEvent(2)));
    act(() => hook.result.current.onMouseMove(mockEvent(5)));
    act(() => hook.result.current.onMouseUp());

    expect(clicked).toEqual([0]);
    expect(hook.result.current.zoomed).toBe(true);
  });

  it('clicking a lap band in a zoomed chart resets the zoom', () => {
    const hook = renderHookWithProviders(() => {
      const synced = useSyncedChartZoom();
      const range = synced.zoomRange;
      const visibleSeries = useMemo(() => {
        if (!range) return series;
        return series.filter((d) => d.time >= range.from && d.time <= range.to);
      }, [range]);
      const chart = useChartZoom({
        data: visibleSeries,
        xKey: 'time',
        onZoomComplete: synced.onZoomComplete,
      });
      return { synced, chart };
    });

    act(() => hook.result.current.chart.onMouseDown(mockEvent(2)));
    act(() => hook.result.current.chart.onMouseMove(mockEvent(5)));
    act(() => hook.result.current.chart.onMouseUp());
    expect(hook.result.current.synced.zoomed).toBe(true);
    expect(hook.result.current.chart.zoomedData.map((d) => d.time)).toEqual([2, 3, 4, 5]);

    act(() => hook.result.current.chart.onMouseDown(mockEvent(3)));
    act(() => hook.result.current.chart.onMouseUp());
    expect(hook.result.current.synced.zoomed).toBe(true);
    expect(hook.result.current.chart.zoomedData.map((d) => d.time)).toEqual([2, 3, 4, 5]);

    act(() => hook.result.current.synced.resetZoom());
    expect(hook.result.current.synced.zoomed).toBe(false);
    expect(hook.result.current.chart.zoomedData).toEqual(series);
  });
});
