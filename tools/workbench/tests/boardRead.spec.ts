import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// As board.spec.ts: `defineAction` hands back its config, so `board.read` runs directly against
// a fixture workbench (WB_ROOT).
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

type BoardView = Awaited<ReturnType<(typeof import('../site/src/lib/board.ts'))['readBoard']>>;
type Read = () => Promise<BoardView>;
type RenderTech = (typeof import('../site/src/lib/board.ts'))['renderTech'];

const planText = (title: string, created: string, rest = '') =>
  `---\ntitle: ${title}\nstatus: idea\ncreated: ${created}\ntype: feature\nareas: [app]\nnext: Something\n---\n\n# ${title}\n\nText.\n${rest}`;

const TECH = [
  '# Tech',
  '',
  '## Data flow',
  '',
  '```mermaid',
  'flowchart LR',
  '  a["<b>A</b>"] --> b',
  '```',
  '',
  '## Modules',
  '',
  '```ts',
  'export const one = 1;',
  '```',
  '',
  '```zig',
  'const x = a < b;',
  '```',
  '',
  '### New',
  '',
  '- `src/a.ts`: the `one` constant',
  '',
  '### Changed',
  '',
  '- `package.json`',
  '',
].join('\n');

let root = '';
let read: Read | undefined = undefined;
let renderTech: RenderTech | undefined = undefined;

const need = () => {
  if (read === undefined || renderTech === undefined) throw new Error('not loaded');
  return { read, renderTech };
};

const item = (folder: string, plan: string, files: Record<string, string> = {}) => {
  mkdirSync(join(root, folder, 'review'), { recursive: true });
  writeFileSync(join(root, folder, 'plan.md'), plan);
  for (const entry of Object.entries(files)) writeFileSync(join(root, folder, entry[0]), entry[1]);
};

describe('board.read', () => {
  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'wb-read-'));
    vi.stubEnv('WB_ROOT', root);
    vi.resetModules();
    const actions = await import('../site/src/actions/index.ts');
    const server = actions.server as unknown as { board: { read: { handler: Read } } };
    read = server.board.read.handler;
    renderTech = (await import('../site/src/lib/board.ts')).renderTech;
    item('b-later', planText('Later', '2026-10-02'));
    item(
      'a-first',
      planText('First', '2026-10-01', '\n## Open questions\n\n- **Q1** · open · Which?\n'),
    );
    item('c-same-day', planText('Same day', '2026-10-01'), { 'tech.md': TECH });
    item('zz-broken', '---\ntitle: Broken\nstatus: nope\n---\n\n# Broken\n');
    writeFileSync(
      join(root, 'flaky.md'),
      '# Known-flaky tests\n\nIntro.\n\n- `a.spec.ts:1` · x\n- `b.spec.ts:2` · y\n',
    );
  });
  afterAll(() => {
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
  });

  it('returns the items in created, then folder order, with Needs you, flaky and errors', async () => {
    const board = await need().read();
    expect(board.items.map((entry) => entry.folder)).toEqual(['a-first', 'c-same-day', 'b-later']);
    expect(board.needs.map((entry) => [entry.reason, entry.folder, entry.count])).toEqual([
      ['questions', 'a-first', 1],
    ]);
    expect(board.flaky.map((entry) => entry.first)).toEqual([
      '- `a.spec.ts:1` · x',
      '- `b.spec.ts:2` · y',
    ]);
    expect(board.errors.some((error) => error.includes('backlog/zz-broken/plan.md'))).toBe(true);
    expect(board.items.find((entry) => entry.folder === 'b-later')?.techHtml).toBeUndefined();
  });

  it('renders the guide without its H1', async () => {
    const board = await need().read();
    expect(board.guideHtml).toContain('Step by step');
    expect(board.guideHtml).not.toContain('How to work with the backlog');
  });

  it('renders tech.md: Shiki code, plain code for an unloaded language, Mermaid as code, headings as written', async () => {
    const board = await need().read();
    const tech = board.items.find((entry) => entry.folder === 'c-same-day');
    const html = tech?.techHtml ?? '';
    expect(html).toContain('<h2>Modules</h2>');
    expect(html).toContain('<h1>Tech</h1>');
    expect(html).toMatch(/<pre class="shiki github-dark"[^>]*>/);
    expect(html).toContain('<pre><code>const x = a &lt; b;</code></pre>');
    expect(html).toContain(
      '<pre class="mermaid">flowchart LR\n  a[&quot;&lt;b&gt;A&lt;/b&gt;&quot;] --&gt; b</pre>',
    );
    expect(tech?.actualHtml).toContain('vp run workbench:deps -- c-same-day');
    expect(await need().renderTech('<script>x</script>\n')).toBe(
      '<p>&lt;script&gt;x&lt;/script&gt;</p>\n',
    );
  });

  it('reads review/interfaces.md as the Actual side of Interfaces, the command before the script ran', async () => {
    const before = await need().read();
    const empty = before.items.find((entry) => entry.folder === 'c-same-day')?.actualHtml ?? '';
    expect(empty).toContain(
      '<figure class="tt-fig tt-actual" data-block="interfaces-actual"><div class="tt-fig__bar"><span class="tt-fig__label">Actual</span><span class="tt-fig__path">review/interfaces.md</span></div><p class="tt-placeholder">Run <code>vp run workbench:deps -- c-same-day</code></p></figure>',
    );
    writeFileSync(
      join(root, 'c-same-day', 'review', 'interfaces.md'),
      '# Interfaces · c-same-day\n\nGenerated 2026-10-21 by `vp run workbench:deps -- c-same-day` from the TypeScript files changed since the base (as `files.json`): 1 planned, 1 not planned.\n\n```ts\n// src/a.ts\nexport const one: 1;\n```\n\n```ts\n// src/extra.ts · not planned\nexport const two: 2;\n```\n\n## Missing\n\n- `src/gone.ts`: planned, not changed\n',
    );
    const board = await need().read();
    const html = board.items.find((entry) => entry.folder === 'c-same-day')?.actualHtml ?? '';
    expect(html).toContain('data-block="interfaces-actual"');
    expect(html).toContain('review/interfaces.md · 2026-10-21');
    expect(html).toMatch(/<pre class="shiki github-dark"[^>]*>/);
    expect(html).toContain('src/extra.ts · not planned');
    expect(html).toContain('Changed TypeScript files: 1 planned · 1 not planned');
    expect(html).toContain('Planned, not changed: <code>src/gone.ts</code>');
  });

  it('reads review/files.json and components.mmd as Actual sides, the command while missing', async () => {
    const actualOf = async () =>
      (await need().read()).items.find((entry) => entry.folder === 'c-same-day')?.actualHtml ?? '';
    const before = await actualOf();
    expect(before).toContain('review/files.json</span></div><p class="tt-placeholder">Run');
    expect(before).toContain('review/components.mmd</span></div><p class="tt-placeholder">Run');
    writeFileSync(
      join(root, 'c-same-day', 'review', 'files.json'),
      JSON.stringify({
        item: 'c-same-day',
        generated: '2026-10-21',
        base: '30161eb0000',
        ref: 'WB_BASE=30161eb',
        planned: [{ path: 'src/a.ts', status: 'modified' }],
        notPlanned: [
          { path: 'src/old.ts', status: 'deleted' },
          { path: 'src/<extra>.ts', status: 'added' },
        ],
        untouched: ['src/gone.ts'],
      }),
    );
    writeFileSync(join(root, 'c-same-day', 'review', 'components.mmd'), 'flowchart TB\nc0["A"]\n');
    const html = await actualOf();
    expect(html).toContain('data-block="files-actual"');
    expect(html).toContain('review/files.json · 2026-10-21 · WB_BASE=30161eb');
    // R33: one list like the planned side: summary, folders, rows with name · note · tag · chip
    expect(html).toContain(
      '<p class="tt-fsummary">3 files · 2 not planned · 1 untouched · base 30161eb</p><div class="tt-folder">src/</div>',
    );
    expect(html).toContain(
      '<div class="tt-frow" title="src/a.ts"><span class="tt-frow__name">a.ts</span><span class="tt-frow__note"></span><span class="tt-frow__tag"></span><span class="tt-chip tt-chip--M" title="modified">M</span></div>',
    );
    expect(html).toContain(
      '<span class="tt-frow__name">&lt;extra&gt;.ts</span><span class="tt-frow__note"></span><span class="tt-frow__tag">not planned</span><span class="tt-chip tt-chip--A" title="added">A</span>',
    );
    expect(html).toContain(
      '<div class="tt-frow tt-frow--deleted" title="src/old.ts"><span class="tt-frow__name">old.ts</span><span class="tt-frow__note"></span><span class="tt-frow__tag">not planned</span><span class="tt-chip tt-chip--D" title="deleted">D</span></div>',
    );
    expect(html).toContain(
      '<div class="tt-frow tt-frow--untouched" title="src/gone.ts"><span class="tt-frow__name">gone.ts</span><span class="tt-frow__note"></span><span class="tt-frow__tag">untouched</span><span class="tt-chip tt-chip--none"></span></div>',
    );
    // the planned side in the same list: New → A, Changed → M, the note muted
    expect(html).toContain('data-block="files-planned"');
    expect(html).toContain('<p class="tt-fsummary">2 files</p>');
    expect(html).toContain(
      '<span class="tt-frow__name">a.ts</span><span class="tt-frow__note">the <code>one</code> constant</span><span class="tt-frow__tag"></span><span class="tt-chip tt-chip--A" title="added">A</span>',
    );
    expect(html).toContain(
      '<div class="tt-folder">repo root</div><div class="tt-frow" title="package.json"><span class="tt-frow__name">package.json</span><span class="tt-frow__note"></span><span class="tt-frow__tag"></span><span class="tt-chip tt-chip--M" title="modified">M</span>',
    );
    expect(html).toContain('data-block="components-actual"');
    expect(html).toContain('<pre hidden data-mmd>flowchart TB\nc0[&quot;A&quot;]\n</pre>');
    writeFileSync(join(root, 'c-same-day', 'review', 'files.json'), '{ not json');
    expect(await actualOf()).toContain(
      'review/files.json</span></div><p class="tt-placeholder">Run',
    );
  });

  it('shows a plan edit on disk in the next read', async () => {
    item('b-later', planText('Later, renamed', '2026-10-02'));
    const board = await need().read();
    expect(board.items.find((entry) => entry.folder === 'b-later')?.data.title).toBe(
      'Later, renamed',
    );
  });
});
