import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// As boardDone.spec.ts: `defineAction` hands back its config, so the handlers run directly
// against a fixture workbench (WB_ROOT).
vi.mock('astro:actions', () => ({
  ActionError: class ActionError extends Error {
    code: string;
    constructor(options: { code: string; message: string }) {
      super(options.message);
      this.code = options.code;
    }
  },
  defineAction: (config: unknown) => config,
}));

type Result = {
  name: string;
  notes: string[];
  changes: { path: string; before: string; after: string }[];
};
type Handler = (input: Record<string, unknown>) => Result;
type Board = typeof import('../site/src/lib/board.ts');

const planText = (status: string, rest = '') =>
  `---\ntitle: ${status} item\nstatus: ${status}\ncreated: 2026-10-19\ntype: chore\nareas: [workbench]\nnext: Something\n---\n\n# X\n\nText.\n${rest}`;
const DECISION = '- [ ] **Batch 50.** Agent: fits.';
const decisionsText = (items: string) => `## Agent decisions\n\n${items}\n`;
const findingsText = (items: string) => `# Review findings: X\n\n## Round 1\n\n${items}\n`;

let root = '';
let board: Board | undefined = undefined;
let handlers:
  | { setStatus: Handler; toggle: Handler; remove: Handler; flaky: Handler; undo: Handler }
  | undefined = undefined;

const need = () => {
  if (board === undefined || handlers === undefined) throw new Error('not loaded');
  return { board, handlers };
};

/** A fixture item folder; `files` relative to it. */
const item = (folder: string, status: string, rest = '', files: Record<string, string> = {}) => {
  mkdirSync(join(root, folder, 'review'), { recursive: true });
  writeFileSync(join(root, folder, 'plan.md'), planText(status, rest));
  writeFileSync(join(root, folder, 'tech.md'), '# Tech\n');
  for (const entry of Object.entries(files)) writeFileSync(join(root, folder, entry[0]), entry[1]);
};

const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('board', () => {
  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'wb-board-'));
    vi.stubEnv('WB_ROOT', root);
    vi.resetModules();
    const actions = await import('../site/src/actions/index.ts');
    const server = actions.server as unknown as {
      plan: { setStatus: { handler: Handler } };
      review: { toggleDecision: { handler: Handler }; deleteDecision: { handler: Handler } };
      flaky: { remove: { handler: Handler } };
      undo: { handler: Handler };
    };
    handlers = {
      setStatus: server.plan.setStatus.handler,
      toggle: server.review.toggleDecision.handler,
      remove: server.review.deleteDecision.handler,
      flaky: server.flaky.remove.handler,
      undo: server.undo.handler,
    };
    board = await import('../site/src/lib/board.ts');
  });
  afterAll(() => {
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  });

  it('enables the Review tab for a doc, findings or agent decisions, and reads type and areas', () => {
    const loaded = need();
    item('plain', 'planned', '', { 'review/notes.txt': 'x' });
    item('only-decisions', 'planned', '', { 'review/decisions.md': decisionsText(DECISION) });
    item('only-findings', 'planned', '', {
      'review/findings.md': findingsText('- **R1** · open · general · a'),
    });
    item('with-doc', 'in-review', '', { 'review/index.html': '<p>doc</p>' });
    const view = (folder: string) => loaded.board.readItem(root, folder);
    expect(view('plain')?.has.review).toBe(false);
    expect(view('only-decisions')?.has.review).toBe(true);
    expect(view('only-decisions')?.reviewDoc).toBe(false);
    expect(view('only-decisions')?.decisions).toEqual([
      { text: '**Batch 50.** Agent: fits.', checked: false, raw: DECISION },
    ]);
    expect(view('only-findings')?.has.review).toBe(true);
    expect(view('with-doc')?.reviewDoc).toBe(true);

    expect(view('plain')?.type).toBe('chore');
    expect(view('plain')?.areas).toEqual(['workbench']);
    item('old-done', 'done');
    writeFileSync(
      join(root, 'old-done', 'plan.md'),
      planText('done').replace('type: chore\nareas: [workbench]\n', ''),
    );
    expect(view('old-done')?.type).toBeUndefined();
    expect(view('old-done')?.areas).toEqual([]);
    expect(Object.keys(loaded.board.TYPE_COLOR)).toEqual(['feature', 'bug', 'chore']);
    expect(new Set(Object.values(loaded.board.TYPE_COLOR)).size).toBe(3);
  });

  it('lists what needs the owner by reason; a done item only for agent decisions', () => {
    const loaded = need();
    item('needs-review', 'in-review', '', {
      'review/findings.md': findingsText(
        '- **R1** · open · general · a\n- **R2** · fixed · general · b\n- **R3** · open · on C1 · c',
      ),
    });
    item(
      'needs-answers',
      'planned',
      '\n## Open questions\n\n- **Q1** · open · Which?\n- **Q2** · open · Where?\n- **Q3** · answered 2026-10-19 · How? Owner: "so"\n',
    );
    item('needs-ticks', 'done', '', {
      'review/decisions.md': decisionsText(`${DECISION}\n- [x] **Ticked.** Agent: yes.`),
      'review/findings.md': findingsText('- **R1** · open · general · a'),
    });
    item('needs-nothing', 'idea', '', {
      'review/decisions.md': decisionsText('- [x] **Ticked.** Agent: yes.'),
    });
    const items = ['needs-review', 'needs-answers', 'needs-ticks', 'needs-nothing'].flatMap(
      (folder) => {
        const view = loaded.board.readItem(root, folder);
        if (view === undefined) return [];
        return [view];
      },
    );
    expect(items).toHaveLength(4);
    expect(
      loaded.board.needsYou(items).map((entry) => [entry.reason, entry.folder, entry.count]),
    ).toEqual([
      ['questions', 'needs-answers', 2],
      ['decisions', 'needs-ticks', 1],
      ['findings', 'needs-review', 2],
    ]);
    expect(loaded.board.REASON_TAB).toEqual({
      questions: 'plan',
      decisions: 'review',
      findings: 'review',
    });
  });

  it('ticks and deletes agent decisions in review/decisions.md, with Undo', () => {
    const loaded = need();
    item('decide', 'in-review', '', {
      'review/decisions.md': decisionsText(`${DECISION}\n- [ ] **Desktop.** Agent: frame.`),
    });
    const path = 'decide/review/decisions.md';
    const plan = read('decide/plan.md');
    const ticked = loaded.handlers.toggle({ item: 'decide', expected: DECISION, checked: 'true' });
    expect(ticked.name).toBe('review.toggleDecision');
    expect(read(path)).toBe(
      decisionsText('- [x] **Batch 50.** Agent: fits.\n- [ ] **Desktop.** Agent: frame.'),
    );
    expect(read('decide/plan.md')).toBe(plan);
    loaded.handlers.undo({ name: ticked.name, changes: ticked.changes });
    expect(read(path)).toBe(decisionsText(`${DECISION}\n- [ ] **Desktop.** Agent: frame.`));

    loaded.handlers.remove({ item: 'decide', expected: '- [ ] **Desktop.** Agent: frame.' });
    expect(read(path)).toBe(decisionsText(DECISION));
    expect(() =>
      loaded.handlers.toggle({
        item: 'decide',
        expected: '- [ ] **Gone.** Agent: x.',
        checked: 'true',
      }),
    ).toThrow('changed since the board rendered it');
  });

  it('notes unconfirmed agent decisions on the move to ready', () => {
    const loaded = need();
    item('to-ready', 'planned', '', { 'review/decisions.md': decisionsText(DECISION) });
    const result = loaded.handlers.setStatus({
      item: 'to-ready',
      expected: 'status: planned',
      to: 'ready',
    });
    expect(result.notes).toEqual(['1 agent decision(s) not confirmed.']);
    item('to-ready-clean', 'planned');
    expect(
      loaded.handlers.setStatus({
        item: 'to-ready-clean',
        expected: 'status: planned',
        to: 'ready',
      }).notes,
    ).toEqual([]);
  });

  it('removes a flaky.md entry', () => {
    const loaded = need();
    writeFileSync(
      join(root, 'flaky.md'),
      '# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n- `b.spec.ts:2` · y\n',
    );
    loaded.handlers.flaky({ expected: '- `b.spec.ts:2` · y' });
    expect(read('flaky.md')).toBe('# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n');
  });
});
