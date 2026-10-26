import { describe, it, expect } from 'vite-plus/test';
import { readTechPaths } from '@scripts/techFile.ts';

describe(readTechPaths.name, () => {
  it('reads the New and Changed paths of tech.md and nothing else', () => {
    const tech = `# Feature: tech

## Data flow

- \`src/not/a/module.ts\`: a list outside Modules

## Modules

\`\`\`mermaid
flowchart TB
  a --> b
\`\`\`

- \`src/loose.ts\`: before the New heading

### New

- \`src/components/x/A.tsx\`: flow state, \`not this\`
- \`src/components/x/hooks/\`

### Changed

- \`src/store/user.ts\`

### Notes

- \`src/ignored.ts\`

## Interfaces

### New

- \`src/also/ignored.ts\`
`;
    expect(readTechPaths(tech)).toEqual({
      added: ['src/components/x/A.tsx', 'src/components/x/hooks/'],
      changed: ['src/store/user.ts'],
    });
  });

  it('reads New / Changed from ## Files (the template since R25), a list before the headings ignored', () => {
    const tech = `# Tech

## Modules

\`\`\`mermaid
flowchart TB
\`\`\`

- \`src/loose.ts\`: not under New

## Files

### New

- \`src/components/x/A.tsx\`: new

### Changed

- \`src/store/user.ts\`

## Interfaces

### Changed

- \`src/also/ignored.ts\`
`;
    expect(readTechPaths(tech)).toEqual({
      added: ['src/components/x/A.tsx'],
      changed: ['src/store/user.ts'],
    });
  });
});
