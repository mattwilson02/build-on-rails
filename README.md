# Build on rails

A gated workflow for building software with AI agents, and the harness that enforces it.

The workflow comes from building a real app with Claude Code. The idea is old: waterfall. A product team approves each stage in order, and nothing downstream starts until it does. The new part is that agents do most of the typing, so the gates have to be mechanical, or they get talked around.

## What a harness is

A harness is **execution rules and tools for performing a task**. Rules say what the agent may and may not do. Tools make the rules checkable, or make the task possible. A prompt that says "please get approval first" is a wish. A script that fails the build when a feature's stage is ahead of its approvals is a rule with a tool behind it.

See [docs/harness.md](docs/harness.md).

## The workflow

```
requirements → design → spec → build → shipped
     ▲            ▲        ▲       │
     └────────────┴────────┴───────┘  work re-enters at the earliest stage that is wrong
```

- A feature is one file: requirements with testable criteria, design link, spec, approvals.
- The contributor approves requirements, design and spec by setting a dated field. Merging the PR approves the build. The agent never sets an approval.
- Every criterion has a test that cites its ID. CI fails a shipped feature with an unproven criterion.
- Small changes take a fast lane. CI decides the lane from the PR title and diff, not from the author's say-so.
- Defects and new requirements go back to the stage whose document is wrong.

See [docs/gates.md](docs/gates.md).

## What is here

| Path | What |
| ---- | ---- |
| [docs/](docs) | The thinking: the harness, the gates, how to adopt it |
| [kit/](kit) | Copy this into your repo: workflow docs, templates, scripts, CI, hooks, skills, `CLAUDE.md` |
| [examples/](examples) | A filled-in feature file |

The scripts need a current Node (developed on 24) and git. Nothing else. Run the kit's tests with `node --test kit/scripts/*.test.mjs`.

## Status

Extracted from one project. It has run one builder with one approver, on a small app. How it holds up with a larger team is untested. The rules are opinionated; change them in `kit/docs/workflow.md` and the scripts follow.

## Licence

MIT.
