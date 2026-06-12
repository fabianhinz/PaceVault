import { describe, it, expect } from 'vitest';
import { DEFAULT_CUSTOM_DISTANCE } from '@/store/lapOptions.ts';

describe('DEFAULT_CUSTOM_DISTANCE', () => {
  it('provides defaults for all sports', () => {
    expect(DEFAULT_CUSTOM_DISTANCE.running).toBe(1000);
    expect(DEFAULT_CUSTOM_DISTANCE.cycling).toBe(5000);
  });
});
