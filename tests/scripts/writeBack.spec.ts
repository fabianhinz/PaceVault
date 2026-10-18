import { readQuestions } from '../../scripts/workbenchFrontmatter.ts';
import {
  answerLine,
  deleteLine,
  editLine,
  fileItems,
  insertLine,
  tickLine,
  unifiedDiff,
  type EditResult,
} from '../../workbench/site/src/lib/writeBack.ts';

const PLAN = `---
title: Example
status: planned
created: 2026-10-18
next: Q&A on Q1
---

# Example feature

## Open questions

- **Q1** · open · Which frame? (a) iframe (b) inline
- **Q2** · open · Deep links?
  - Owner 2026-10-17: "later"

## Real-data checks

- [ ] A power ride.
- [x] A Strava ZIP.

## Agent decisions

- [ ] **Batch size 50.** Agent: matches the migration.

## Risks

- [ ] A power ride.
`;

const text = (result: EditResult) => {
  if (!result.ok) throw new Error(`edit refused: ${result.reason}`);
  return result.text;
};

/** The lines that differ between two texts of the same length (line count). */
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
      editLine(PLAN, { kind: 'frontmatter', key: 'status' }, 'status: planned', 'status: ready'),
    );
    expect(changedLines(PLAN, status)).toEqual([['status: planned', 'status: ready']]);
    expect(status.endsWith('\n')).toBe(true);

    const first = '- [ ] A power ride.';
    const ticked = text(
      editLine(
        PLAN,
        { kind: 'section', heading: 'Real-data checks' },
        first,
        tickLine(first, true),
      ),
    );
    expect(changedLines(PLAN, ticked)).toEqual([[first, '- [x] A power ride.']]);

    const question = '- **Q1** · open · Which frame? (a) iframe (b) inline';
    const line = answerLine(question, '2026-10-18', 'b', '');
    expect(line).toBe('- **Q1** · answered 2026-10-18 · Which frame? → (b) inline. Owner: "b"');
    const answered = text(
      editLine(PLAN, { kind: 'section', heading: 'Open questions' }, question, line ?? ''),
    );
    expect(changedLines(PLAN, answered)).toEqual([[question, line]]);
    expect(readQuestions(answered)[0]).toMatchObject({ id: 'Q1', state: 'answered', quote: 'b' });
  });

  it("quotes the owner's words with single quotes and refuses an empty answer without options", () => {
    const line = answerLine(
      '- **Q2** · open · Deep links?',
      '2026-10-18',
      '',
      'only "detail"\nfor now',
    );
    expect(line).toBe(
      `- **Q2** · answered 2026-10-18 · Deep links? → Owner: "only 'detail' for now"`,
    );
    expect(readQuestions(`## Open questions\n\n${line}\n`)[0]?.quote).toBe("only 'detail' for now");
    expect(answerLine('- **Q2** · open · Deep links?', '2026-10-18', '', '  ')).toBeUndefined();
  });

  it('refuses a missing or duplicate line, the wrong section and a no-op', () => {
    const checks = { kind: 'section', heading: 'Real-data checks' } as const;
    expect(editLine(PLAN, checks, '- [ ] Gone.', '- [x] Gone.')).toEqual({
      ok: false,
      reason: 'missing',
    });
    const twice = PLAN.replace('- [x] A Strava ZIP.', '- [ ] A power ride.');
    expect(editLine(twice, checks, '- [ ] A power ride.', '- [x] A power ride.')).toEqual({
      ok: false,
      reason: 'duplicate',
    });
    // the same text under ## Risks is not a real-data check
    const agent = { kind: 'section', heading: 'Agent decisions' } as const;
    expect(editLine(PLAN, agent, '- [ ] A power ride.', '- [x] A power ride.')).toEqual({
      ok: false,
      reason: 'missing',
    });
    expect(editLine(PLAN, checks, '- [ ] A power ride.', '- [ ] A power ride.')).toEqual({
      ok: false,
      reason: 'unchanged',
    });
    expect(editLine(PLAN, { kind: 'section', heading: 'Nope' }, 'x', 'y')).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('inserts after a given block only', () => {
    const questions = { kind: 'section', heading: 'Open questions' } as const;
    const item = '- **Q2** · open · Deep links?\n  - Owner 2026-10-17: "later"';
    const commented = text(insertLine(PLAN, questions, item, '  - Owner 2026-10-18: "now"'));
    expect(commented).toContain(`${item}\n  - Owner 2026-10-18: "now"\n\n## Real-data checks`);
    expect(insertLine(PLAN, questions, '- **Q9** · open · Gone?', 'x')).toEqual({
      ok: false,
      reason: 'missing',
    });
  });

  it('deletes an item and keeps one blank line around the list', () => {
    const checks = { kind: 'section', heading: 'Agent decisions' } as const;
    const decision = '- [ ] **Batch size 50.** Agent: matches the migration.';
    const removed = text(deleteLine(PLAN, checks, decision));
    expect(removed).toContain('## Agent decisions\n\n## Risks');
    const middle = text(
      deleteLine(PLAN, { kind: 'section', heading: 'Real-data checks' }, '- [ ] A power ride.'),
    );
    expect(middle).toContain('## Real-data checks\n\n- [x] A Strava ZIP.\n\n## Agent decisions');
    const question = '- **Q2** · open · Deep links?\n  - Owner 2026-10-17: "later"';
    expect(
      text(deleteLine(PLAN, { kind: 'section', heading: 'Open questions' }, question)),
    ).toContain('- **Q1** · open · Which frame? (a) iframe (b) inline\n\n## Real-data checks');
    const flaky = '# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n- `b.spec.ts:2` · y\n';
    expect(text(deleteLine(flaky, { kind: 'file' }, '- `b.spec.ts:2` · y'))).toBe(
      '# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n',
    );
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
    expect(unifiedDiff('a\nb\nc\n', 'a\nB\nc\n')).toBe('@@ -1,3 +1,3 @@\n a\n-b\n+B\n c');
    expect(unifiedDiff(null, 'new\n')).toBe('@@ -0,0 +1,1 @@\n+new');
  });
});
