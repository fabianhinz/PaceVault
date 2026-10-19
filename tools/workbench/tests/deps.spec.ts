import { layerOf, toDepsGraph, type DepsInput } from '../scripts/deps.ts';

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
});
