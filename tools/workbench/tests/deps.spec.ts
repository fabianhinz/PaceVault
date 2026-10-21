import {
  cruiseRoots,
  layerOf,
  toComponentGraph,
  toDepsGraph,
  type DepsInput,
} from '../scripts/deps.ts';

const mod = (source: string, ...imports: string[]) => ({
  source,
  dependencies: imports.map((resolved) => ({ resolved })),
});

// The focus is the new onboarding store and flow; settings and lib fold to one node each.
const CRUISE: DepsInput = {
  modules: [
    mod(
      'apps/web/src/pages/OnboardingPage.tsx',
      'apps/web/src/features/onboarding/OnboardingFlow.tsx',
    ),
    mod(
      'apps/web/src/features/onboarding/OnboardingFlow.tsx',
      'apps/web/src/store/onboarding.ts',
      'apps/web/src/features/settings/AboutSection.tsx',
      'apps/web/src/features/settings/hooks/useThresholdsForm.ts',
      'node_modules/.pnpm/react@19.2.4/node_modules/react/index.js',
    ),
    mod('apps/web/src/store/onboarding.ts', 'apps/web/src/lib/moreStats.ts'),
    mod('apps/web/src/features/settings/AboutSection.tsx', 'apps/web/src/lib/moreStats.ts'),
    mod(
      'apps/web/src/features/settings/hooks/useThresholdsForm.ts',
      'packages/engine/src/types.ts',
    ),
    mod('apps/web/src/lib/moreStats.ts', 'packages/engine/src/types.ts'),
    mod('packages/engine/src/types.ts'),
    mod('node_modules/.pnpm/react@19.2.4/node_modules/react/index.js'),
  ],
};

const FOCUS = ['apps/web/src/features/onboarding/', 'apps/web/src/store/onboarding.ts'];

const labelLines = (mermaid: string) =>
  mermaid.split('\n').filter((line) => /^(subgraph|n\d+\[)/.test(line));

describe('workbenchDeps', () => {
  it('maps the repo folders to layers', () => {
    expect(layerOf('packages/engine/src/stress.ts')).toBe('engine');
    expect(layerOf('packages/gpx/src/parse.ts')).toBe('other');
    expect(layerOf('apps/web/src/lib/db.ts')).toBe('lib');
    expect(layerOf('packages/ui/src/hooks/useDevice.ts')).toBe('ui');
    expect(layerOf('apps/web/src/store/user.ts')).toBe('store');
    expect(layerOf('apps/web/src/features/map/DeckGLOverlay.tsx')).toBe('feature');
    expect(layerOf('packages/ui/src/components/Card.tsx')).toBe('ui');
    expect(layerOf('apps/web/src/components/layout/Dock.tsx')).toBe('ui');
    expect(layerOf('apps/web/src/pages/OnboardingPage.tsx')).toBe('page');
    expect(layerOf('apps/web/src/parsers/fit.ts')).toBe('other');
  });

  it('groups by layer, folds other features and drops edges that touch no focus module', () => {
    const graph = toDepsGraph(CRUISE, FOCUS, []);
    expect(labelLines(graph.mermaid)).toEqual([
      'subgraph L_page["pages"]',
      'n3["OnboardingPage.tsx"]',
      'subgraph L_feature["features"]',
      'subgraph F_onboarding["onboarding/"]',
      'n0["OnboardingFlow.tsx"]',
      'n1["features/settings/"]',
      'subgraph L_store["store"]',
      'n4["onboarding.ts"]',
      'subgraph L_lib["lib"]',
      'n2["lib/"]',
    ]);
    // Page → flow → store and settings, store → lib; the edges among settings, lib and
    // engine touch no focus module, packages are never drawn.
    expect(graph.nodes).toBe(5);
    expect(graph.edges).toBe(4);
    expect(graph.mermaid).not.toContain('engine');
    expect(graph.mermaid).not.toContain('react');
    expect(graph.mermaid).toContain('class n0,n4 focus');
  });

  it('marks modules imported but not planned and planned paths not in the graph', () => {
    const graph = toDepsGraph(CRUISE, FOCUS, [
      ...FOCUS,
      'apps/web/src/pages/OnboardingPage.tsx',
      'apps/web/src/features/settings/AboutSection.tsx',
      'apps/web/src/store/user.ts',
      'messages/en.json',
    ]);
    // lib/ is imported but not planned; a planned file inside a folded folder is covered by it.
    expect(graph.added).toEqual(['apps/web/src/lib']);
    // user.ts is planned but nothing draws it; non-src paths can never be drawn.
    expect(graph.missing).toEqual(['apps/web/src/store/user.ts']);
    expect(graph.mermaid).toContain('miss0["store/user.ts"]');
    expect(graph.mermaid).toContain('class n2 added');
  });

  it('groups modules outside the app by folder with file-name labels, unique, Changed in focus (R26)', () => {
    // Board.tsx (New) imports the kit Button by package name and Dialog (Changed); board.ts
    // (New) imports the workbench lib's vocabulary; both lib folders hold no focus module and
    // fold, so their equal "lib/" labels fall back to their repo paths.
    const cruise: DepsInput = {
      modules: [
        mod(
          'tools/workbench/site/src/app/Board.tsx',
          '@pacevault/ui/components/Button.tsx',
          'packages/ui/src/components/Dialog.tsx',
          'tools/workbench/site/src/lib/vocabulary.ts',
          'astro:actions',
        ),
        mod('packages/ui/src/components/Dialog.tsx', 'packages/ui/src/lib/cn.ts'),
        mod('@pacevault/ui/components/Button.tsx'),
        mod('packages/ui/src/components/Button.tsx', 'packages/ui/src/lib/cn.ts'),
        mod('packages/ui/src/lib/cn.ts'),
        mod('tools/workbench/site/src/lib/vocabulary.ts'),
        mod('astro:actions'),
      ],
    };
    const planned = [
      'tools/workbench/site/src/app/Board.tsx',
      'packages/ui/src/components/Dialog.tsx',
      'tools/workbench/site/src/pages/index.astro',
      'tools/workbench/GUIDE.md',
    ];
    const graph = toDepsGraph(cruise, planned, planned);
    expect(labelLines(graph.mermaid)).toEqual([
      'subgraph G0["packages/ui/src/"]',
      'n2["packages/ui/src/lib"]',
      'subgraph G1["packages/ui/src/components/"]',
      'n0["Button.tsx"]',
      'n1["Dialog.tsx"]',
      'subgraph G2["tools/workbench/site/src/"]',
      'n4["tools/workbench/site/src/lib"]',
      'subgraph G3["tools/workbench/site/src/app/"]',
      'n3["Board.tsx"]',
      'subgraph missingPlanned["planned, not in the graph"]',
    ]);
    expect(graph.mermaid).toContain('class n1,n3 focus');
    expect(graph.mermaid).not.toContain('astro:actions');
    // Only code (and .astro, never parsed) can be missing; GUIDE.md never is.
    expect(graph.missing).toEqual(['tools/workbench/site/src/pages/index.astro']);
    expect(graph.added).toEqual([
      'packages/ui/src/components/Button.tsx',
      'packages/ui/src/lib',
      'tools/workbench/site/src/lib',
    ]);
  });

  it('cruises the roots of the areas plus the folders of the planned TypeScript paths (R26)', () => {
    expect(
      cruiseRoots(
        ['workbench', 'ui', 'skills'],
        [
          'packages/ui/src/components/Checkbox.tsx',
          'tools/workbench/tests/boardRead.spec.ts',
          'apps/web/src/features/x/',
          'tools/workbench/GUIDE.md',
        ],
      ),
    ).toEqual([
      'apps/web/src/features/x',
      'packages/ui/src',
      'tools/workbench/scripts',
      'tools/workbench/site/src',
      'tools/workbench/tests',
    ]);
    expect(cruiseRoots(['app', 'repo'], [])).toEqual(['apps/web/src']);
  });

  it("draws the component tree of the item's .tsx files and the .tsx files they import", () => {
    // Board (new) imports Panel (new), a hook and the kit Button by package name; Panel imports
    // Card from the kit; Card's own imports are not followed (not an item file).
    const cruise: DepsInput = {
      modules: [
        mod(
          'tools/site/app/Board.tsx',
          'tools/site/app/Panel.tsx',
          'tools/site/app/useBoard.ts',
          '@pacevault/ui/components/Button.tsx',
          'node_modules/.pnpm/react@19.2.4/node_modules/react/index.js',
        ),
        mod('tools/site/app/Panel.tsx', '@pacevault/ui/components/Card.tsx'),
        mod('tools/site/app/useBoard.ts', 'tools/site/app/Hidden.tsx'),
        mod('packages/ui/src/components/Card.tsx', 'packages/ui/src/components/Surface.tsx'),
        mod('packages/ui/src/components/Dialog.tsx', 'packages/ui/src/components/Card.tsx'),
      ],
    };
    const graph = toComponentGraph(
      cruise,
      ['tools/site/app/Board.tsx', 'tools/site/app/Panel.tsx', 'tools/site/app/useBoard.ts'],
      ['packages/ui/src/components/Dialog.tsx'],
    );
    expect(graph.mermaid).toBe(
      [
        'flowchart TB',
        'subgraph D0["packages/ui/src/components/"]',
        'c0["Button"]',
        'c1["Card"]',
        'c2["Dialog"]',
        'end',
        'subgraph D1["tools/site/app/"]',
        'c3["Board"]',
        'c4["Panel"]',
        'end',
        'c2-->c1',
        'c3-->c0',
        'c3-->c4',
        'c4-->c1',
        'class c3,c4 new',
        'class c2 mod',
        'class c0,c1 ui',
        'classDef new stroke:#e5e7eb,stroke-width:2px',
        'classDef mod stroke:#8b8f9a,stroke-width:2px',
        'classDef ui stroke:#8b8f9a,stroke-dasharray:4 3',
        '',
      ].join('\n'),
    );
    expect(graph.nodes).toBe(5);
    expect(graph.edges).toBe(4);
  });

  it('says so when the item has no .tsx files', () => {
    const graph = toComponentGraph({ modules: [] }, ['src/a.ts'], []);
    expect(graph.nodes).toBe(0);
    expect(graph.mermaid).toContain('none["no .tsx files under ### New or ### Changed"]');
  });
});
