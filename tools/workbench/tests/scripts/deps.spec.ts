import { describe, it, expect } from 'vite-plus/test';
import { cruiseRoots, layerOf, toDepsGraph, type DepsInput } from '@scripts/deps.ts';

const mod = (source: string, ...imports: string[]) => ({
  source,
  dependencies: imports.map((resolved) => ({ resolved })),
});

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

describe('deps', () => {
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
    const graph = toDepsGraph({ cruise: CRUISE, planned: FOCUS });
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
    expect(graph.nodes).toBe(5);
    expect(graph.edges).toBe(4);
    expect(graph.mermaid).not.toContain('engine');
    expect(graph.mermaid).not.toContain('react');
    expect(graph.mermaid).toContain('class n0,n4 focus');
  });

  it('marks modules imported but not planned and planned paths not in the graph', () => {
    const graph = toDepsGraph({
      cruise: CRUISE,
      planned: [...FOCUS, 'apps/web/src/store/user.ts', 'messages/en.json'],
    });
    expect(graph.added).toEqual([
      'apps/web/src/features/settings',
      'apps/web/src/lib',
      'apps/web/src/pages/OnboardingPage.tsx',
    ]);
    expect(graph.missing).toEqual(['apps/web/src/store/user.ts']);
    expect(graph.mermaid).toContain('miss0["store/user.ts"]');
    expect(graph.mermaid).toContain('class n1,n2,n3 added');
  });

  it('groups modules outside the app by folder with file-name labels, unique, Changed in focus (R26)', () => {
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
    const graph = toDepsGraph({ cruise, planned });
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
    expect(graph.missing).toEqual(['tools/workbench/site/src/pages/index.astro']);
    expect(graph.added).toEqual([
      'packages/ui/src/components/Button.tsx',
      'packages/ui/src/lib',
      'tools/workbench/site/src/lib',
    ]);
  });

  it('cruises the roots of the areas plus the folders of the planned TypeScript paths (R26)', () => {
    expect(
      cruiseRoots({
        areas: ['workbench', 'ui', 'skills'],
        planned: [
          'packages/ui/src/components/Checkbox.tsx',
          'tools/workbench/tests/boardRead.spec.ts',
          'apps/web/src/features/x/',
          'tools/workbench/GUIDE.md',
        ],
      }),
    ).toEqual([
      'apps/web/src/features/x',
      'packages/ui/src',
      'tools/workbench/scripts',
      'tools/workbench/site/src',
      'tools/workbench/tests',
    ]);
    expect(cruiseRoots({ areas: ['app', 'repo'], planned: [] })).toEqual(['apps/web/src']);
  });
});
