import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './paths.ts';

export interface ThemeLiteral {
  line: number;
  match: string;
  check: 'hex' | 'rgb' | 'px';
}

const PATTERN_BY_CHECK: Record<ThemeLiteral['check'], RegExp> = {
  hex: /(?<=['"`\s:(,=])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g,
  rgb: /(?<![A-Za-z])rgba?\(\s*\d[^)]*\)?/g,
  px: /-\[-?\d+(?:\.\d+)?px\]/g,
};

const CHECKS: ThemeLiteral['check'][] = ['hex', 'rgb', 'px'];

const SCANNED_ROOTS = ['apps/web/src', 'packages/ui/src'];
const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.css'];

const ALLOWED_FILES = new Set([
  'packages/ui/src/theme.css',
  'packages/ui/src/lib/tokens.ts',
  'apps/web/src/features/map/map-attribution.css',
]);

export const findThemeLiterals = (source: string): ThemeLiteral[] => {
  const literals: ThemeLiteral[] = [];
  const lines = source.split('\n');
  lines.forEach((text, index) => {
    for (const check of CHECKS) {
      for (const found of text.matchAll(PATTERN_BY_CHECK[check])) {
        literals.push({ line: index + 1, match: found[0], check });
      }
    }
  });
  return literals;
};

const scannedFiles = (): string[] =>
  SCANNED_ROOTS.flatMap((root) =>
    readdirSync(join(REPO_ROOT, root), { recursive: true, encoding: 'utf8' })
      .filter((path) => SCANNED_EXTENSIONS.some((extension) => path.endsWith(extension)))
      .map((path) => relative(REPO_ROOT, join(REPO_ROOT, root, path))),
  ).filter((path) => !ALLOWED_FILES.has(path));

const main = () => {
  const files = scannedFiles();
  const hits = files.flatMap((path) =>
    findThemeLiterals(readFileSync(join(REPO_ROOT, path), 'utf8')).map(
      (literal) => `${path}:${literal.line}: ${literal.match} (${literal.check})`,
    ),
  );
  if (hits.length > 0) {
    console.error(hits.join('\n'));
    console.error(`Theme tokens: ${hits.length} literal(s); use a theme token instead`);
    process.exit(1);
  }
  console.log(`Theme tokens: no literals (${files.length} files)`);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
