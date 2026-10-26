import { describe, expect, it } from 'vite-plus/test';
import { act } from '@testing-library/react';
import { useMapRendererHandOver } from '@/components/mapBackground/hooks/useMapRendererHandOver.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

const renderHandOver = () =>
  renderHookWithProviders(
    (props: { terrain: boolean }) =>
      useMapRendererHandOver({ terrain: props.terrain, mapLoaded: true }),
    { initialProps: { terrain: false }, strict: true },
  );

describe(useMapRendererHandOver.name, () => {
  it('draws the track with deck.gl only in 2D', () => {
    const handOver = renderHandOver();
    expect(handOver.result.current).toMatchObject({
      deckShown: true,
      terrainMounted: false,
      onTerrainDrawn: undefined,
      onDeckDrawn: undefined,
    });
  });

  it('keeps deck.gl until the 3D line has drawn when entering 3D', () => {
    const handOver = renderHandOver();
    handOver.rerender({ terrain: true });
    expect(handOver.result.current.deckShown).toBe(true);
    expect(handOver.result.current.terrainMounted).toBe(true);
    act(() => handOver.result.current.onTerrainDrawn?.());
    expect(handOver.result.current).toMatchObject({
      deckShown: false,
      terrainMounted: true,
      onTerrainDrawn: undefined,
    });
  });

  it('keeps the 3D line until deck.gl has drawn when going back to 2D', () => {
    const handOver = renderHandOver();
    handOver.rerender({ terrain: true });
    act(() => handOver.result.current.onTerrainDrawn?.());
    handOver.rerender({ terrain: false });
    expect(handOver.result.current.deckShown).toBe(true);
    expect(handOver.result.current.terrainMounted).toBe(true);
    act(() => handOver.result.current.onDeckDrawn?.());
    expect(handOver.result.current).toMatchObject({
      deckShown: true,
      terrainMounted: false,
      onDeckDrawn: undefined,
    });
  });

  it('hands the track back to deck.gl after several round trips under a StrictMode double mount', () => {
    const handOver = renderHandOver();
    for (let trip = 0; trip < 3; trip++) {
      handOver.rerender({ terrain: true });
      act(() => handOver.result.current.onTerrainDrawn?.());
      handOver.rerender({ terrain: false });
      act(() => handOver.result.current.onDeckDrawn?.());
    }
    expect(handOver.result.current).toMatchObject({
      deckShown: true,
      terrainMounted: false,
      onTerrainDrawn: undefined,
      onDeckDrawn: undefined,
    });
  });

  it('drops the 3D line at once when 2D comes back before it drew', () => {
    const handOver = renderHandOver();
    handOver.rerender({ terrain: true });
    handOver.rerender({ terrain: false });
    expect(handOver.result.current).toMatchObject({ deckShown: true, terrainMounted: false });
  });
});
