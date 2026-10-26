import { describe, it, expect } from 'vite-plus/test';
import {
  parseFrontmatter,
  planFrontmatterSchema,
  readChecks,
  readQuestions,
  AREAS,
} from '@scripts/frontmatter.ts';
import { checkPlan } from '@scripts/checkRules.ts';

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

describe('frontmatter', () => {
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
    expect(readChecks({ text: PLAN, heading: 'Real-data checks' })).toEqual([
      {
        text: 'A smart-recording power ride.',
        checked: false,
        superseded: false,
        raw: '- [ ] A smart-recording power ride.',
      },
      { text: 'A Strava ZIP.', checked: true, superseded: false, raw: '- [x] A Strava ZIP.' },
    ]);
    expect(readChecks({ text: PLAN, heading: 'Agent decisions' })).toEqual([]);
    const decisions =
      '## Agent decisions\n\n- [ ] **Desktop at 1280×800.** Agent: matches the shell frame.\n- [~] **Popover.** Agent: x. Superseded by: Q1.\n';
    expect(readChecks({ text: decisions, heading: 'Agent decisions' })).toEqual([
      {
        text: '**Desktop at 1280×800.** Agent: matches the shell frame.',
        checked: false,
        superseded: false,
        raw: '- [ ] **Desktop at 1280×800.** Agent: matches the shell frame.',
      },
      {
        text: '**Popover.** Agent: x. Superseded by: Q1.',
        checked: false,
        superseded: true,
        raw: '- [~] **Popover.** Agent: x. Superseded by: Q1.',
      },
    ]);
    expect(
      readChecks({ text: '## Real-data checks\n\n- [~] A ride.\n', heading: 'Real-data checks' }),
    ).toEqual([]);
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
    expect(checkPlan({ folder: 't', plan: plan({ type: '' }), techPresent: false })).toEqual([
      'tools/workbench/backlog/t/plan.md: type: type is required for every status except done: feature, bug, chore',
    ]);
    expect(
      checkPlan({
        folder: 't',
        plan: plan({ type: 'feature', areas: '[app, engine]' }),
        techPresent: false,
      }),
    ).toEqual([]);
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
});
