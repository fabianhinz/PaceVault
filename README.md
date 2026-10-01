# PaceVault

_Your training. Your device. Your edge._

A local-first endurance training tracker built entirely in the browser. Import Garmin .FIT files, track training load with the Banister impulse-response model, detect personal bests, visualize GPS traces on an interactive map, analyze sessions with advanced metrics (NP, GAP, efficiency, lap analysis), and get coaching recommendations — all without a server.

PaceVault is installable as a Progressive Web App. It works fully offline — once loaded, no network connection is needed. A service worker handles caching and auto-updates in the background. No account, no signup, no server.

![app with test data](./app.png)

## Getting Started

> requires vite+ - see: <https://viteplus.dev/guide/>, <https://viteplus.dev/guide/ide-integration#ide-integration>

1. Fork and clone the repo
2. `vp install && vp dev`
3. Create a branch: `git checkout -b feat/my-thing`
4. Read `CLAUDE.md` for architecture rules before writing code
5. Run the full verification suite before opening a PR:

   ```bash
   vp check                # fmt + lint + typecheck
   vp test -- --run        # unit & integration tests
   vp exec playwright test # e2e tests
   vp build                # production build
   ```

6. Open a PR against `main`

## Debugging a crash report

"Report bug" issues contain the minified stack and the build commit. Source maps ship with every build, so a local rebuild resolves the stack:

1. `git checkout <commit>` from the report
2. Put the real `VITE_CARTO_API_KEY` in `.env.local`, then `vp build`
3. Compare chunk names in the stack (e.g. `index-D4f.js`) with `dist/assets/` — matching names mean the build is byte-identical
4. Resolve the frames with the `.map` files in `dist/assets/`, by hand or by loading the build in DevTools
