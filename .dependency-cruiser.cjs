/**
 * Module boundary rules from CLAUDE.md §2, checked by `vp run workbench:deps -- <feature>`
 * (scripts/workbenchDeps.ts). node_modules patterns are not anchored with `^`: pnpm resolves
 * packages to `node_modules/.pnpm/<name>@<version>/node_modules/<name>/…`.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'engine-is-pure',
      comment: 'src/packages/engine/ holds pure domain logic: no React or state imports.',
      severity: 'error',
      from: { path: '^src/packages/engine/' },
      to: {
        path: ['node_modules/(@types/)?(react|react-dom|zustand)/', '^src/store/'],
      },
    },
    {
      name: 'store-no-features',
      comment: 'Stores are shared state; features consume them, never the other way round.',
      severity: 'error',
      from: { path: '^src/store/' },
      to: { path: '^src/features/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['\\.json$', '^src/paraglide/'] },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
  },
};
