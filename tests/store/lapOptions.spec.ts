import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_CUSTOM_DISTANCE, useLapOptionsStore } from '@/store/lapOptions.ts';

describe('DEFAULT_CUSTOM_DISTANCE', () => {
  it('provides defaults for all sports', () => {
    expect(DEFAULT_CUSTOM_DISTANCE.running).toBe(1000);
    expect(DEFAULT_CUSTOM_DISTANCE.cycling).toBe(5000);
    expect(DEFAULT_CUSTOM_DISTANCE.swimming).toBe(1000);
  });
});

describe('useLapOptionsStore', () => {
  beforeEach(() => {
    useLapOptionsStore.setState({
      isDevice: true,
      customDistance: { ...DEFAULT_CUSTOM_DISTANCE },
    });
  });

  it('defaults to device laps with per-sport distances', () => {
    const state = useLapOptionsStore.getState();
    expect(state.isDevice).toBe(true);
    expect(state.customDistance).toEqual(DEFAULT_CUSTOM_DISTANCE);
  });

  it('toggles device mode', () => {
    useLapOptionsStore.getState().setIsDevice(false);
    expect(useLapOptionsStore.getState().isDevice).toBe(false);
  });

  it('sets custom distance per sport without affecting others', () => {
    useLapOptionsStore.getState().setCustomDistance('running', 2000);
    const state = useLapOptionsStore.getState();
    expect(state.customDistance.running).toBe(2000);
    expect(state.customDistance.cycling).toBe(DEFAULT_CUSTOM_DISTANCE.cycling);
  });

  it('is persisted under the store-lap-options key at version 1', () => {
    const options = useLapOptionsStore.persist.getOptions();
    expect(options.name).toBe('store-lap-options');
    expect(options.version).toBe(1);
  });
});
