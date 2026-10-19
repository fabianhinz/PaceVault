---
title: FIT HR fallback
status: idea
created: 2026-10-19
type: bug
areas: [app]
next: Owner answers Q1
---

# Average and max HR from records when the FIT summary lacks them

## Idea

Some FIT files have HR records but no session `avg_heart_rate`/`max_heart_rate`. Avg and max then show "--", and the load falls back to the duration estimate instead of TRIMP (`apps/web/src/parsers/fit.ts:178`, `apps/web/src/parsers/fit.ts:212-213`; power and cadence already fall back to records at `apps/web/src/parsers/fit.ts:214-216`). From the ideas.md "To decide" list.

## Open questions

- **Q1** · open · Derive avg/max HR from the records when the summary lacks them, and do stored sessions get reprocessed? (a) derive and reprocess stored sessions (b) derive for new imports only (c) leave as is
