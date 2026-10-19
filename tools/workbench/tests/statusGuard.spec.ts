import { decide } from '../scripts/statusGuard.ts';

const FILE = '/repo/tools/workbench/backlog/x/plan.md';
const DECISIONS_FILE = '/repo/tools/workbench/backlog/x/review/decisions.md';

const planText = (status: string, rest = '') =>
  `---\ntitle: X\nstatus: ${status}\ncreated: 2026-10-18\ntype: chore\nareas: [workbench]\nnext: Something\n---\n\n# X\n\nText.\n${rest}`;

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
        `status: ${pair[0]} → ${pair[1]} is owner-only or skips a gate (tools/workbench/backlog/x/plan.md). Ask the owner.`,
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

  it('blocks ticking real-data checks, allows adding open items', () => {
    const current = planText('in-review', '\n## Real-data checks\n\n- [ ] A real ride.\n');
    expect(edit(current, '- [ ] A real ride.', '- [x] A real ride.')).toBe(
      'Real-data checks are ticked by the owner only (tools/workbench/backlog/x/plan.md).',
    );
    expect(
      edit(current, '- [ ] A real ride.', '- [ ] A real ride.\n- [ ] A Strava ZIP.'),
    ).toBeUndefined();
    // A plan without the section (agent decisions live in review/decisions.md) still passes.
    expect(edit(planText('in-review'), 'Text.', 'More text.')).toBeUndefined();
  });

  it('counts ticks and items of the real-data checks', () => {
    const current = planText(
      'in-review',
      '\n## Real-data checks\n\n- [ ] A real ride.\n- [x] A real run.\n\n## Notes\n\nText.\n',
    );
    const ticked =
      'Real-data checks are ticked by the owner only (tools/workbench/backlog/x/plan.md).';
    const removed =
      'Items under ## Real-data checks are removed by the owner only (tools/workbench/backlog/x/plan.md).';
    // Ticking while rewording.
    expect(edit(current, '- [ ] A real ride.', '- [x] A real ride on gravel.')).toBe(ticked);
    // Deleting an open item.
    expect(edit(current, '- [ ] A real ride.\n', '')).toBe(removed);
    // Moving an item out of the section.
    expect(
      edit(
        current,
        '- [ ] A real ride.\n- [x] A real run.\n\n## Notes\n',
        '- [x] A real run.\n\n## Notes\n\n- [ ] A real ride.\n',
      ),
    ).toBe(removed);
    // Rewording an open item.
    expect(edit(current, '- [ ] A real ride.', '- [ ] A real gravel ride.')).toBeUndefined();
  });

  it('guards review/decisions.md: create and add open items, never tick or remove one', () => {
    const decisions = (items: string) => `## Agent decisions\n\n${items}\n`;
    const writeDecisions = (content: string, current: string | undefined) =>
      decide({ tool_name: 'Write', tool_input: { file_path: DECISIONS_FILE, content } }, current);
    const editDecisions = (current: string, oldString: string, newString: string) =>
      decide(
        {
          tool_name: 'Edit',
          tool_input: { file_path: DECISIONS_FILE, old_string: oldString, new_string: newString },
        },
        current,
      );
    const open = decisions('- [ ] **Batch 50.** Agent: fits.');
    const ticked =
      'Agent decisions are ticked by the owner only (tools/workbench/backlog/x/review/decisions.md).';
    const removed =
      'Items under ## Agent decisions are removed by the owner only (tools/workbench/backlog/x/review/decisions.md).';

    expect(writeDecisions(open, undefined)).toBeUndefined();
    expect(writeDecisions(decisions('- [x] **Batch 50.** Agent: fits.'), undefined)).toBe(ticked);
    expect(
      editDecisions(open, 'fits.', 'fits.\n- [ ] **Desktop at 1280.** Agent: shell frame.'),
    ).toBeUndefined();
    expect(editDecisions(open, '- [ ] **Batch', '- [x] **Batch')).toBe(ticked);
    expect(editDecisions(open, '- [ ] **Batch 50.** Agent: fits.', '')).toBe(removed);
    expect(writeDecisions(decisions(''), open)).toBe(removed);
    expect(editDecisions(open, '**Batch 50.**', '**Batch 40.**')).toBeUndefined();

    const file = 'tools/workbench/backlog/x/review/decisions.md';
    expect(bash(`sed -i '' 's/a/b/' ${file}`)).toBeDefined();
    expect(bash(`rm ${file}`)).toBeDefined();
    expect(bash(`echo "- [x] a" >> ${file}`)).toBeDefined();
    expect(bash(`cat ${file}`)).toBeUndefined();
  });

  it('blocks Bash writes to a plan.md and folder deletes, lets reads and workbench tasks pass', () => {
    expect(bash("sed -i '' 's/idea/ready/' tools/workbench/backlog/x/plan.md")).toBeDefined();
    expect(bash("cd tools/workbench/backlog/x && sed -i '' 's/idea/ready/' plan.md")).toBeDefined();
    expect(bash('echo "status: ready" > tools/workbench/backlog/x/plan.md')).toBeDefined();
    expect(bash('rm -r tools/workbench/backlog/x')).toBeDefined();

    expect(bash('grep status tools/workbench/backlog/x/plan.md')).toBeUndefined();
    expect(bash('grep -n x tools/workbench/backlog/x/plan.md 2>&1')).toBeUndefined();
    expect(bash('vp run workbench:check')).toBeUndefined();
    expect(
      bash(
        'rm -rf tools/workbench/backlog/x/review/before && cp -R tools/workbench/backlog/x/review/after tools/workbench/backlog/x/review/before',
      ),
    ).toBeUndefined();
  });

  it('applies the Bash rules per segment with cd tracking', () => {
    // Segments: a read of plan.md next to an unrelated writer passes.
    expect(
      bash('grep x plan.md && rm -rf /tmp/foo', '/repo/tools/workbench/backlog/x'),
    ).toBeUndefined();
    expect(bash('git diff plan.md; cp a b', '/repo/tools/workbench/backlog/x')).toBeUndefined();
    expect(
      bash('cat tools/workbench/backlog/x/plan.md | tee /tmp/copy.md', '/repo'),
    ).toBeUndefined();
    expect(bash('grep x tools/workbench/backlog/x/plan.md > /tmp/out', '/repo')).toBeUndefined();
    // A separator inside quotes does not split the writer from its plan.md.
    expect(bash("sed -i '' 's/a;b/c/' tools/workbench/backlog/x/plan.md", '/repo')).toBeDefined();

    // cd is tracked across segments, relative to cwd.
    expect(bash('cd tools/workbench/backlog && rm -rf dynamic-efforts', '/repo')).toBeDefined();
    expect(bash('cd tools/workbench/backlog; cd x && rm -rf ../y', '/repo')).toBeDefined();
    expect(
      bash('cd x && echo "status: done" > plan.md', '/repo/tools/workbench/backlog'),
    ).toBeDefined();
    expect(
      bash('cd /tmp && rm -rf dynamic-efforts', '/repo/tools/workbench/backlog'),
    ).toBeUndefined();
    expect(bash('rm -rf ..', '/repo/tools/workbench/backlog/x/review')).toBeDefined();
    expect(bash('rm -rf ..', '/repo/tools/workbench/backlog/x/review/before')).toBeUndefined();
    expect(bash('cd .. && rm -rf .', '/repo/tools/workbench/backlog/x/review')).toBeDefined();
    expect(bash('rm -rf tools/workbench/backlog/*', '/repo')).toBeDefined();
    expect(bash('git rm -r tools/workbench/backlog/x', '/repo')).toBeDefined();
    expect(bash('mv tools/workbench/backlog/x tools/workbench/backlog/y', '/repo')).toBeDefined();

    // find … -delete / -exec rm on the workbench.
    expect(bash('find tools/workbench/backlog/x -delete', '/repo')).toBeDefined();
    expect(bash("find tools/workbench/backlog -name '*.png' -exec rm {} +", '/repo')).toBeDefined();
    expect(bash('find . -name .DS_Store -delete', '/repo/tools/workbench/backlog')).toBeDefined();
    expect(bash('find . -name .DS_Store -delete', '/repo')).toBeUndefined();
    expect(bash('find tools/workbench/backlog -name plan.md', '/repo')).toBeUndefined();
  });
});
