# Using it

Two roles. The **contributor** is the person who owns the product and approves each gate. The **agent** does the drafting and the building. The agent never approves anything.

## Quick reference

| Step | Who | What happens | Tool | What changes |
| ---- | --- | ------------ | ---- | ------------ |
| Start | Agent | Reads where everything stands, says what is next | `status.mjs` (runs at session start) | Nothing |
| Requirements | Agent drafts, contributor approves | IDs and pass/fail criteria | skill `draft-requirements` | `docs/features/<slug>.md` |
| Design | Contributor approves | Every screen and state in scope, linked from the feature | your design tool | `design:` link |
| Spec | Agent drafts, contributor approves | Approach, plus any decision that is hard to reverse | skills `draft-spec`, `record-decision` | Spec section, `docs/adr/` |
| Build | Agent builds, contributor merges | Code, with tests that cite criterion IDs | `check-docs.mjs`, CI | Code and tests |
| PR | Contributor writes | 20 lines, outcome first. CI picks the lane from the title and diff | skill `draft-pr`, PR templates | The PR |
| Ship | The merging PR | Sets `stage: shipped`, adds a changelog line | `check-docs.mjs` | `CHANGELOG.md` |
| Defect or revision | Either | Back to the earliest stage whose document is wrong | skill `reenter`, issue templates | Issue, approvals blanked |

Approvals are dated fields the contributor sets by hand. Nothing else moves a feature forward.

## One feature, start to finish

The example is `examples/feature.md`, a daily reminder with the prefix `REM`.

1. **Open a session.** The hook prints branch, open PRs and issues, every feature's stage, and how many of the current feature's criteria have tests. The agent summarises it and says what comes next.
2. **Requirements.** You describe the feature. The agent asks what it is for, then drafts `REM-01 F: Set a daily reminder` with criteria `.1`, `.2`, and `.3 [manual]`. It runs `check-docs`. You read it, correct it, and set `approved-requirements: 2026-01-12`. The agent does not.
3. **Design.** You design the screens and states and put the link in `design:`. A feature with no screens sets `design: none`. You set `approved-design`.
4. **Spec.** The agent writes the approach in plain words. If it hits a decision that is hard to reverse, it stops and talks it through with you. It does not hand you a menu. What you settle goes into an ADR as `proposed`. You accept it, then set `approved-spec`. Each of these is its own `docs` commit, before any code.
5. **Build.** The feature is now at `stage: build`. The agent writes code and tests. Each test names the criterion it proves: `it('REM-01.2 replaces the old time')`. `check-docs` warns on any criterion with no test.
6. **The PR.** A `feat` PR must cite requirement IDs from a feature at `build`, carry a real `Manual check:` line (device or browser, what you tried, what happened), and fit in 20 lines. You write it. The agent can draft one from the template.
7. **Merge and ship.** Merging approves the build. The same PR sets `stage: shipped` and adds a line under `## Unreleased` in `CHANGELOG.md`. CI fails a shipped feature with an unproven criterion or no changelog line.

## The rest of the workflow

**Fast lane.** A `fix`, `chore`, `refactor`, `docs` and similar PR needs no feature file and no issue. CI blocks it if it adds a screen, endpoint or ADR, or changes a requirement. Those go the full lane.

**A defect after ship.** Open an issue from the Defect template, cite the criterion that broke, and say which stage's document was wrong. Above build, the approvals from that stage down are cleared and the stage is set back to it. The fixing PR sets them again.

**New requirements for a shipped feature.** Open an issue from the Revision template. Edit the feature file in place, add new IDs (never reuse), clear the approvals the change touches.

**Deploy, hosting, CI.** If only engineering would notice, it is a decision record and a runbook, and the work is a fast-lane PR. If users depend on the outcome, it is a requirement like any other.

**Pushing.** The pre-push hook refuses a push to `main`, and to a branch whose PR is already merged or closed.

## First day

Follow [adopting.md](adopting.md), add your first feature from `kit/docs/_templates/feature.md`, and start a session.
