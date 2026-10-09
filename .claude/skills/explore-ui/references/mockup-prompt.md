# Mockup prompt template

Fill every `{placeholder}` and send the result as the design subagent's first prompt. Later rounds go to the same agent with SendMessage: prune first, then add.

```markdown
You are building an interactive design mockup for PaceVault, a local-first PWA (React 19, Radix + Tailwind v4, dark mode only) that maps and analyses fitness activities. You have no access to the conversation that led here; this brief is everything. The app owner decides between variants; you build them so the owner can compare.

## Topic

{one sentence}

## Current state

{summary from step 1, with path:line references}

## Variants to build

{for each variant: name, ASCII sketch or description, one-line rationale}

## Owner decisions so far

{settled points, and any decision the owner explicitly handed to you}

## Plan

{path of plans/<feature-name>.md, or "none yet"}

## Read for the real look

Copy classes, spacing, radii and colours from these files rather than inventing them:

- `src/components/ui/Card.tsx` (`glassClass`), `src/components/ui/Typography.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Label.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/FloatingPill.tsx`, `src/components/ui/RadioGroup.tsx`, `src/components/ui/ResponsivePopover.tsx`, `src/components/ui/Popover.tsx`, `src/components/ui/Dialog.tsx`
- forms as the app builds them: `src/components/layout/AttributeFilterDialog.tsx`, `src/features/settings/ThresholdsSection.tsx`
- `src/index.css` and its JS mirror `src/lib/tokens.ts`
- the app shell: `src/components/layout/AppLayout.tsx`, `src/components/layout/Dock.tsx`, `src/components/ui/BottomSheet.tsx`
- {feature components the idea touches}
- CLAUDE.md §2 "0 is data" and §6 colour palette

## Rules for the mockup

- One self-contained file: `mockups/{topic}/index.html`. No build step. External scripts only from cdnjs.cloudflare.com, cdn.jsdelivr.net or unpkg.com; fonts only from Google Fonts.
- Dark mode only. Anything on the map follows CLAUDE.md §6. A recorded 0 shows `0`, missing data shows `--`.
- Toolbar with switches for:
  - viewport: both / desktop / phone 390;
  - data scenarios: {scenarios}, plus missing data, loading and many items;
  - Variant: one entry per variant, each coherent on its own and showing its one-line rationale.
- Desktop frame: the app shell with the map as background, the dock on the left, the content column on the right at 40% width. Hover interactions.
- Phone frame (390 px wide): map on top, glass bottom sheet, dock at the bottom. Tap interactions.
- The whole page fits a 14" laptop with the browser toolbar visible: no page-level vertical scroll at 1512×860 and at 1440×800. Scale the frames to fit; scrolling inside a frame is fine. Notes, decisions and open questions go in a collapsible side panel.
- Plausible fake data at the resolution PaceVault really has ({data resolution}); no more precision than the data supports.
- Use existing components and copy their classes exactly; map every part to its component (path:line) in the notes and flag anything that would need a new component.
- Text only through the `Typography` variants (with their colour tokens); no ad-hoc font sizes or weights.
- Buttons only with the `Button` variants and sizes, pills only via `FloatingPill`; the same role gets the same size everywhere.
- Form fields as the app builds them: a `Label` above every `Input`, hints and errors through Input's `helperText`/`error`; every input has a label.
- Spacing from the app's existing components, not one-off values.
- No layout shift: nothing visible moves while the user types, hovers, or when hints, counts, previews, chips or lists appear and disappear. Reserve fixed slots, give lists a max height and scroll inside.

## Boundaries

Write only inside `mockups/{topic}/`. No git commands, no dev or preview servers, no edits elsewhere in the repo.

## Verify

Load the file in headless Chromium through the repo's Playwright (`@playwright/test`'s `chromium`, `file://` URL, no test runner and no web server) from a temporary script inside `mockups/{topic}/`, run with `node` after `nvm use`. At 1512×860 and 1440×800, check that `document.documentElement.scrollHeight <= window.innerHeight`, switch through every variant and scenario, and look at screenshots of both viewports. Also check:

- **Layout shift:** record the bounding boxes of the main containers, headers, inputs and first list items, then type, hover, add and remove items and open and close lists; every box stays within ±0.5 px.
- **Typography:** the computed font size, weight and line height of every visible text node is one of the `Typography` variants' values.

Fix what fails, then delete the temporary script and screenshots.

## Report

- per variant: what it looks like on desktop and on phone, in 2–3 lines;
- choices you made where this brief was ambiguous;
- open questions for the owner;
- verification result at both laptop sizes, including the layout-shift and typography checks.
```
