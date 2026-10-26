import { defineConfig } from 'vite-plus';

// Workspace root: format and lint settings for every package. App, test and tool configs live
// in each package (apps/web/vite.config.ts, packages/*/vitest.config.ts, …). `defaultPackage`
// and `test.projects` only let the bare `vp dev`, `vp build` and `vp test` run from the root.
export default defineConfig({
  defaultPackage: { dev: './apps/web', build: './apps/web', preview: './apps/web' },
  test: {
    projects: ['apps/web', 'packages/engine', 'packages/gpx', 'packages/ui', 'tools/workbench'],
  },
  fmt: {
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2,
    arrowParens: 'always',
    endOfLine: 'lf',
    ignorePatterns: [
      'tools/workbench/backlog/*/mockup',
      'tools/workbench/backlog/*/review/deps.*',
      '**/*.style.json',
      'packages/i18n/project.inlang',
    ],
  },
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react', 'import'],
    categories: {
      correctness: 'warn',
    },
    rules: {
      'typescript/no-floating-promises': 'error',
      'typescript/no-misused-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'func-style': ['error', 'expression'],
      'import/no-relative-parent-imports': 'error',
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'react-router-dom', importNames: ['Link', 'NavLink'] }] },
      ],
      'typescript/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: false },
      ],
      'typescript/only-throw-error': 'error',
    },
    ignorePatterns: [
      '**/dist',
      '**/paraglide',
      'packages/i18n/project.inlang',
      'apps/web/e2e',
      'tools/workbench/backlog',
      'tools/workbench/shared',
      '.claude/skills/*/references',
    ],
    overrides: [
      {
        files: ['**/*.{ts,tsx}'],
        rules: {
          'no-unused-vars': [
            'error',
            {
              argsIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              destructuredArrayIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
            },
          ],
          'react-hooks/rules-of-hooks': 'error',
          'react-hooks/exhaustive-deps': 'error',
          'react/only-export-components': [
            'error',
            {
              allowConstantExport: true,
            },
          ],
          '@typescript-eslint/no-explicit-any': 'error',
        },
        env: {
          es2022: true,
          browser: true,
        },
      },
      {
        files: ['**/*Provider.tsx'],
        rules: {
          'react/only-export-components': [
            'error',
            {
              allowConstantExport: true,
              allowExportNames: [
                'useSheetScrollContext',
                'useSheetAboveContext',
                'useSheetPeekContext',
                'useUnstableSheetScrollContext',
                'useUnstableSheetAboveContext',
                'useUnstableSheetPeekContext',
              ],
            },
          ],
        },
      },
      {
        files: [
          'apps/web/src/**/use*.ts',
          'apps/web/src/**/use*.tsx',
          'packages/ui/src/**/use*.ts',
          'packages/ui/src/**/use*.tsx',
        ],
        rules: {
          'typescript/explicit-module-boundary-types': 'error',
        },
      },
      {
        files: [
          'packages/**',
          'tools/docs/**',
          'tools/workbench/site/astro.config.mjs',
          'tools/workbench/site/src/lib/devPlugin.ts',
        ],
        rules: { 'import/no-relative-parent-imports': 'off' },
      },
      {
        files: ['apps/web/tests/**'],
        rules: { 'typescript/no-unsafe-type-assertion': 'error' },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
