import {
  checkMockupDecisions,
  checkPlan,
  parseFrontmatter,
  planFrontmatterSchema,
  readChecks,
  readQuestions,
  readTechPaths,
  AREAS,
} from '../scripts/frontmatter.ts';

const PLAN = `---
title: Example
status: planned
created: 2026-10-18
type: feature
areas: [workbench]
next: Q&A on Q3
---

# Example item

## Open questions

- **Q3** · open · Which shell option for frames? (a) iframe (b) inline
- **Q4** · answered 2026-10-18 · Where does \`--check\` run? → (a) Vitest test. Owner: "Vitest staleness test"
- Follow-up, not a tracked question.

## Real-data checks

- [ ] A smart-recording power ride.
- [x] A Strava ZIP.

## Approach

- [ ] A task list that is not a check.
`;

describe('workbenchFrontmatter', () => {
  it('reads open and answered questions with the owner quote; a missing next fails the schema', () => {
    expect(readQuestions(PLAN)).toEqual([
      {
        id: 'Q3',
        state: 'open',
        text: 'Which shell option for frames? (a) iframe (b) inline',
        raw: '- **Q3** · open · Which shell option for frames? (a) iframe (b) inline',
      },
      {
        id: 'Q4',
        state: 'answered',
        date: '2026-10-18',
        text: 'Where does `--check` run? → (a) Vitest test. Owner: "Vitest staleness test"',
        quote: 'Vitest staleness test',
        raw: '- **Q4** · answered 2026-10-18 · Where does `--check` run? → (a) Vitest test. Owner: "Vitest staleness test"',
      },
    ]);

    expect(planFrontmatterSchema.safeParse(parseFrontmatter(PLAN)).success).toBe(true);
    const withoutNext = PLAN.replace('next: Q&A on Q3\n', '');
    expect(planFrontmatterSchema.safeParse(parseFrontmatter(withoutNext)).success).toBe(false);
  });

  it('reads the checks of plan.md and decisions.md and ignores task items under other headings', () => {
    expect(readChecks(PLAN, 'Real-data checks')).toEqual([
      {
        text: 'A smart-recording power ride.',
        checked: false,
        raw: '- [ ] A smart-recording power ride.',
      },
      { text: 'A Strava ZIP.', checked: true, raw: '- [x] A Strava ZIP.' },
    ]);
    expect(readChecks(PLAN, 'Agent decisions')).toEqual([]);
    const decisions =
      '## Agent decisions\n\n- [ ] **Desktop at 1280×800.** Agent: matches the shell frame.\n';
    expect(readChecks(decisions, 'Agent decisions')).toEqual([
      {
        text: '**Desktop at 1280×800.** Agent: matches the shell frame.',
        checked: false,
        raw: '- [ ] **Desktop at 1280×800.** Agent: matches the shell frame.',
      },
    ]);
  });

  it('reads the New and Changed paths of tech.md and nothing else', () => {
    const tech = `# Feature: tech

## Data flow

- \`src/not/a/module.ts\`: a list outside Modules

## Modules

\`\`\`mermaid
flowchart TB
  a --> b
\`\`\`

- \`src/loose.ts\`: before the New heading

### New

- \`src/features/x/A.tsx\`: flow state, \`not this\`
- \`src/features/x/hooks/\`

### Changed

- \`src/store/user.ts\`

### Notes

- \`src/ignored.ts\`

## Interfaces

### New

- \`src/also/ignored.ts\`
`;
    expect(readTechPaths(tech)).toEqual({
      added: ['src/features/x/A.tsx', 'src/features/x/hooks/'],
      changed: ['src/store/user.ts'],
    });
  });

  it('accepts created as a string or as the Date Astro reads, and outputs a string', () => {
    const front = { title: 'T', status: 'idea', type: 'chore', areas: ['app'], next: 'N' };
    const asString = planFrontmatterSchema.safeParse({ ...front, created: '2026-10-18' });
    const asDate = planFrontmatterSchema.safeParse({ ...front, created: new Date('2026-10-18') });
    expect(asString.success && asString.data.created).toBe('2026-10-18');
    expect(asDate.success && asDate.data.created).toBe('2026-10-18');
    expect(planFrontmatterSchema.safeParse({ ...front, created: '18.10.2026' }).success).toBe(
      false,
    );
  });

  it('requires one type and at least one area except on done items, and reports anything else', () => {
    const front = { title: 'T', status: 'idea', created: '2026-10-18', next: 'N' };
    const parsed = planFrontmatterSchema.safeParse({
      ...front,
      type: 'chore',
      areas: ['workbench', 'skills'],
    });
    expect(parsed.success && parsed.data.type).toBe('chore');
    expect(parsed.success && parsed.data.areas).toEqual(['workbench', 'skills']);
    const messages = (fields: Record<string, unknown>) => {
      const result = planFrontmatterSchema.safeParse({ ...front, ...fields });
      if (result.success) return [];
      return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    };
    expect(messages({})).toEqual([
      'type: type is required for every status except done: feature, bug, chore',
      `areas: areas are required for every status except done: at least one of ${AREAS.join(', ')}`,
    ]);
    expect(messages({ status: 'done' })).toEqual([]);
    expect(messages({ type: 'board', areas: ['app'] })).toEqual([
      'type: type must be one of: feature, bug, chore',
    ]);
    expect(messages({ type: 'bug', areas: ['app', 'board'] })).toEqual([
      `areas.1: areas must be from: ${AREAS.join(', ')}`,
    ]);
    expect(messages({ type: 'bug', areas: [] })).toEqual([
      `areas: areas need at least one of: ${AREAS.join(', ')}`,
    ]);
    expect(messages({ type: 'bug', areas: ['app', 'engine', 'app'] })).toEqual([
      'areas: duplicate area "app"',
    ]);
    expect(checkPlan('t', plan({ type: '' }), false)).toEqual([
      'tools/workbench/backlog/t/plan.md: type: type is required for every status except done: feature, bug, chore',
    ]);
    expect(checkPlan('t', plan({ type: 'feature', areas: '[app, engine]' }), false)).toEqual([]);
  });

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
    expect(checkPlan('ok', plan({}), false)).toEqual([]);
    expect(checkPlan('typo', plan({ status: 'reddy' }), true)[0]).toMatch(
      /^tools\/workbench\/backlog\/typo\/plan\.md: status/,
    );
    expect(checkPlan('none', 'no frontmatter', true)).toEqual([
      'tools/workbench/backlog/none/plan.md: no frontmatter block (--- … ---)',
    ]);
    const open = plan(
      { status: 'ready' },
      '# L\n\n## Open questions\n\n- **Q1** · open · Which?\n',
    );
    expect(checkPlan('r', open, true)).toEqual([
      'tools/workbench/backlog/r/plan.md: status ready with open questions (Q1)',
    ]);
    const unquoted = plan(
      { status: 'planned' },
      '# L\n\n## Open questions\n\n- **Q2** · answered 2026-10-18 · Which? → (a)\n',
    );
    expect(checkPlan('q', unquoted, true)).toEqual([
      'tools/workbench/backlog/q/plan.md: Q2 is answered without the owner\'s words (Owner: "…")',
    ]);
    expect(checkPlan('early', plan({ status: 'exploring' }), false)).toEqual([]);
    expect(checkPlan('p', plan({ status: 'planned' }), false)[0]).toMatch(
      /^tools\/workbench\/backlog\/p\/tech\.md: missing/,
    );
  });

  it('checks mockup decisions against the plan by ID and state', () => {
    const planText = plan(
      {},
      '# Long\n\n## Decisions (settled)\n\n- **Q2** Frames at native size.\n\n## Open questions\n\n- **Q1** · open · Which?\n',
    );
    const mockup = (decisions: unknown) =>
      `<script type="application/json" id="mockup-config">${JSON.stringify({ title: 'M', decisions })}</script>`;
    expect(
      checkMockupDecisions(
        'f',
        planText,
        mockup([
          { id: 'Q1', status: 'open' },
          { id: 'Q2', status: 'settled' },
        ]),
      ),
    ).toEqual([]);
    const errors = checkMockupDecisions(
      'f',
      planText,
      mockup([
        { id: 'Q1', status: 'settled' },
        { id: 'Q9', status: 'open' },
      ]),
    );
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain('tools/workbench/backlog/f/mockup/index.html: Q1');
    expect(errors[1]).toContain('tools/workbench/backlog/f/mockup/index.html: Q9');
    expect(checkMockupDecisions('f', planText, '<html>old mockup</html>')).toEqual([]);
  });
});
