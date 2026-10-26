---
name: draft-spec
description: Write the Spec section of a feature file and flag decisions that need an ADR. Use at the spec stage, after requirements and design are approved.
---

# Draft the spec

Stage: spec. Precondition: `approved-requirements` and `approved-design` are set. If not, stop.

1. Read the feature's requirements and design, the ADRs it lists, and the code it will touch.
2. Write what happens and why, in plain words: approach and technical requirements. Do not restate the requirements. No file names, scripts or config; those belong in code and runbooks.
3. Anything hard to reverse, or that a later session would reopen, is a decision. Do not decide it here. Stop and use `record-decision`.
4. List ADRs specific to this feature in the `adrs` field.
5. If a requirement turns out wrong or ambiguous, say so and go back to the requirements. Do not work around it in the spec.
6. Run `node scripts/check-docs.mjs`. Commit the doc on its own, before any code.

Never set `approved-spec`.
