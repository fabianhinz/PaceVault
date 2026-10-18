import { decide } from '../../scripts/statusGuard.ts';

const FILE = '/repo/workbench/x/plan.md';

const planText = (status: string, rest = '') =>
  `---\ntitle: X\nstatus: ${status}\ncreated: 2026-10-18\nnext: Something\n---\n\n# X\n\nText.\n${rest}`;

const edit = (current: string, oldString: string, newString: string) =>
  decide(
    {
      tool_name: 'Edit',
      tool_input: { file_path: FILE, old_string: oldString, new_string: newString },
    },
    current,
  );

const move = (from: string, to: string) => edit(planText(from), `status: ${from}`, `status: ${to}`);

const write = (content: string, current: string | undefined) =>
  decide({ tool_name: 'Write', tool_input: { file_path: FILE, content } }, current);

const bash = (command: string, cwd?: string) =>
  decide({ tool_name: 'Bash', tool_input: { command }, cwd }, undefined);

describe('statusGuard', () => {
  it('allows only agent status moves and new plans at idea', () => {
    const blocked: Array<[string, string]> = [
      ['planned', 'in-dev'],
      ['planned', 'ready'],
      ['in-review', 'done'],
      ['in-review', 'exploring'],
      ['ready', 'in-review'],
      ['ready', 'done'],
    ];
    for (const pair of blocked) {
      expect(move(pair[0], pair[1]), pair.join(' → ')).toBe(
        `status: ${pair[0]} → ${pair[1]} is owner-only or skips a gate (workbench/x/plan.md). Ask the owner.`,
      );
    }
    const allowed: Array<[string, string]> = [
      ['idea', 'exploring'],
      ['idea', 'planned'],
      ['ready', 'in-dev'],
      ['in-dev', 'in-review'],
      ['in-review', 'in-dev'],
      ['in-review', 'planned'],
      ['ready', 'planned'],
      ['in-dev', 'planned'],
    ];
    for (const pair of allowed) expect(move(pair[0], pair[1]), pair.join(' → ')).toBeUndefined();

    expect(edit(planText('ready'), 'Text.', 'More text.')).toBeUndefined();
    expect(edit(planText('ready'), 'status: ready\n', '')).toBeDefined();
    expect(write(planText('ready'), undefined)).toBeDefined();
    expect(write(planText('idea'), undefined)).toBeUndefined();
  });

  it('blocks ticking real-data checks and agent decisions, allows adding open items', () => {
    const current = planText(
      'in-review',
      '\n## Real-data checks\n\n- [ ] A real ride.\n\n## Agent decisions\n\n- [ ] **Batch 50.** Agent: fits.\n',
    );
    const message =
      'Real-data checks and agent decisions are ticked by the owner only (workbench/x/plan.md).';
    expect(edit(current, '- [ ] A real ride.', '- [x] A real ride.')).toBe(message);
    expect(edit(current, '- [ ] **Batch 50.**', '- [x] **Batch 50.**')).toBe(message);
    expect(
      edit(current, '- [ ] A real ride.', '- [ ] A real ride.\n- [ ] A Strava ZIP.'),
    ).toBeUndefined();
  });

  it('counts ticks and items per heading', () => {
    const current = planText(
      'in-review',
      '\n## Real-data checks\n\n- [ ] A real ride.\n- [x] A real run.\n\n## Agent decisions\n\n- [ ] **Batch 50.** Agent: fits.\n',
    );
    const ticked =
      'Real-data checks and agent decisions are ticked by the owner only (workbench/x/plan.md).';
    // Ticking while rewording.
    expect(edit(current, '- [ ] A real ride.', '- [x] A real ride on gravel.')).toBe(ticked);
    // Moving the ticked item to the other heading.
    expect(
      edit(
        current,
        '- [x] A real run.\n\n## Agent decisions\n',
        '\n## Agent decisions\n\n- [x] A real run.',
      ),
    ).toBe(ticked);
    // Deleting an open item.
    expect(edit(current, '- [ ] A real ride.\n', '')).toBe(
      'Items under ## Real-data checks are removed by the owner only (workbench/x/plan.md).',
    );
    // Rewording an open item.
    expect(edit(current, '- [ ] A real ride.', '- [ ] A real gravel ride.')).toBeUndefined();
    expect(edit(current, '**Batch 50.** Agent: fits.', '**Batch 40.** Agent: fits better.')).toBe(
      undefined,
    );
  });

  it('blocks Bash writes to a plan.md and folder deletes, lets reads and workbench tasks pass', () => {
    expect(bash("sed -i '' 's/idea/ready/' workbench/x/plan.md")).toBeDefined();
    expect(bash("cd workbench/x && sed -i '' 's/idea/ready/' plan.md")).toBeDefined();
    expect(bash('echo "status: ready" > workbench/x/plan.md')).toBeDefined();
    expect(bash('rm -r workbench/x')).toBeDefined();

    expect(bash('grep status workbench/x/plan.md')).toBeUndefined();
    expect(bash('grep -n x workbench/x/plan.md 2>&1')).toBeUndefined();
    expect(bash('vp run workbench:check')).toBeUndefined();
    expect(
      bash(
        'rm -rf workbench/x/review/before && cp -R workbench/x/review/after workbench/x/review/before',
      ),
    ).toBeUndefined();
  });

  it('applies the Bash rules per segment with cd tracking', () => {
    // Segments: a read of plan.md next to an unrelated writer passes.
    expect(bash('grep x plan.md && rm -rf /tmp/foo', '/repo/workbench/x')).toBeUndefined();
    expect(bash('git diff plan.md; cp a b', '/repo/workbench/x')).toBeUndefined();
    expect(bash('cat workbench/x/plan.md | tee /tmp/copy.md', '/repo')).toBeUndefined();
    expect(bash('grep x workbench/x/plan.md > /tmp/out', '/repo')).toBeUndefined();
    // A separator inside quotes does not split the writer from its plan.md.
    expect(bash("sed -i '' 's/a;b/c/' workbench/x/plan.md", '/repo')).toBeDefined();

    // cd is tracked across segments, relative to cwd.
    expect(bash('cd workbench && rm -rf dynamic-efforts', '/repo')).toBeDefined();
    expect(bash('cd workbench; cd x && rm -rf ../y', '/repo')).toBeDefined();
    expect(bash('cd x && echo "status: done" > plan.md', '/repo/workbench')).toBeDefined();
    expect(bash('cd /tmp && rm -rf dynamic-efforts', '/repo/workbench')).toBeUndefined();
    expect(bash('rm -rf ..', '/repo/workbench/x/review')).toBeDefined();
    expect(bash('rm -rf ..', '/repo/workbench/x/review/before')).toBeUndefined();
    expect(bash('cd .. && rm -rf .', '/repo/workbench/x/review')).toBeDefined();
    expect(bash('rm -rf workbench/*', '/repo')).toBeDefined();
    expect(bash('git rm -r workbench/x', '/repo')).toBeDefined();
    expect(bash('mv workbench/x workbench/y', '/repo')).toBeDefined();

    // find … -delete / -exec rm on the workbench.
    expect(bash('find workbench/x -delete', '/repo')).toBeDefined();
    expect(bash("find workbench -name '*.png' -exec rm {} +", '/repo')).toBeDefined();
    expect(bash('find . -name .DS_Store -delete', '/repo/workbench')).toBeDefined();
    expect(bash('find . -name .DS_Store -delete', '/repo')).toBeUndefined();
    expect(bash('find workbench -name plan.md', '/repo')).toBeUndefined();
  });
});
