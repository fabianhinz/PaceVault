/** node_modules patterns are not anchored with ^: pnpm resolves packages to node_modules/.pnpm/<name>@<version>/node_modules/<name>/…. */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'engine-is-pure',
      comment: 'packages/engine/ holds pure domain logic: no React or state imports.',
      severity: 'error',
      from: { path: '^packages/engine/' },
      to: {
        path: ['node_modules/(@types/)?(react|react-dom|zustand)/', '^apps/web/src/store/'],
      },
    },
    {
      name: 'store-no-features',
      comment: 'Stores are shared state; features consume them, never the other way round.',
      severity: 'error',
      from: { path: '^apps/web/src/store/' },
      to: { path: '^apps/web/src/features/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['\\.json$', '^packages/i18n/src/paraglide/'] },
    tsConfig: {
      fileName: require('node:path').join(__dirname, '../../apps/web/tsconfig.app.json'),
    },
    tsPreCompilationDeps: true,
    webpackConfig: {
      fileName: require('node:path').join(__dirname, 'depcruise.aliases.cjs'),
    },
  },
};
