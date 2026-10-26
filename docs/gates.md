# The gates

Full definitions are in [kit/docs/workflow.md](../kit/docs/workflow.md). This is the short version, with the reason for each.

| Gate | Approved by | Proof it passed |
| ---- | ----------- | --------------- |
| Requirements | Contributor sets `approved-requirements` | A dated field. check-docs fails if a later stage is set without it. |
| Design | Contributor sets `approved-design` | Same, plus a design link. |
| Spec | Contributor sets `approved-spec` | Same. Any ADR it needs is accepted. |
| Build | Contributor merges the PR | CI green. Each criterion has a test citing its ID, or is tagged `[manual]` and confirmed in the PR. |
| Shipped | Nobody | The merging PR sets the stage and adds a changelog entry. |

## Why these rules

- **Approvals are a human-only field.** If an agent can set it, it is not a gate. `CLAUDE.md` forbids it and review catches it.
- **Criteria are pass/fail and tests cite their IDs.** "Done" becomes a lookup, not an opinion.
- **Docs flow upstream first and change in their own commit.** The reviewer sees the decision before the code that depends on it.
- **Edit in place.** Docs state the current truth. Git is the history. Appended notes rot.
- **Decisions by dialog.** An agent that opens with three options and a recommendation makes agreeing the easy path. The ADR records where the conversation ended, and lists unexamined options as "not weighed in detail" rather than inventing rejections.
- **Two lanes, decided by CI.** Anything that adds or changes a requirement, screen, endpoint or decision goes the full lane. Everything else does not need a feature file. The boundary is a check on the diff, so it cannot drift.
- **PR descriptions are 20 lines, written for a person.** Review volume is the real bottleneck with agents. A short description is a forcing function for small PRs.

## Loops

Work returns to the earliest stage whose document is wrong. A missed criterion before merge stays in build. A defect after ship re-enters at the stage that was wrong, and blanks the approvals from there down so the gate must be passed again. New requirements for a shipped feature are a revision on the same file.
