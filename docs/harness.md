# The harness

A harness is **execution rules and tools for performing a task**. It is what you put around an agent so that doing the task the right way is the easy path, and doing it the wrong way is caught.

## Rules

Rules say how the work is done. In this kit they live where the agent reads them every session:

- `CLAUDE.md`: the standing rules. Edit docs in place, one home per fact, never set an approval, decisions by dialog, upstream first, stop when code and an approved doc disagree.
- `docs/workflow.md`: the stages, lanes and loops. This is the contract with the product team.
- Skills in `.claude/skills/`: one per stage activity (draft requirements, draft the spec, record a decision, draft a PR, re-enter after a defect). A skill is a rule written as a procedure, with a stop condition.

## Tools

Tools make rules checkable. A rule with no tool depends on the agent remembering it.

| Tool | What it enforces |
| ---- | ---------------- |
| `scripts/check-docs.mjs` | Stage never ahead of approvals. Requirement IDs well formed, unique, never reused. Every shipped criterion has a test citing it. Accepted ADRs are immutable. PR title, description and lane. Changelog format. Broken links. |
| `scripts/status.mjs` | Printed at session start: branch, PRs, issues, every feature's stage, the current feature's criteria against tests, unpushed branches. The agent starts from facts, not from memory. |
| `scripts/check-branch.mjs` | Pre-push: no push to `main`, none to a branch whose PR is merged or closed. |
| CI | Runs check-docs on every PR and on `main`. |
| Templates | Feature, ADR, PR, defect, revision. The shape is fixed so a script can read it. |

## Where the line sits

The scripts check what a script can: structure, order, presence, citation. They cannot tell whether a requirement is right or a test is any good. That is the contributor's job at each gate. The harness removes the clerical failures so the contributor's review is spent on judgement.

## Why waterfall

Agents make building cheap and rework expensive, because a wrong requirement is faithfully implemented at speed. Waterfall's old objection was that late change is costly. Here the change is made upstream, in a document, in its own commit, and the loop rules say how far back to go. Gates put the product team's decisions where they can be seen and approved before code exists.
