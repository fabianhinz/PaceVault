import { describe, it, expect } from 'vite-plus/test';
import { conventionsIndex } from '@scripts/conventionsIndex.ts';

const tdrText = ({ id, title, governs }: { id: string; title: string; governs: string[] }) =>
  `---\nid: ${id}\ntitle: ${title}\nsummary: The rule in one line.\ngoverns:\n${governs.map((glob) => `  - "${glob}"`).join('\n')}\n---\n\n# ${title}\n`;

describe(conventionsIndex.name, () => {
  it('writes one line per governed glob, sorted by glob, then title', () => {
    const built = conventionsIndex([
      {
        file: 'b-rule.md',
        text: tdrText({ id: 'b-rule', title: 'B rule', governs: ['src/**/*.ts'] }),
      },
      {
        file: 'a-rule.md',
        text: tdrText({ id: 'a-rule', title: 'A rule', governs: ['src/**/*.tsx', 'src/**/*.ts'] }),
      },
    ]);
    expect(built.errors).toEqual([]);
    expect(built.index.split('\n').filter((line) => line.startsWith('- '))).toEqual([
      '- `src/**/*.ts` — [A rule](tdr/a-rule.md): The rule in one line.',
      '- `src/**/*.ts` — [B rule](tdr/b-rule.md): The rule in one line.',
      '- `src/**/*.tsx` — [A rule](tdr/a-rule.md): The rule in one line.',
    ]);
  });

  it('reports an id that does not match the file name', () => {
    const built = conventionsIndex([
      { file: 'a-rule.md', text: tdrText({ id: 'other', title: 'A rule', governs: ['src/**'] }) },
    ]);
    expect(built.errors).toEqual(['tdr/a-rule.md: id other does not match the file name']);
  });

  it('reports a record without governs and leaves it out of the index', () => {
    const built = conventionsIndex([
      { file: 'a-rule.md', text: tdrText({ id: 'a-rule', title: 'A rule', governs: [] }) },
    ]);
    expect(built.errors).toHaveLength(1);
    expect(built.index).not.toContain('a-rule.md');
  });

  it('reports a record without frontmatter', () => {
    const built = conventionsIndex([{ file: 'a-rule.md', text: '# A rule\n' }]);
    expect(built.errors).toHaveLength(1);
  });
});
