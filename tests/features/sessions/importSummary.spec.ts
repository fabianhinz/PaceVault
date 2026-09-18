import { describe, it, expect } from 'vitest';
import { buildImportSummary } from '@/features/sessions/importSummary.ts';

describe('buildImportSummary', () => {
  it('reports a clean import as a success', () => {
    const summary = buildImportSummary({ imported: 3, duplicated: 0, failed: 0 });
    expect(summary.variant).toBe('success');
    expect(summary.message).toContain('3');
  });

  it('uses the singular message for a single session', () => {
    const one = buildImportSummary({ imported: 1, duplicated: 0, failed: 0 });
    const many = buildImportSummary({ imported: 2, duplicated: 0, failed: 0 });
    expect(one.message).not.toBe(many.message);
  });

  it('warns when nothing was imported', () => {
    expect(buildImportSummary({ imported: 0, duplicated: 4, failed: 0 }).variant).toBe('warning');
  });

  it('errors when something actually failed', () => {
    expect(buildImportSummary({ imported: 9, duplicated: 0, failed: 1 }).variant).toBe('error');
  });

  it('treats unsupported activities as a non-error outcome', () => {
    const summary = buildImportSummary({
      imported: 149,
      duplicated: 0,
      failed: 0,
      unsupported: 62,
    });
    expect(summary.variant).toBe('success');
    expect(summary.message).toContain('62');
    expect(summary.message).not.toMatch(/fail/i);
  });

  it('still warns when everything was unsupported, without calling it a failure', () => {
    const summary = buildImportSummary({ imported: 0, duplicated: 0, failed: 0, unsupported: 5 });
    expect(summary.variant).toBe('warning');
    expect(summary.message).not.toMatch(/fail/i);
  });

  it('produces the same strings as before when unsupported is omitted', () => {
    const without = buildImportSummary({ imported: 2, duplicated: 1, failed: 1 });
    const withZero = buildImportSummary({ imported: 2, duplicated: 1, failed: 1, unsupported: 0 });
    expect(withZero).toEqual(without);
    expect(without.message.split(', ')).toHaveLength(3);
  });

  it('returns an empty message when there is nothing to say', () => {
    expect(buildImportSummary({ imported: 0, duplicated: 0, failed: 0 }).message).toBe('');
  });
});
