import { describe, it, expect } from 'vite-plus/test';
import { checkMockupDecisions, checkPlan } from '@scripts/checkRules.ts';
import { readSize } from '@scripts/frontmatter.ts';

describe('checkRules', () => {
  const plan = (fields: Record<string, string>, body = '# Long title\n\nText.\n') => {
    const front = Object.entries({
      title: 'Item',
      status: 'idea',
      created: '2026-10-18',
      type: 'chore',
      areas: '[workbench]',
      next: 'Owner decides',
      ...fields,
    })
      .filter((entry) => entry[1] !== '')
      .map((entry) => `${entry[0]}: ${entry[1]}`)
      .join('\n');
    return `---\n${front}\n---\n\n${body}`;
  };

  it('checks a plan: schema, open questions from ready on, owner quotes, tech.md from planned on', () => {
    expect(checkPlan({ folder: 'ok', plan: plan({}), techPresent: false })).toEqual([]);
    expect(
      checkPlan({ folder: 'typo', plan: plan({ status: 'reddy' }), techPresent: true })[0],
    ).toMatch(/^tools\/workbench\/backlog\/typo\/plan\.md: status/);
    expect(checkPlan({ folder: 'none', plan: 'no frontmatter', techPresent: true })).toEqual([
      'tools/workbench/backlog/none/plan.md: no frontmatter block (--- … ---)',
    ]);
    const open = plan(
      { status: 'ready' },
      '# L\n\n## Open questions\n\n- **Q1** · open · Which?\n',
    );
    expect(checkPlan({ folder: 'r', plan: open, techPresent: true })).toEqual([
      'tools/workbench/backlog/r/plan.md: status ready with open questions (Q1)',
    ]);
    const unquoted = plan(
      { status: 'planned' },
      '# L\n\n## Open questions\n\n- **Q2** · answered 2026-10-18 · Which? → (a)\n',
    );
    expect(checkPlan({ folder: 'q', plan: unquoted, techPresent: true })).toEqual([
      'tools/workbench/backlog/q/plan.md: Q2 is answered without the owner\'s words (Owner: "…")',
    ]);
    expect(
      checkPlan({ folder: 'early', plan: plan({ status: 'exploring' }), techPresent: false }),
    ).toEqual([]);
    expect(
      checkPlan({ folder: 'p', plan: plan({ status: 'planned' }), techPresent: false })[0],
    ).toMatch(/^tools\/workbench\/backlog\/p\/tech\.md: missing/);
  });

  it('skips the tech.md rule for size: small and accepts no other size', () => {
    expect(
      checkPlan({
        folder: 's',
        plan: plan({ status: 'planned', size: 'small' }),
        techPresent: false,
      }),
    ).toEqual([]);
    expect(
      checkPlan({
        folder: 's',
        plan: plan({ status: 'in-dev', size: 'small' }),
        techPresent: false,
      }),
    ).toEqual([]);
    expect(
      checkPlan({ folder: 'b', plan: plan({ status: 'planned', size: 'big' }), techPresent: true }),
    ).toEqual(['tools/workbench/backlog/b/plan.md: size: size must be: small']);
    expect(readSize(plan({ size: 'small' }))).toBe('small');
    expect(readSize(plan({}))).toBeUndefined();
  });

  it('checks mockup decisions against the plan by ID only', () => {
    const planText = plan(
      {},
      '# Long\n\n## Decisions (settled)\n\n- **Q2** Frames at native size.\n\n## Open questions\n\n- **Q1** · open · Which?\n',
    );
    const mockup = (decisions: unknown) =>
      `<script type="application/json" id="mockup-config">${JSON.stringify({ title: 'M', decisions })}</script>`;
    expect(
      checkMockupDecisions({
        folder: 'f',
        plan: planText,
        mockupHtml: mockup([
          { id: 'Q1', title: 'Which' },
          { id: 'Q2', title: 'Frames' },
        ]),
      }),
    ).toEqual([]);
    expect(
      checkMockupDecisions({
        folder: 'f',
        plan: planText,
        mockupHtml: mockup([
          { id: 'Q1', title: 'Which', status: 'settled' },
          { id: 'Q2', title: 'Frames', status: 'open' },
        ]),
      }),
    ).toEqual([]);
    const errors = checkMockupDecisions({
      folder: 'f',
      plan: planText,
      mockupHtml: mockup([{ id: 'Q9', title: 'Gone' }]),
    });
    expect(errors).toEqual([
      "tools/workbench/backlog/f/mockup/index.html: Q9 is not in the plan's Open questions or Decisions (settled)",
    ]);
    expect(
      checkMockupDecisions({ folder: 'f', plan: planText, mockupHtml: '<html>old mockup</html>' }),
    ).toEqual([]);
  });
});
