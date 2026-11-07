---
title: Coach rationale keys
status: idea
created: 2026-11-07
type: bug
areas: [app, i18n]
next: 'Owner decides: plan directly'
---

# The Labs coach rationale shows raw form-status and injury-risk keys

## Idea

`coach_rationale_base` gets the raw `context.formStatus` and `injuryRiskFromAcwr(context.acwr)` keys (`apps/web/src/components/labs/prescription.ts:226-236`), so the text reads like "Form: fresh … (low injury risk)" in every locale, against the placeholder rule added in `packages/i18n/CLAUDE.md` (session-segments R98). Map both through their labels or per-value messages, and reword the message (en/de `packages/i18n/messages/*.json:337`) so the risk label doesn't double "risk". Found by the R98 worker in `session-segments`. Owner: "capture it in the backlog"

## Open questions
