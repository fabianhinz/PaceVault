# @pacevault/workbench

**WHY:** The backlog and its board: plans, mockups and reviews live as files next to the code, and the board and hooks keep them consistent.
**WHAT:** The board (`site/`, Astro), its scripts and the Claude hooks (`scripts/`), shared mockup/review assets (`shared/`), their tests (`tests/`) and the backlog content (`backlog/<item>/`, `flaky.md`). How the owner works with the backlog: `GUIDE.md` (shown on the board). How the board, the files, the hooks and the commands work: `README.md`. Shared code rules: root `CLAUDE.md` §2.

## Rules

- **Paths**: Scripts resolve the repo root as `'../../..'` from `scripts/` and the backlog as `tools/workbench/backlog`; the board's root is `backlog/` (`WB_ROOT` overrides it in tests). Mockup and review HTML link `../../../shared/…`.
- **Hooks fail open**: A crash in a hook exits 1 (never blocks); only a decided block exits 2. Keep the guard regexes anchored to `tools/workbench/backlog/`.
- **Status gates**: `ready` and `done` are owner-only; agents never tick `## Real-data checks` (plan.md) or `## Agent decisions` (`backlog/<item>/review/decisions.md`, where every agent decision goes). `scripts/statusGuard.ts` enforces it.
- **Acceptance**: the owner accepts reviewed work with Mark done in the panel footer of the in-review item (`status: done`, only from `in-review`); there is no trash. Done folders are removed from the chat (`item-done` → `vp run workbench:cleanup`), never by the board, and only after that acceptance.
- **One board server**: at most one `astro dev` per site root; reuse the running board (`vp run workbench`, port 4321; check `lsof -iTCP -sTCP:LISTEN -P | grep :432`) for captures and checks, start one only when none runs and stop it afterwards, never `--ignore-lock`. A second server re-optimizes the shared Vite deps cache and blanks the owner's board; if that happened, `rm -rf tools/workbench/site/node_modules/.vite` and the owner restarts the board.
- **The board never commits** and refuses a write when the file changed since it rendered.
- **Not app code**: `backlog/` and `shared/` are not linted or type-checked (root `vite.config.ts` ignores them); `scripts/`, `tests/` and `site/` are.
- **Dependency rules**: `.dependency-cruiser.cjs` holds the module boundary rules (`engine-is-pure`, `store-no-features`); `scripts/deps.ts` checks the rules over `apps/web/src` and `packages/`, cruises the item's areas and planned folders for its graph (and its `.tsx` files for the component tree) and writes every Actual side of the Tech tab.

## Verification

```bash
vp check             # from tools/workbench
vp run check         # astro sync + astro check
vp run plans:check   # plan rules over backlog/
vp test -- --run     # tests/
```
