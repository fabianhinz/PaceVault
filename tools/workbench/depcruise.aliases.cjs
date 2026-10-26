// dependency-cruiser takes import aliases only from a webpack-style resolve config; this file is
// that config for the app's @/ and the workbench's @scripts/ and @site/ aliases. The app's tsconfig
// `paths` has no `baseUrl`, which the tsconfig resolver needs, so without @ here every @/ import
// stays unresolved and no boundary rule sees it.
const path = require('node:path');

module.exports = {
  resolve: {
    alias: {
      '@': path.join(__dirname, '../../apps/web/src'),
      '@scripts': path.join(__dirname, 'scripts'),
      '@site': path.join(__dirname, 'site/src'),
    },
  },
};
