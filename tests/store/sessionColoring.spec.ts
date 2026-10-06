import { describe, expect, it } from 'vitest';
import { useSessionColoringStore } from '@/store/sessionColoring.ts';

describe('useSessionColoringStore', () => {
  it('starts with the sport colour and remembers the chosen mode', () => {
    expect(useSessionColoringStore.getState().colorMode).toBe('sport');
    useSessionColoringStore.getState().setSessionColorMode('hr');
    expect(useSessionColoringStore.getState().colorMode).toBe('hr');
  });

  it('is persisted under the store-session-coloring key at version 1', () => {
    const options = useSessionColoringStore.persist.getOptions();
    expect(options.name).toBe('store-session-coloring');
    expect(options.version).toBe(1);
  });
});
