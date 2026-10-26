import { describe, it, expect } from 'vite-plus/test';
import { findThemeLiterals } from '@scripts/themeTokens.ts';

describe(findThemeLiterals.name, () => {
  it('reports a hex colour in an attribute', () => {
    expect(findThemeLiterals('<rect fill="#fff" />')).toEqual([
      { line: 1, match: '#fff', check: 'hex' },
    ]);
  });

  it('reports an rgba colour with literal channels', () => {
    expect(findThemeLiterals("const fill = 'rgba(255,255,255,.3)';")).toEqual([
      { line: 1, match: 'rgba(255,255,255,.3)', check: 'rgb' },
    ]);
  });

  it('reports an arbitrary px value', () => {
    expect(findThemeLiterals('<div className="w-[440px]" />')).toEqual([
      { line: 1, match: '-[440px]', check: 'px' },
    ]);
  });

  it('ignores a colour built from data', () => {
    expect(findThemeLiterals('const css = `rgba(${color[0]},${color[1]},${color[2]},1)`;')).toEqual(
      [],
    );
  });

  it('ignores an id fragment', () => {
    expect(findThemeLiterals('<a href="#main">Skip</a>')).toEqual([]);
  });

  it('ignores arbitrary values in rem and calc', () => {
    expect(findThemeLiterals('<div className="min-w-[5rem]" />')).toEqual([]);
    expect(
      findThemeLiterals('<div className="pt-[calc(env(safe-area-inset-top)+1.5rem)]" />'),
    ).toEqual([]);
  });

  it('reports the line of a hit on the third line', () => {
    expect(findThemeLiterals('const a = 1;\nconst b = 2;\nconst c = "#34d399";')).toEqual([
      { line: 3, match: '#34d399', check: 'hex' },
    ]);
  });
});
