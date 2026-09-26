import { describe, it, expect } from 'vitest';
import { extractSessionName } from '@/lib/filename.ts';

describe('extractSessionName', () => {
  it('extracts single-word name', () => {
    expect(extractSessionName('15482335959_Abendradfahrt.fit')).toBe('Abendradfahrt');
  });

  it('extracts multi-word name replacing underscores with spaces', () => {
    expect(extractSessionName('15595843212_Fahrt_am_Nachmittag.fit')).toBe('Fahrt am Nachmittag');
  });

  it('extracts name from morning run', () => {
    expect(extractSessionName('15487122967_Lauf_am_Morgen.fit')).toBe('Lauf am Morgen');
  });

  it('handles uppercase .FIT extension', () => {
    expect(extractSessionName('12345_Name.FIT')).toBe('Name');
  });

  it('returns undefined for filename without numeric prefix', () => {
    expect(extractSessionName('activity.fit')).toBeUndefined();
  });

  it('returns undefined for empty name after prefix', () => {
    expect(extractSessionName('12345_.fit')).toBeUndefined();
  });

  it('returns undefined for filename without .fit extension', () => {
    expect(extractSessionName('12345_Name')).toBeUndefined();
  });

  it('returns undefined for filename starting with underscore', () => {
    expect(extractSessionName('_Name.fit')).toBeUndefined();
  });

  it('handles many underscores', () => {
    expect(extractSessionName('12345_Multiple_Word_Name.fit')).toBe('Multiple Word Name');
  });
});
