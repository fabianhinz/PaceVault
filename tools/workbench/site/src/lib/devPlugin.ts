import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import type { Plugin, ViteDevServer } from 'vite';
import { readQuestions } from '../../../scripts/frontmatter.ts';

/**
 * The board's dev-server plugin: serves the mockup and review pages unchanged (`sirv`, as
 * standalone HTML) and `shared/`, answers `GET /<item>/questions.json` for the mockup shell, and
 * adds the backlog and `GUIDE.md` to Vite's watcher (both sit outside the Astro root `site/`).
 * Every watcher event there goes to the board as `wb:changed { path }`; the island refetches the
 * board. No page reload: files read with `fs` are in no module graph.
 *
 * Server code (R27): Astro memoizes the actions module and clears it only when a file under
 * `src/actions/` changes (`astro:actions-updated`), so an edit of `site/src/lib/*.ts` or
 * `scripts/*.ts` (imported by the actions) kept the old `board.read` until the actions file was
 * touched. A change there does what Astro does for the actions folder (invalidate the actions
 * entry, send `astro:actions-updated` to the server environments) and sends `wb:changed`.
 */

export type QuestionJson = { id: string; state: 'open' | 'answered'; date?: string; text: string };

export type ChangedPayload = { path: string };

const ARTIFACT = /^\/[a-z0-9-]+\/(mockup|review)\//;
const QUESTIONS = /^\/([a-z0-9-]+)\/questions\.json(?:\?.*)?$/;

/** tools/workbench/, for `/shared/…` (always the real one, also with WB_ROOT). */
const WORKBENCH = fileURLToPath(new URL('../../../', import.meta.url));

/** The questions of `<root>/<folder>/plan.md`; `[]` when the plan is missing. */
export const questionsJson = (root: string, folder: string): QuestionJson[] => {
  const file = join(root, folder, 'plan.md');
  if (!existsSync(file)) return [];
  return readQuestions(readFileSync(file, 'utf8')).map((question) => {
    const out: QuestionJson = { id: question.id, state: question.state, text: question.text };
    if (question.date !== undefined) out.date = question.date;
    return out;
  });
};

/** `path` relative to the backlog (`/` separators), `GUIDE.md`, or `undefined` outside both. */
export const changedPath = (root: string, guideFile: string, path: string): string | undefined => {
  if (path === guideFile) return 'GUIDE.md';
  const inside = relative(root, path);
  if (inside === '' || inside.startsWith('..') || isAbsolute(inside)) return undefined;
  return inside.split(sep).join('/');
};

/** The server modules behind `board.read` and the writes: the board's lib and the workbench scripts. */
const serverDirs = (workbench: string) => [
  join(workbench, 'site', 'src', 'lib'),
  join(workbench, 'scripts'),
];

/** `path` relative to tools/workbench/ (`/` separators) when it is a server module the actions import; `undefined` otherwise. */
export const serverModulePath = (workbench: string, path: string): string | undefined => {
  if (!/\.tsx?$/.test(path)) return undefined;
  if (!serverDirs(workbench).some((dir) => !relative(dir, path).startsWith('..'))) return undefined;
  return relative(workbench, path).split(sep).join('/');
};

/** Astro's resolved actions entry (`astro/dist/actions/consts.js`) and the environments that run it. */
const ACTIONS_ENTRY = '\0virtual:astro:actions/entrypoint';
const SERVER_ENVIRONMENTS = ['ssr', 'astro'];

/** Clears Astro's memoized actions in every server environment, so the next action call imports the edited module. */
const reloadActions = (server: ViteDevServer) => {
  for (const name of SERVER_ENVIRONMENTS) {
    const environment = server.environments[name];
    if (environment === undefined) continue;
    const entry = environment.moduleGraph.getModuleById(ACTIONS_ENTRY);
    if (entry !== undefined) environment.moduleGraph.invalidateModule(entry);
    environment.hot.send('astro:actions-updated', {});
  }
};

type Next = () => void;

export const workbenchFiles = (options: { root: string; guideFile: string }): Plugin => {
  const features = sirv(options.root, { dev: true });
  const shared = sirv(WORKBENCH, { dev: true });
  const handle = (req: IncomingMessage, res: ServerResponse, next: Next) => {
    const url = req.url ?? '';
    if (url.startsWith('/shared/')) return shared(req, res, next);
    const questions = QUESTIONS.exec(url);
    if (questions && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(questionsJson(options.root, questions[1])));
      return undefined;
    }
    if (ARTIFACT.test(url)) return features(req, res, next);
    return next();
  };
  const configureServer = (server: ViteDevServer) => {
    server.middlewares.use(handle);
    server.watcher.add([options.root, options.guideFile]);
    server.watcher.add(serverDirs(WORKBENCH));
    server.watcher.on('all', (_event: string, path: string) => {
      const module = serverModulePath(WORKBENCH, path);
      if (module !== undefined) {
        reloadActions(server);
        const payload: ChangedPayload = { path: module };
        server.ws.send('wb:changed', payload);
        return;
      }
      const changed = changedPath(options.root, options.guideFile, path);
      if (changed === undefined) return;
      const payload: ChangedPayload = { path: changed };
      server.ws.send('wb:changed', payload);
    });
  };
  return { name: 'workbench-files', configureServer };
};
