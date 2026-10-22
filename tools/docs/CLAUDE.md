# @pacevault/docs

**WHY:** Docs assets (today the README banner) are generated from the running app, so they stay true to what the app shows.
**WHAT:** A tool package: `banner/` holds the Playwright capture (`capture.ts`, `run.ts`, `env.ts`), the banner texts (`tiles.ts`) and the banner page (`page/`, React + Tailwind). Output goes to the root `docs/` folder (`docs/banners/`). Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Output in root `docs/`**: Generated files land in `docs/<asset>/`; intermediate shots stay in `banner/out/` (gitignored).
- **App access through `exports` only**: Import the app as `@pacevault/web/<entry>` (entry points listed in `apps/web/package.json`), never by relative path into `apps/web`. The browser-side `import('/src/store/layout.ts')` in `capture.ts` runs on the web app's dev server and is the exception.
- **Two dev servers**: the web app's (`vp dev` in `apps/web`, port `README_PORT`) for the captures, this package's (port `BANNER_PORT`) for the banner page and `banner/out/`. Both are started by `playwright.config.ts`.
- **UI from the kit**: the banner page takes its components, `cn` and theme from `@pacevault/ui`; `banner.css` imports `tailwindcss`, then `@pacevault/ui/theme.css`, and adds `@source` for `packages/ui/src`. The app base styles are not part of the banner.
- **Copy**: Banner texts in `banner/tiles.ts` follow `packages/i18n/CLAUDE.md` (facts, no marketing).

## Verification

```bash
vp check                         # from tools/docs
vp run docs:banner --locale en   # from the root; needs network for map tiles
```
