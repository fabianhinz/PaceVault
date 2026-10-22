# Mockup prompt template

Fill every `{placeholder}` and send the result as the first prompt of a `item-worker` subagent. Later rounds go to the same agent with SendMessage: prune first, then add.

```markdown
You are building an interactive design mockup for PaceVault, a local-first PWA (React 19, Radix + Tailwind v4, dark mode only) that maps and analyses fitness activities. You have no access to the conversation that led here; this brief is everything. The app owner decides between variants; you build them so the owner can compare.

## Topic

{one sentence}

## Current state

{summary from step 1, with path:line references}

## Variants to build

{for each variant: id, name, ASCII sketch or description, one-line rationale}

## Owner decisions so far

{settled points, and any decision the owner explicitly handed to you}

## Decisions to show (Q labels)

{every Q item from the plan's `## Open questions`: id, title, state (open / answered → settled), options, answer}

## Plan

`tools/workbench/backlog/{item}/plan.md` (read it; never edit it)

## Read for the real look

Copy classes, spacing, radii and colours from these files rather than inventing them:

- `packages/ui/src/components/Card.tsx` (`glassClass`, `floatingClass`, `tileClass`), `packages/ui/src/components/Typography.tsx`, `packages/ui/src/components/Button.tsx`, `packages/ui/src/components/Label.tsx`, `packages/ui/src/components/Input.tsx`, `packages/ui/src/components/FloatingPill.tsx`, `packages/ui/src/components/RadioGroup.tsx`, `packages/ui/src/components/ResponsivePopover.tsx`, `packages/ui/src/components/Popover.tsx`, `packages/ui/src/components/Dialog.tsx`
- forms as the app builds them: `apps/web/src/features/studio/StudioRouteFormDialog.tsx`, `apps/web/src/features/settings/ThresholdsSection.tsx`
- `tools/workbench/shared/tokens.css` (the app's tokens as CSS custom properties, same names as `packages/ui/src/theme.css`)
- the app shell: `apps/web/src/components/layout/AppLayout.tsx`, `apps/web/src/components/layout/Dock.tsx`, `packages/ui/src/components/BottomSheet.tsx`
- {components the idea touches}
- `apps/web/CLAUDE.md` §2 "0 is data", §3 colour palette, §4 surfaces

## The mockup shell (required)

The page is `tools/workbench/backlog/{item}/mockup/index.html`. Start from the worked example `.claude/skills/item-explore/references/mockup-example.html` (copy it to the mockup path first; its `../../../shared/` links only resolve there). The shell's API doc is the header comment of `tools/workbench/shared/mockup-shell.js`; read it first. The shell renders the toolbar (View · Language · Variant · Scenario · extras · Labels · Notes, in that order), the desktop (1280×800) and phone (390×844) frames, the notes panel (Notes · Questions, open ones first) and the Q badges. Build none of these yourself: no own toolbar, frames, scaling code, notes aside or floating Q layer.

- **Head:** `<link rel="stylesheet" href="../../../shared/mockup-shell.css">` and `<script src="../../../shared/mockup-shell.js" defer></script>`. The page's own `<style>` styles only the screen content, using the `tokens.css` names.
- **Config:** `<script type="application/json" id="mockup-config">` with
  - `title`;
  - `variants[]` and `scenarios[]` as `{id, label}`;
  - `extras[]` as `{id, type: "toggle" | "choice" | "button", label, options?, default?}` (every control renders as a native select in one scrolling toolbar line; keep option labels short);
  - `decisions[]` as `{id: "Q1", title}`, one per Q item above, same IDs as the plan; no state, options or answer (the badges and the Questions tab read them from the plan through the board). Every question for the owner is a Q item here, including your own; there is no separate list;
  - optional `"frame": "iframe"`: each frame becomes one `srcdoc` iframe at the device size, so `dvh`, media queries and app frameworks (Preact) behave as on a device. The screen template's content is the iframe's `<body>`, its scripts run inside it, and the host page's styles are copied in. State attributes go on the iframe's `<html>`; scripts there reach the shell as `parent.MockupShell`. Use it when the screen needs real viewport behaviour or a framework; otherwise keep the default inline frames.
- **Screen:** `<template id="mockup-screen">`, rendered into both frames. Inside it:
  - `data-when="scenario:cold|warm"` shows an element only for those values (any state key: `variant`, `device`, `lang`, an extra id);
  - `data-de="…"` holds the German text; the element's own text is English;
  - `data-q="Q1"` renders the decision badge at that spot.
  - Each screen root carries `data-device`, `data-view`, `data-lang`, `data-variant`, `data-scenario` and `data-<extra>`: style variants with attribute selectors where you can.
- **Notes:** `<template id="mockup-notes">` (the Notes tab). Extra panel tabs, after the standard three: `<template id="mockup-panel-<id>" data-label="Inspector">…</template>`.
- **Scripts** (only where markup and `data-when` can't do it):
  - `MockupShell.onChange((state, screens) => …)` on every state change; `screens` are the two roots (in iframe mode, the two `<html>` elements);
  - `MockupShell.onAction('<button extra id>', fn)`;
  - `MockupShell.set('scenario', 'cold')` changes one key from a script (e.g. a click inside the frame);
  - `MockupShell.setOptions('<choice extra id>', [{id, label}])` replaces a choice's options (the value stays if still present, else the first option);
  - `MockupShell.hydrate({variant, scenario, …})` sets several keys in one render.
- **Readability:** the shell scales a frame only while the scale stays ≥ 0.86, otherwise shows it at 1:1 and the stage scrolls; it offers "both" only when both fit. Don't fight this with your own scaling.

## Rules for the screen content

- No build step. External scripts only from cdnjs.cloudflare.com, cdn.jsdelivr.net or unpkg.com; fonts only from Google Fonts.
- Dark mode only. Anything on the map follows `apps/web/CLAUDE.md` §3. A recorded 0 shows `0`, missing data shows `--`.
- Variants: one `variants[]` entry each, each coherent on its own; its one-line rationale goes in the notes.
- Scenarios: {scenarios}, plus missing data, loading and many items.
- Desktop frame content: the app shell with the map as background, the dock on the left, the content column on the right at 40 % width. Hover interactions.
- Phone frame content: map on top, glass bottom sheet, dock at the bottom. Tap interactions.
- Plausible fake data at the resolution PaceVault really has ({data resolution}); no more precision than the data supports.
- Use existing components and copy their classes exactly; map every part to its component (`path:line`) in the notes and flag anything that would need a new component.
- Text only through the `Typography` variants (with their colour tokens); no ad-hoc font sizes or weights. English and German for every string.
- Buttons only with the `Button` variants and sizes, pills only via `FloatingPill`; the same role gets the same size everywhere.
- Form fields as the app builds them: a `Label` above every `Input`, hints and errors through Input's `helperText`/`error`.
- Spacing from the app's existing components, not one-off values.
- No layout shift: nothing visible moves while the user types, hovers, or when hints, counts, previews, chips or lists appear and disappear. Reserve fixed slots, give lists a max height and scroll inside.
- No `prefers-reduced-motion` handling. Copy states facts and never sells. Banners sit at the very top of the page, above any header.

## Boundaries

Write only inside `tools/workbench/backlog/{item}/mockup/`. Never edit `tools/workbench/shared/`, the plan or anything else in the repo; if the shell lacks something you need, say so in your report. No git commands, no dev or preview servers.

## Verify

Load the file in headless Chromium through the repo's Playwright (`@playwright/test`'s `chromium`, `file://` URL, no test runner and no web server) from a temporary script inside `tools/workbench/backlog/{item}/mockup/`, run with `node` after `nvm use`. At 1512×860 and 1440×800:

- no page-level scroll: `document.documentElement.scrollHeight <= window.innerHeight`;
- **shell scale:** for each view, the stage's `dataset.scale` is ≥ 0.86, or the frame shows at 1:1 with the stage scrolling (`is-scroll`);
- switch through every variant, scenario, language and extra; no console errors; look at screenshots of both frames;
- every `data-q` badge renders and every `decisions[]` ID matches the brief's Q list;
- **layout shift:** record the bounding boxes of the main containers, headers, inputs and first list items, then type, hover, add and remove items and open and close lists; every box stays within ±0.5 px;
- **typography:** the computed font size, weight and line height of every visible text node is one of the `Typography` variants' values.

Fix what fails, then delete the temporary script and screenshots.

## Report

Under the fixed headings of your final report:

- **Done:** per variant, what it looks like on desktop and on phone, in 2–3 lines;
- **Agent decisions:** choices you made where this brief was ambiguous;
- **Open questions:** questions for the owner (each also a `decisions[]` entry `{ id, title }`, and a `- **Qn** · open · …` item for the plan);
- **Verification:** results at both laptop sizes, including the shell scale, layout-shift and typography checks.
```
