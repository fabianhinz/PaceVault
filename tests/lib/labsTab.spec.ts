import { describe, it, expect } from 'vitest';
import { resolveLabsTab } from '@/lib/labsTab.ts';

describe('resolveLabsTab', () => {
  it('returns each valid tab as-is', () => {
    expect(resolveLabsTab('studio')).toBe('studio');
    expect(resolveLabsTab('tools')).toBe('tools');
    expect(resolveLabsTab('training')).toBe('training');
  });

  it('defaults to studio when the param is missing', () => {
    expect(resolveLabsTab(null)).toBe('studio');
  });

  it('defaults to studio for unknown values', () => {
    expect(resolveLabsTab('bogus')).toBe('studio');
    expect(resolveLabsTab('')).toBe('studio');
  });
});
