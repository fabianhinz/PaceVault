import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ViteDevServer } from 'vite';
import { serverModulePath, workbenchFiles } from '../site/src/lib/devPlugin.ts';

// A fake dev server: the watcher is an EventEmitter (chokidar emits 'all' with event and path),
// `ws.send` and `middlewares.use` are spies.
class FakeWatcher extends EventEmitter {
  add = vi.fn();
}

type Handle = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

const PLAN = `---
title: Q item
status: planned
created: 2026-10-20
type: chore
areas: [workbench]
next: Answer
---

# Q item

## Open questions

- **Q1** · open · Which? (a) one (b) two
- **Q2** · answered 2026-10-19 · Where? → (a). Owner: "a"
`;

let root = '';
let guideFile = '';

const start = () => {
  const watcher = new FakeWatcher();
  const send = vi.fn();
  const use = vi.fn();
  // the server environments Astro runs the actions in: module graph and hot channel
  const environment = () => {
    const entry = { id: 'entry' };
    return {
      entry,
      moduleGraph: {
        getModuleById: vi.fn((id: string) =>
          id === '\0virtual:astro:actions/entrypoint' ? entry : undefined,
        ),
        invalidateModule: vi.fn(),
      },
      hot: { send: vi.fn() },
    };
  };
  const environments = { ssr: environment(), astro: environment() };
  const server = { watcher, ws: { send }, middlewares: { use }, environments };
  const plugin = workbenchFiles({ root, guideFile });
  const configure = plugin.configureServer as (server: ViteDevServer) => void;
  configure(server as unknown as ViteDevServer);
  const handle = use.mock.calls[0][0] as Handle;
  return { watcher, send, handle, environments };
};

/** Runs the middleware for a GET of `url`; `body` is what it answered, `next` whether it passed. */
const get = (handle: Handle, url: string) => {
  const end = vi.fn();
  const setHeader = vi.fn();
  const next = vi.fn();
  const req = { url, method: 'GET' } as unknown as IncomingMessage;
  const res = { end, setHeader } as unknown as ServerResponse;
  handle(req, res, next);
  let body: unknown = undefined;
  if (end.mock.calls.length > 0) body = JSON.parse(String(end.mock.calls[0][0]));
  return { body, next: next.mock.calls.length > 0, setHeader };
};

describe('dev plugin', () => {
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'wb-plugin-'));
    mkdirSync(join(root, 'q-item'));
    writeFileSync(join(root, 'q-item', 'plan.md'), PLAN);
    guideFile = join(root, '..', 'GUIDE.md');
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('watches the backlog and GUIDE.md and sends wb:changed for changes there', () => {
    const server = start();
    expect(server.watcher.add).toHaveBeenCalledWith([root, guideFile]);
    server.watcher.emit('all', 'change', join(root, 'q-item', 'plan.md'));
    expect(server.send).toHaveBeenLastCalledWith('wb:changed', { path: 'q-item/plan.md' });
    server.watcher.emit('all', 'add', join(root, 'q-item', 'review', 'decisions.md'));
    expect(server.send).toHaveBeenLastCalledWith('wb:changed', {
      path: 'q-item/review/decisions.md',
    });
    server.watcher.emit('all', 'change', guideFile);
    expect(server.send).toHaveBeenLastCalledWith('wb:changed', { path: 'GUIDE.md' });
    expect(server.send).toHaveBeenCalledTimes(3);
    server.watcher.emit('all', 'change', join(root, '..', 'elsewhere.ts'));
    server.watcher.emit('all', 'addDir', root);
    expect(server.send).toHaveBeenCalledTimes(3);
  });

  it('maps the server modules behind the actions (site/src/lib, scripts) and nothing else', () => {
    expect(serverModulePath('/wb', '/wb/site/src/lib/board.ts')).toBe('site/src/lib/board.ts');
    expect(serverModulePath('/wb', '/wb/scripts/frontmatter.ts')).toBe('scripts/frontmatter.ts');
    expect(serverModulePath('/wb', '/wb/site/src/app/Board.tsx')).toBe(undefined);
    expect(serverModulePath('/wb', '/wb/scripts/notes.md')).toBe(undefined);
    expect(serverModulePath('/wb', '/wb/scriptsx/a.ts')).toBe(undefined);
  });

  it('reloads the actions and sends wb:changed when a server module changes (R27)', () => {
    const server = start();
    const board = fileURLToPath(new URL('../site/src/lib/board.ts', import.meta.url));
    server.watcher.emit('all', 'change', board);
    for (const environment of Object.values(server.environments)) {
      expect(environment.moduleGraph.invalidateModule).toHaveBeenCalledWith(environment.entry);
      expect(environment.hot.send).toHaveBeenCalledWith('astro:actions-updated', {});
    }
    expect(server.send).toHaveBeenLastCalledWith('wb:changed', { path: 'site/src/lib/board.ts' });
  });

  it("answers GET /<item>/questions.json with the plan's questions", () => {
    const server = start();
    const answer = get(server.handle, '/q-item/questions.json');
    expect(answer.next).toBe(false);
    expect(answer.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json; charset=utf-8',
    );
    expect(answer.body).toEqual([
      { id: 'Q1', state: 'open', text: 'Which? (a) one (b) two' },
      { id: 'Q2', state: 'answered', date: '2026-10-19', text: 'Where? → (a). Owner: "a"' },
    ]);
    expect(get(server.handle, '/q-item/questions.json?t=1').body).toHaveLength(2);
    expect(get(server.handle, '/missing/questions.json').body).toEqual([]);
    expect(get(server.handle, '/').next).toBe(true);
  });
});
