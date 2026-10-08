---
name: explore-ui
description: 'Explores design variants for a PaceVault UI change through research subagents and an interactive HTML mockup, and turns the settled direction into plans/<feature>.md. Use when the owner wants to explore, compare or rethink how a screen, chart, panel or flow looks or behaves and no design has been chosen yet. Not for UI changes whose design is already settled (write the plan directly) and not for bug fixes.'
---

# Explore a UI idea before planning

The owner decides; you research, mock up, relay and ask. This skill ends in a reviewed plan, not in code.

## Standing rules

- Every design decision goes to the owner, in rounds of at most 4 questions, recommended option first, each with a concrete example (ASCII sketch, label text, before/after). A decision is settled only when the owner settles it or hands it to an agent explicitly.
- Implementation starts only on an explicit go-ahead from the owner ("lets go"). Answered questions update the plan and nothing else.
- Subagents read the repo and write only inside `mockups/<topic>/`. They have no git write access and start no dev or preview servers. The owner commits, including `plans/<feature-name>.md`.
- Every code reference you relay or write is a `path:line` verified against the current file.
- Mockups live at `mockups/<topic>/index.html` (gitignored). Plans live at `plans/<feature-name>.md` (committed by the owner).

## Progress

```
- [ ] 1. Current state summarised
- [ ] 2. Research relayed
- [ ] 3. Mockup built and verified
- [ ] 4. Feedback rounds done
- [ ] 5. Decisions settled
- [ ] 6. Plan written
- [ ] 7. Go-ahead received, implemented, verified
```

## Steps

1. **Understand what is there.** Read the code the idea touches yourself: the feature components, the `src/components/ui/` pieces they use, the stores they read. Summarise the current state to the owner in a few lines with `path:line` references.
   Done when the owner has the summary and every component the idea would change is named in it.

2. **Research.** Brief one research subagent per independent topic with [references/research-prompt.md](references/research-prompt.md), and run them in the background, in parallel. When they return, relay to the owner a short summary of the findings, the shortlist, the open questions and your own recommendation, marked as a recommendation.
   Done when the owner has seen the 4–6 shortlisted variants with ASCII sketches and the open questions, and has said which variants go into the mockup.

3. **Mockup.** Brief one design subagent with [references/mockup-prompt.md](references/mockup-prompt.md). It sees nothing of this conversation, so the brief carries everything it needs: the current-state summary, the shortlisted variants, the owner's answers, and the path of `plans/<feature-name>.md` if one exists. Keep its agent ID; every later round goes to the same agent.
   Done when `mockups/<topic>/index.html` exists, the agent reports it verified in headless Chromium at both laptop sizes without page-level scroll, its temp files are gone, and its report lists what each variant looks like, the choices it made where the brief was ambiguous, and its open questions.

4. **Iterate in rounds.** Relay each report to the owner as a short table (variant, what it looks like, one-line rationale) plus the open questions. Collect feedback, then resume the same design agent with SendMessage. Tell it to first remove settled or rejected variants and their code, then add the new ones. Pass on explicitly any decision the owner hands to the agent.
   Done when the owner says the direction is settled.

5. **Settle decisions.** Collect everything still open across research, mockup and feedback, and ask it in rounds of at most 4 questions as the standing rules describe.
   Done when no question that changes what gets built is still open.

6. **Write the plan.** Create or update `plans/<feature-name>.md` in the shape of the existing plans:
   - **Context**: the problem, the variants compared, which one won and why, and the mockup path `mockups/<topic>/index.html`.
   - **Decisions (settled)**: each rule, with the edge cases the mockup scenarios showed (missing data, loading, many items, 0 vs missing).
   - **Approach**: files to change with verified `path:line` references.
   - **Removal**: what the change makes dead and deletes.
   - **Tests**: what `tests/CLAUDE.md` calls for, usually 0–3 tests.
   - **Verification**: the CLAUDE.md §5 suite plus what to check by hand on desktop and at 390 px.
     Done when every settled decision is in the plan and the owner has reviewed it. Later answers go into the plan as well.

7. **Implement on go-ahead only.** After the owner's explicit go-ahead, implement the plan and run the CLAUDE.md §5 verification. Leave the changes in the working tree for the owner.
   Done when the verification suite passes and the changes are reported.
