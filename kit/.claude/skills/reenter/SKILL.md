---
name: reenter
description: Route a defect or a revision back to the stage whose document is wrong. Use when a shipped feature misbehaves or needs new requirements.
---

# Re-enter the workflow

Work goes back to the earliest stage whose document is wrong. Read the Loops section of `docs/workflow.md` first.

Defect (shipped behaviour breaks a criterion):
1. Find the criterion violated. Decide the root cause stage: build, spec, design or requirements.
2. Open the issue from the Defect template: labels `bug`, `feature:<slug>`, `reenter:<stage>`.
3. Above build, blank the approval dates from that stage down and set `stage` to it, in a `docs` commit. Ask the contributor before doing this: it takes the feature out of shipped.

Revision (same capability, new or changed requirements):
1. Issue from the Revision template: labels `revision`, `feature:<slug>`.
2. Edit the feature file in place, add new IDs (never reuse), blank the approvals the change touches, set `stage` to the first of them.
3. A different capability that depends on this one is a new feature with its own prefix.

If you are unsure which stage is wrong, ask. Do not guess downward to build.
