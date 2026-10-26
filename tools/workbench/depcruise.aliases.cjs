// dependency-cruiser takes import aliases only from a webpack-style resolve config; this file is
// that config for the workbench's @scripts/ and @site/ aliases (tsConfig already names the app's).
const path = require('node:path');

module.exports = {
  resolve: {
    alias: {
      '@scripts': path.join(__dirname, 'scripts'),
      '@site': path.join(__dirname, 'site/src'),
    },
  },
};
