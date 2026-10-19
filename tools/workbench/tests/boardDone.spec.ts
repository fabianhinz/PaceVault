import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The board's actions run under `astro dev`; here `defineAction` hands back its config, so the
// handlers run directly against a fixture workbench (WB_ROOT).
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

type Handler = (input: Record<string, unknown>) => {
  name: string;
  folder?: { folder: string; files: string[]; state: string };
};

const planText = (status: string) =>
  `---\ntitle: X\nstatus: ${status}\ncreated: 2026-10-18\ntype: chore\nareas: [workbench]\nnext: Something\n---\n\n# X\n\nText.\n`;

const STATUSES = ['idea', 'exploring', 'planned', 'ready', 'in-dev', 'in-review', 'done'];

let root = '';
let handlers: { setStatus: Handler; remove: Handler; undo: Handler } | undefined = undefined;
let readItem: (typeof import('../site/src/lib/board.ts'))['readItem'] | undefined = undefined;

const item = (folder: string, status: string) => {
  mkdirSync(join(root, folder, 'review', 'before'), { recursive: true });
  writeFileSync(join(root, folder, 'plan.md'), planText(status));
  writeFileSync(join(root, folder, 'tech.md'), '# Tech\n');
  writeFileSync(join(root, folder, 'review', 'before', 'a.png'), Buffer.from([0, 255, 1, 254]));
};

const need = () => {
  if (handlers === undefined || readItem === undefined) throw new Error('not loaded');
  return { handlers, readItem };
};

describe('boardDone', () => {
  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'wb-done-'));
    vi.stubEnv('WB_ROOT', root);
    vi.resetModules();
    const actions = await import('../site/src/actions/index.ts');
    const server = actions.server as unknown as {
      plan: { setStatus: { handler: Handler } };
      item: { delete: { handler: Handler } };
      undo: { handler: Handler };
    };
    handlers = {
      setStatus: server.plan.setStatus.handler,
      remove: server.item.delete.handler,
      undo: server.undo.handler,
    };
    readItem = (await import('../site/src/lib/board.ts')).readItem;
  });
  afterAll(() => {
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  });

  it('sets done only from in-review', () => {
    const loaded = need();
    for (const status of STATUSES.filter((value) => value !== 'in-review' && value !== 'done')) {
      item(`from-${status}`, status);
      expect(
        () =>
          loaded.handlers.setStatus({
            item: `from-${status}`,
            expected: `status: ${status}`,
            to: 'done',
          }),
        status,
      ).toThrow('Only reviewed work is accepted as done.');
    }
    item('reviewed', 'in-review');
    loaded.handlers.setStatus({ item: 'reviewed', expected: 'status: in-review', to: 'done' });
    expect(readFileSync(join(root, 'reviewed', 'plan.md'), 'utf8')).toBe(planText('done'));
  });

  it('offers done only to in-review cards and only in-review to done cards', () => {
    const loaded = need();
    for (const status of STATUSES) item(`moves-${status}`, status);
    const movesOf = (status: string) => loaded.readItem(root, `moves-${status}`)?.moves;
    expect(movesOf('in-review')).toContain('done');
    expect(movesOf('done')).toEqual(['in-review']);
    for (const status of STATUSES.filter((value) => value !== 'in-review')) {
      expect(movesOf(status), status).not.toContain('done');
    }
  });

  it('deletes a folder without a trash and restores every file on Undo', () => {
    const loaded = need();
    item('gone', 'planned');
    const plan = readFileSync(join(root, 'gone', 'plan.md'));
    const png = readFileSync(join(root, 'gone', 'review', 'before', 'a.png'));

    const result = loaded.handlers.remove({ item: 'gone' });
    expect(result.folder).toEqual({
      folder: 'gone',
      files: ['plan.md', 'review/before/a.png', 'tech.md'],
      state: 'deleted',
    });
    expect(existsSync(join(root, 'gone'))).toBe(false);
    expect(existsSync(join(root, '.trash'))).toBe(false);

    const undone = loaded.handlers.undo({ name: 'item.delete', changes: [], folder: 'gone' });
    expect(undone.name).toBe('undo item.delete');
    expect(readFileSync(join(root, 'gone', 'plan.md'))).toEqual(plan);
    expect(readFileSync(join(root, 'gone', 'review', 'before', 'a.png'))).toEqual(png);
    expect(readFileSync(join(root, 'gone', 'tech.md'), 'utf8')).toBe('# Tech\n');
  });

  it('holds only the last delete: an older folder is no longer restorable', () => {
    const loaded = need();
    item('first', 'idea');
    item('second', 'idea');
    loaded.handlers.remove({ item: 'first' });
    loaded.handlers.remove({ item: 'second' });
    expect(() =>
      loaded.handlers.undo({ name: 'item.delete', changes: [], folder: 'first' }),
    ).toThrow('is no longer held');
    expect(existsSync(join(root, 'first'))).toBe(false);
  });
});
