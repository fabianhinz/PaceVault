import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { isAbsolute, join, relative, sep } from 'node:path';
import sirv from 'sirv';
import type { Plugin, ViteDevServer } from 'vite';
import { readQuestions } from '../../../scripts/frontmatter.ts';
import { WORKBENCH_DIR } from '../../../scripts/paths.ts';

/**
 * Server code: Astro memoizes the actions module and clears it only when a file under
 * `src/actions/` changes (`astro:actions-updated`), so an edit of `site/src/lib/*.ts` or
 * `scripts/*.ts` (imported by the actions) kept the old `board.read` until the actions file was
 * touched. A change there does what Astro does for the actions folder (invalidate the actions
 * entry, send `astro:actions-updated` to the server environments) and sends `wb:changed`.
 */

type QuestionJson = { id: string; state: 'open' | 'answered'; date?: string; text: string };

export type ChangedPayload = { path: string };

const ARTIFACT = /^\/[a-z0-9-]+\/(mockup|review)\//;
const QUESTIONS = /^\/([a-z0-9-]+)\/questions\.json(?:\?.*)?$/;

const questionsJson = ({ root, folder }: { root: string; folder: string }): QuestionJson[] => {
  const file = join(root, folder, 'plan.md');
  if (!existsSync(file)) return [];
  return readQuestions(readFileSync(file, 'utf8')).map((question) => {
    const questionJson: QuestionJson = {
      id: question.id,
      state: question.state,
      text: question.text,
    };
    if (question.date !== undefined) questionJson.date = question.date;
    return questionJson;
  });
};

const changedPath = ({
  root,
  guideFile,
  path,
}: {
  root: string;
  guideFile: string;
  path: string;
}): string | undefined => {
  if (path === guideFile) return 'GUIDE.md';
  const inside = relative(root, path);
  if (inside === '' || inside.startsWith('..') || isAbsolute(inside)) return undefined;
  return inside.split(sep).join('/');
};

const serverDirs = (workbench: string) => [
  join(workbench, 'site', 'src', 'lib'),
  join(workbench, 'scripts'),
];

export const serverModulePath = ({
  workbench,
  path,
}: {
  workbench: string;
  path: string;
}): string | undefined => {
  if (!/\.tsx?$/.test(path)) return undefined;
  if (!serverDirs(workbench).some((dir) => !relative(dir, path).startsWith('..'))) return undefined;
  return relative(workbench, path).split(sep).join('/');
};

const ACTIONS_ENTRY = '\0virtual:astro:actions/entrypoint';
const SERVER_ENVIRONMENTS = ['ssr', 'astro'];

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
  const backlogFiles = sirv(options.root, { dev: true });
  const sharedFiles = sirv(WORKBENCH_DIR, { dev: true });
  const handle = (req: IncomingMessage, res: ServerResponse, next: Next) => {
    const url = req.url ?? '';
    if (url.startsWith('/shared/')) return sharedFiles(req, res, next);
    const questions = QUESTIONS.exec(url);
    if (questions && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(questionsJson({ root: options.root, folder: questions[1] })));
      return undefined;
    }
    if (ARTIFACT.test(url)) return backlogFiles(req, res, next);
    return next();
  };
  const configureServer = (server: ViteDevServer) => {
    server.middlewares.use(handle);
    server.watcher.add([options.root, options.guideFile]);
    server.watcher.add(serverDirs(WORKBENCH_DIR));
    server.watcher.on('all', (_event: string, path: string) => {
      const module = serverModulePath({ workbench: WORKBENCH_DIR, path });
      if (module !== undefined) {
        reloadActions(server);
        const payload: ChangedPayload = { path: module };
        server.ws.send('wb:changed', payload);
        return;
      }
      const changed = changedPath({ root: options.root, guideFile: options.guideFile, path });
      if (changed === undefined) return;
      const payload: ChangedPayload = { path: changed };
      server.ws.send('wb:changed', payload);
    });
  };
  return { name: 'workbench-files', configureServer };
};
