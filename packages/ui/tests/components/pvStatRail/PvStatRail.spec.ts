import { describe, expect, it } from 'vite-plus/test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { PvStatRail } from '../../../src/components/pvStatRail/PvStatRail.tsx';

const NOTE = { text: '161 bpm', color: '#fbbf24' };

const railRows = (notePlacement: 'top' | 'bottom' | undefined): string[] => {
  const host = document.createElement('div');
  host.innerHTML = renderToString(
    createElement(PvStatRail, {
      header: 'Heart rate',
      rows: [{ key: 'value', value: '158' }],
      active: true,
      noteSlot: true,
      note: NOTE,
      notePlacement,
    }),
  );
  const grid = host.querySelector('[data-testid="stat-rail"]');
  return Array.from(grid?.children ?? []).map((row) => row.textContent ?? '');
};

describe(PvStatRail.name, () => {
  it('renders the note in the bottom row by default', () => {
    expect(railRows(undefined)).toEqual(['', 'Heart rate158', '161 bpm']);
  });

  it('renders the note in the top row when placed on top', () => {
    expect(railRows('top')).toEqual(['161 bpm', 'Heart rate158', '']);
  });
});
