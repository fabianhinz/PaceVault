import { selectDeletions } from '../scripts/cleanup.ts';

const statusDiff = (from: string, to: string, extra = '') =>
  [
    'diff --git a/tools/workbench/backlog/f/plan.md b/tools/workbench/backlog/f/plan.md',
    'index 1111111..2222222 100644',
    '--- a/tools/workbench/backlog/f/plan.md',
    '+++ b/tools/workbench/backlog/f/plan.md',
    '@@ -3 +3 @@ title: F',
    `-status: ${from}`,
    `+status: ${to}`,
    extra,
  ].join('\n');

const planOnly = (code: string, planDiff: string) => ({
  porcelain: [`${code} tools/workbench/backlog/f/plan.md`],
  planDiff,
});

const decideFolder = (changes: { porcelain: string[]; planDiff: string }) =>
  selectDeletions([{ folder: 'f', status: 'done', openDecisions: 0 }], new Map([['f', changes]]));

describe('workbenchCleanup', () => {
  it('deletes clean done folders, skips dirty or undecided ones and leaves other statuses alone', () => {
    const dirty = { porcelain: [' M tools/workbench/backlog/x/review/index.html'], planDiff: '' };
    const deletions = selectDeletions(
      [
        { folder: 'clean-done', status: 'done', openDecisions: 0 },
        { folder: 'dirty-done', status: 'done', openDecisions: 0 },
        { folder: 'undecided-done', status: 'done', openDecisions: 2 },
        { folder: 'in-review', status: 'in-review', openDecisions: 1 },
        { folder: 'dirty-idea', status: 'idea', openDecisions: 0 },
        { folder: 'no-plan', status: undefined, openDecisions: 0 },
      ],
      new Map([
        ['dirty-done', dirty],
        ['dirty-idea', dirty],
      ]),
    );
    expect(deletions).toEqual({
      remove: ['clean-done'],
      skip: ['dirty-done'],
      undecided: ['undecided-done'],
    });
  });

  it('deletes a done folder whose only change is the status line of plan.md', () => {
    const removed = { remove: ['f'], skip: [], undecided: [] };
    const skipped = { remove: [], skip: ['f'], undecided: [] };
    expect(decideFolder(planOnly(' M', statusDiff('in-review', 'done')))).toEqual(removed);
    expect(decideFolder(planOnly('M ', statusDiff('in-review', 'done')))).toEqual(removed);

    // Another line in plan.md changed too.
    expect(
      decideFolder(planOnly(' M', statusDiff('in-review', 'done', '@@ -9 +9 @@\n-Old.\n+New.'))),
    ).toEqual(skipped);
    // plan.md is new (not in HEAD): its diff adds every line.
    expect(decideFolder(planOnly('A ', '@@ -0,0 +1,2 @@\n+---\n+status: done'))).toEqual(skipped);
    // Another file in the folder is uncommitted, or untracked.
    expect(
      decideFolder({
        porcelain: [
          ' M tools/workbench/backlog/f/plan.md',
          '?? tools/workbench/backlog/f/review/after/a.png',
        ],
        planDiff: statusDiff('in-review', 'done'),
      }),
    ).toEqual(skipped);
  });
});
