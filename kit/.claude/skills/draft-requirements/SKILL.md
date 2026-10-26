---
name: draft-requirements
description: Draft the Requirements section of a feature file. Use when starting a feature at the requirements stage, or when asked to write or extend requirements.
---

# Draft requirements

Stage: requirements. Output: `docs/features/<slug>.md` from `docs/_templates/feature.md`. Nothing else.

1. Read `docs/workflow.md` (Requirements) and, if there is one, a shipped feature file for tone.
2. Ask the contributor what the feature is for and who it is for. Do not draft from a guess.
3. Write one sentence of purpose, then requirements: `### PFX-01 F: Name`, flat, numbered in order, never reused. Type is F, BR, Q or C.
4. Each requirement gets pass/fail criteria, `- .1 ...`. A criterion a unit test cannot prove starts `[manual]`. A requirement that needs sub-requirements is too big: split it.
5. State intended behaviour, including what is not built yet. Leave the Design and Spec sections empty.
6. Run `node scripts/check-docs.mjs`. Commit the doc on its own.

Never set `approved-requirements`. Stop and hand over for review.
