---
status: draft
---

# Workflow

Draft. Not binding until `status: approved`. The contributor is the person who owns the product. Only they approve a stage, an ADR or this document.

## Stages

A feature is one file, `features/<slug>.md`, and moves through five stages in order. The contributor approves the first three by setting a dated field. Merging the PR approves the build. `shipped` is a state, not an approval.

| Stage        | Contributor approves                                          | Field                   |
| ------------ | ------------------------------------------------------------- | ----------------------- |
| requirements | The requirements as written: IDs, types, testable criteria.   | `approved-requirements` |
| design       | The design frames: every screen and state in scope.           | `approved-design`       |
| spec         | The Spec section, and any ADR it needs, accepted.             | `approved-spec`         |
| build        | The PR, by merging it. Criteria are proven per `testing/strategy.md`. | merge           |
| shipped      | Nothing. The merging PR sets `stage: shipped` and adds a changelog entry. | `stage`     |

Stage advances only when the approval for the current stage is set. `check-docs` fails a feature whose stage is ahead of its approvals.

A feature's `adrs` field lists the ADRs specific to it: the ones the feature creates, and any other it has to satisfy in a way the code does not make obvious. Decisions every feature sits on apply without being listed.

## Status values

| Doc                                  | Field        | Values                                     | Set by                           |
| ------------------------------------ | ------------ | ------------------------------------------ | -------------------------------- |
| Feature                              | `stage`      | requirements, design, spec, build, shipped | the PR that advances it          |
| Feature                              | `approved-*` | a date                                     | Contributor only                 |
| ADR                                  | `status`     | proposed, accepted, superseded             | accepted by the contributor only |
| `workflow.md`, `testing/strategy.md` | `status`     | draft, approved                            | approved by the contributor only |

## Lanes

Full lane: anything that adds, changes or removes a requirement, screen, endpoint or decision. It is a `feat` PR, and its feature must be at stage `build`.

Fast lane: everything else. `fix`, `chore`, `refactor`, `style`, `test`, `perf`, `build`, `ci`, `docs`. No issue, no feature file.

CI enforces the line from the PR title and diff. A fast-lane type may not add a file matching `newSurface` in `workflow.config.json` (a route, screen or controller, for example), add an ADR, or add or remove a requirement or criterion line. A `docs` PR may only touch docs and repo config. A `feat` PR must cite requirement IDs that exist in a feature at `build`, or one the PR itself moves from `build` to `shipped`, and carry a `Manual check:` line. Judgement stays with the contributor at merge.

PR descriptions use `.github/PULL_REQUEST_TEMPLATE/feature.md` for `feat` and `fast.md` otherwise. They are 20 lines at most, headings excluded. CI fails empty required sections: What changed and Why on every PR, plus Proof and Verified by me on `feat`.

## Work that is not a feature

Deployment, hosting, CI and tooling have no user story. Route them by who would notice if they were missing or broken.

| Who would notice                                                                         | Where it lives                                                                                                                                                              | Lane |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Only engineering                                                                         | The decision is an ADR, if it is hard to reverse. How to operate it is a runbook, `docs/runbooks/<topic>.md`, edited in place. The implementation is a `ci`, `build` or `chore` PR. | Fast |
| The business or users depend on the outcome: the release path, uptime, performance, rules | A `Q` or `C` requirement in a feature file, for example `PLAT-01 C: A build reaches production from main`. Its criteria are proven by a `[manual]` check or by CI itself. The ADR records how, and the implementation is a `feat` PR. | Full |

Upstream first still holds: the requirement if there is one, then the ADR accepted (a `docs` PR), then the implementation. A feature with no screens sets `design: none`, and the contributor approves the design stage as having nothing to design.

The runbook is the current how-to and nothing else. The ADR says why, and the runbook says how.

## Requirements

- Feature prefix: `AUTH`. Requirement: `AUTH-03`, flat, numbered in order, never reused. Criterion: `AUTH-03.2`, the testable leaf. No deeper level. A requirement that needs sub-requirements is too big: split it.
- Type is a property, not part of the ID: `F` functional, `BR` business rule, `Q` quality (performance, accessibility, security, privacy, offline), `C` constraint (platform, store, legal).
- Technical requirements are not a product type. They live in the Spec section and ADRs.
- Format in the feature file: `### AUTH-03 F: Name`, then `- .1 criterion` lines. A criterion that cannot be unit tested starts `[manual]`.
- A shipped feature needs a test citing every criterion that is not `[manual]`.
- Requirements and design state the intended behaviour, even where it leads to a feature that is not built yet. The spec adds what that needs now as a placeholder, and the later feature fills it.

## Loops

Work goes back to the earliest stage whose document is wrong.

- **Build misses the criteria before merge.** Stay in build. Fix and re-prove. If a document turns out to be wrong, fix the document first, in its own commit.
- **Defect found at or after ship.** GitHub issue from the Defect template, labelled `bug`, `feature:<slug>` and `reenter:<stage>`. It cites the criterion violated. Re-entry: code wrong, build; spec or decision wrong, spec, and a new superseding ADR if a decision reverses; screen or state wrong, design; requirement wrong, requirements. Above build, blank the approval dates from that stage down and set `stage` back to it. The fixing PR sets them again and returns `stage` to `shipped`.
- **New requirements for a shipped feature.** GitHub issue from the Revision template, labelled `revision` and `feature:<slug>`. Same capability, extended: edit the feature file in place, add IDs (never reuse), blank the approval dates the change touches and set `stage` to the first of them. It often changes the design and often needs an ADR. A different capability that depends on it is a new feature with its own prefix.

Labels: `bash scripts/setup-github.sh` creates them. Create `feature:<slug>` with each feature.

## Changelog

`CHANGELOG.md` is the one append-only file, in the [Common Changelog](https://github.com/vweevers/common-changelog) style, written for the people who use or run the product. Entries are plain words, imperative, one line each: `Add`, `Change`, `Remove`, `Fix`, ending with the requirement ID or issue number. Groups run Changed, Added, Removed, Fixed. Breaking changes start `**Breaking:**`. Tooling, refactors and docs changes stay out.

Entries go under `## Unreleased` in the PR that changes what people see. The first sentence of the PR's "What changed" is the draft entry. The release step renames it `## [x.y.z] - YYYY-MM-DD`. A shipped feature must have an entry that cites its requirements. CI checks the format.
