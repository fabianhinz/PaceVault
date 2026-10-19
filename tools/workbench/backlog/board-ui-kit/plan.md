---
title: Board on UI kit
status: idea
created: 2026-10-19
type: chore
areas: [workbench]
depends-on: [shared-ui-kit]
next: Explore the board design on the kit (item-explore)
---

# Rebuild the workbench board on the shared UI kit

## Idea

The Astro board (`tools/workbench/site`) uses its own CSS (`tools/workbench/shared/workbench.css`, `site/src/styles/site.css`, `shared/tokens.css`), native `<dialog>`, the Popover API and vanilla scripts. Rebuild it on `@pacevault/ui` (React islands + Tailwind) so it meets the PWA's UI/UX standard. Its look and behaviour change, and some patterns have no kit equivalent (kanban columns, peek, markdown/diff views, checkbox), so it starts with a mockup round. Split from `shared-ui-kit` (owner, 2026-10-19: "Split into two (Recommended)").

Requirement carried over from `board-restore-flash` (owner, 2026-10-19: "okay i am fine with defering it and solving it with the "board-ui-kit""): a write from the board (e.g. ticking a box with a card open) must not flash. Today every write triggers a full page reload via the dev server's file watcher; the new document paints once without the dialog before `restoreAfterReload` (`tools/workbench/site/src/scripts/writes.ts`, called from `board.ts`) reopens it. The rebuild keeps state on the client and updates in place instead of reloading; agent edits still need to reach an open board.

## Direction so far (owner, 2026-10-19)

- **Architecture:** one React app on the board page (Astro shell + `@astrojs/react` island), framework-idiomatic, nothing custom. Owner: "the second point looks like the KISS approach to me", "i am always a fan for the framework idiomatic approach. Nothing fancy". Proposed shape: reads via an Astro action returning the board as JSON, writes via the existing Astro actions, TanStack Query in the client (cache updated from the action result), live updates through Vite's HMR channel (`wb:changed` with the path from a small dev plugin; the client refetches that item). Files are read outside content collections, so a file change no longer reloads the page; this removes the tick flash.
- **Components:** reuse `@pacevault/ui` as much as possible; adjust the UX (move buttons, change flows) rather than invent new components or layouts. The kanban code stays small and lives in the workbench, not in the kit. The kit's theme, tokens and components set the look. Owner: "I'd rather move a few buttons around and change the ux a bit, then inventing new components / layouts … So this should not be part of the ui kit".
- **Look:** "100% looks like the app", with a clear boundary layer so mockups and app screenshots don't blur into the board UI. Proposal for the explore round: board chrome is pure kit; item content (mockups, review docs, screenshots) sits on a labelled sunken "stage" ("Mockup", "Review", "Screenshot · before/after"), mockups and reviews stay in iframes with their own CSS.
- **Screen:** desktop only, sized for a 14-inch MacBook Pro, also as one half of a vertical split (about 750–860 px wide). Owner: "desktop only. 14-inch macbkook pro (vertical split with another app should work though)".
- **Keyboard:** no keyboard features (the `[`/`]` card switch goes). Owner: "no keyboard features".

## Open questions
