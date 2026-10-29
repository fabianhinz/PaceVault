import { describe, it, expect } from 'vite-plus/test';
import { readQuestions } from '@scripts/frontmatter.ts';
import {
  answerLine,
  deleteLine,
  editLine,
  fileItems,
  insertLine,
  tickLine,
  unifiedDiff,
  type EditResult,
} from '@site/lib/writeBack.ts';

const PLAN = `---
title: Example
status: planned
created: 2026-10-18
next: Q&A on Q1
---

# Example item

## Open questions

- **Q1** · open · Which frame? (a) iframe (b) inline
- **Q2** · open · Deep links?
  - Owner 2026-10-17: "later"

## Real-data checks

- [ ] A power ride.
- [x] A Strava ZIP.

## Risks

- [ ] A power ride.
`;

const text = (result: EditResult) => {
  if (!result.ok) throw new Error(`edit refused: ${result.reason}`);
  return result.text;
};

const changedLines = (before: string, after: string) => {
  const a = before.split('\n');
  const b = after.split('\n');
  expect(b).toHaveLength(a.length);
  return a.flatMap((line, index) => {
    if (line === b[index]) return [];
    return [[line, b[index]]];
  });
};

describe('writeBack', () => {
  it('changes exactly one line for status, tick and answer, keeping the final newline', () => {
    const status = text(
      editLine({
        text: PLAN,
        place: { kind: 'frontmatter', key: 'status' },
        expected: 'status: planned',
        next: 'status: ready',
      }),
    );
    expect(changedLines(PLAN, status)).toEqual([['status: planned', 'status: ready']]);
    expect(status).toMatch(/\n$/);

    const first = '- [ ] A power ride.';
    const ticked = text(
      editLine({
        text: PLAN,
        place: { kind: 'section', heading: 'Real-data checks' },
        expected: first,
        next: tickLine({ first, checked: true }),
      }),
    );
    expect(changedLines(PLAN, ticked)).toEqual([[first, '- [x] A power ride.']]);

    const question = '- **Q1** · open · Which frame? (a) iframe (b) inline';
    const line = answerLine({ first: question, date: '2026-10-18', option: 'b', words: '' });
    expect(line).toBe('- **Q1** · answered 2026-10-18 · Which frame? → (b) inline. Owner: "b"');
    const answered = text(
      editLine({
        text: PLAN,
        place: { kind: 'section', heading: 'Open questions' },
        expected: question,
        next: line ?? '',
      }),
    );
    expect(changedLines(PLAN, answered)).toEqual([[question, line]]);
    expect(readQuestions(answered)[0]).toMatchObject({ id: 'Q1', state: 'answered', quote: 'b' });
  });

  it("quotes the owner's words with single quotes and refuses an empty answer without options", () => {
    const line = answerLine({
      first: '- **Q2** · open · Deep links?',
      date: '2026-10-18',
      option: '',
      words: 'only "detail"\nfor now',
    });
    expect(line).toBe(
      `- **Q2** · answered 2026-10-18 · Deep links? → Owner: "only 'detail' for now"`,
    );
    expect(readQuestions(`## Open questions\n\n${line}\n`)[0]?.quote).toBe("only 'detail' for now");
    expect(
      answerLine({
        first: '- **Q2** · open · Deep links?',
        date: '2026-10-18',
        option: '',
        words: '  ',
      }),
    ).toBeUndefined();
  });

  it('refuses a missing or duplicate line, the wrong section and a no-op', () => {
    const checks = { kind: 'section', heading: 'Real-data checks' } as const;
    expect(
      editLine({ text: PLAN, place: checks, expected: '- [ ] Gone.', next: '- [x] Gone.' }),
    ).toEqual({
      ok: false,
      reason: 'missing',
    });
    const twice = PLAN.replace('- [x] A Strava ZIP.', '- [ ] A power ride.');
    expect(
      editLine({
        text: twice,
        place: checks,
        expected: '- [ ] A power ride.',
        next: '- [x] A power ride.',
      }),
    ).toEqual({
      ok: false,
      reason: 'duplicate',
    });
    const questions = { kind: 'section', heading: 'Open questions' } as const;
    expect(
      editLine({
        text: PLAN,
        place: questions,
        expected: '- [ ] A power ride.',
        next: '- [x] A power ride.',
      }),
    ).toEqual({
      ok: false,
      reason: 'missing',
    });
    expect(
      editLine({
        text: PLAN,
        place: checks,
        expected: '- [ ] A power ride.',
        next: '- [ ] A power ride.',
      }),
    ).toEqual({
      ok: false,
      reason: 'unchanged',
    });
    expect(
      editLine({
        text: PLAN,
        place: { kind: 'section', heading: 'Nope' },
        expected: 'x',
        next: 'y',
      }),
    ).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('inserts after a given block only', () => {
    const questions = { kind: 'section', heading: 'Open questions' } as const;
    const item = '- **Q2** · open · Deep links?\n  - Owner 2026-10-17: "later"';
    const commented = text(
      insertLine({
        text: PLAN,
        place: questions,
        after: item,
        line: '  - Owner 2026-10-18: "now"',
      }),
    );
    expect(commented).toContain(`${item}\n  - Owner 2026-10-18: "now"\n\n## Real-data checks`);
    expect(
      insertLine({ text: PLAN, place: questions, after: '- **Q9** · open · Gone?', line: 'x' }),
    ).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('deletes an item and keeps one blank line around the list', () => {
    const decisions =
      '## Agent decisions\n\n- [ ] **Batch size 50.** Agent: matches the migration.\n\n## Notes\n';
    const agent = { kind: 'section', heading: 'Agent decisions' } as const;
    const decision = '- [ ] **Batch size 50.** Agent: matches the migration.';
    const removed = text(deleteLine({ text: decisions, place: agent, expected: decision }));
    expect(removed).toBe('## Agent decisions\n\n## Notes\n');
    const middle = text(
      deleteLine({
        text: PLAN,
        place: { kind: 'section', heading: 'Real-data checks' },
        expected: '- [ ] A power ride.',
      }),
    );
    expect(middle).toContain('## Real-data checks\n\n- [x] A Strava ZIP.\n\n## Risks');
    const question = '- **Q2** · open · Deep links?\n  - Owner 2026-10-17: "later"';
    expect(
      text(
        deleteLine({
          text: PLAN,
          place: { kind: 'section', heading: 'Open questions' },
          expected: question,
        }),
      ),
    ).toContain('- **Q1** · open · Which frame? (a) iframe (b) inline\n\n## Real-data checks');
    const flaky = '# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n- `b.spec.ts:2` · y\n';
    expect(
      text(deleteLine({ text: flaky, place: { kind: 'file' }, expected: '- `b.spec.ts:2` · y' })),
    ).toBe('# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n');
  });

  it('lists every top-level item with its heading and writes a unified diff', () => {
    const findings =
      '# Review findings: X\n\nIntro.\n\n## Round 2\n\n- **R3** · open · on C1 · a\n  more\n- **R4** · fixed · general · b\n';
    expect(fileItems(findings)).toEqual([
      {
        raw: '- **R3** · open · on C1 · a\n  more',
        first: '- **R3** · open · on C1 · a',
        heading: 'Round 2',
      },
      {
        raw: '- **R4** · fixed · general · b',
        first: '- **R4** · fixed · general · b',
        heading: 'Round 2',
      },
    ]);
    expect(unifiedDiff({ before: 'a\nb\nc\n', after: 'a\nB\nc\n' })).toBe(
      '@@ -1,3 +1,3 @@\n a\n-b\n+B\n c',
    );
    expect(unifiedDiff({ before: null, after: 'new\n' })).toBe('@@ -0,0 +1,1 @@\n+new');
  });
});
