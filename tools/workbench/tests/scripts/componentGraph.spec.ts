import { describe, it, expect } from 'vite-plus/test';
import { toComponentGraph } from '@scripts/componentGraph.ts';
import type { DepsInput } from '@scripts/deps.ts';

const mod = (source: string, ...imports: string[]) => ({
  source,
  dependencies: imports.map((resolved) => ({ resolved })),
});

describe(toComponentGraph.name, () => {
  it("draws the component tree of the item's .tsx files and the .tsx files they import", () => {
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
    const graph = toComponentGraph({
      cruise,
      added: ['tools/site/app/Board.tsx', 'tools/site/app/Panel.tsx', 'tools/site/app/useBoard.ts'],
      changed: ['packages/ui/src/components/Dialog.tsx'],
    });
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
    const graph = toComponentGraph({ cruise: { modules: [] }, added: ['src/a.ts'], changed: [] });
    expect(graph.nodes).toBe(0);
    expect(graph.mermaid).toContain('none["no .tsx files under ### New or ### Changed"]');
  });
});
