import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { INITIAL_SEGMENTS_STORE_STATE, useSegmentsStore } from '@/store/segments.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

const store = () => useSegmentsStore.getState();
const ids = (): string[] => store().segments.map((segment) => segment.id);

describe('useSegmentsStore', () => {
  beforeEach(() => {
    useSegmentsStore.setState(INITIAL_SEGMENTS_STORE_STATE);
  });

  it('adds a segment', () => {
    const segment = createMockSegment({ id: 'a' });

    store().addSegment(segment);

    expect(store().segments).toEqual([segment]);
  });

  it('renames a segment', () => {
    store().addSegment(createMockSegment({ id: 'a', name: 'Old' }));

    store().renameSegment({ id: 'a', name: 'Hill sprint' });

    expect(store().segments[0]?.name).toBe('Hill sprint');
  });

  it('removes a segment', () => {
    store().addSegment(createMockSegment({ id: 'a' }));
    store().addSegment(createMockSegment({ id: 'b' }));

    store().removeSegment('a');

    expect(ids()).toEqual(['b']);
  });

  it("removes only the session's segments and returns their ids", () => {
    const source = { kind: 'range' as const, startSec: 0, endSec: 10 };
    store().addSegment(createMockSegment({ id: 'a', source: { ...source, sessionId: 's1' } }));
    store().addSegment(createMockSegment({ id: 'b', source: { ...source, sessionId: 's2' } }));
    store().addSegment(createMockSegment({ id: 'c', source: { ...source, sessionId: 's1' } }));

    const removed = store().removeSegmentsOfSession('s1');

    expect(removed).toEqual(['a', 'c']);
    expect(ids()).toEqual(['b']);
  });

  it('clears all segments', () => {
    store().addSegment(createMockSegment({ id: 'a' }));

    store().clearAll();

    expect(store().segments).toEqual([]);
  });

  it('persists as store-segments at version 1', () => {
    const options = useSegmentsStore.persist.getOptions();

    expect(options.name).toBe('store-segments');
    expect(options.version).toBe(1);
  });
});
