# <Project>

<One sentence: what this is.>

## Session start

A hook runs `node scripts/status.mjs`. It prints the branch, open PRs and issues, every feature's stage, and for the current feature how many criteria have tests. Use it. Say where the open work stands against its requirements and what comes next, in a few lines, before doing anything else.

## Docs

`docs/` is the source of truth. Read `docs/README.md`, then `docs/workflow.md`.

- Edit in place. State the current truth only. Never append dated notes, "updated" lines or revision history. Git is the history. The one exception is `CHANGELOG.md`: append-only, plain words for the people who use the product.
- One home per fact. Requirements, specs and approvals live in `docs/features/<slug>.md`. Designs live in the design tool, linked from the feature. Decisions live in `docs/adr/`. Never put a plan, spec or decision anywhere else, or leave it only in chat.
- Never set an approval date, or an accepted or approved status. Only the contributor does, and only when they say so.
- Decisions are the contributor's, and they are reached by dialog, not by menu. Don't open with options, pros and cons and a recommendation: that makes agreeing the easy path and outsources the contributor's judgement. Ask what they are thinking, answer what they ask, and push back where they are wrong. An ADR records where the conversation ended. Options nobody discussed are listed as "not weighed in detail".
- A spec says what happens and why, in plain words. File names, scripts and config belong in the code and in runbooks.
- Changes flow upstream first: requirements, design, spec, code. A doc change goes in its own commit, before the code that depends on it.
- If code and an approved doc disagree, stop and ask which is right.
- While `docs/workflow.md` is `draft`, ask before starting a feature.
- PR descriptions: `.github/PULL_REQUEST_TEMPLATE/feature.md` for `feat`, `fast.md` for everything else. Written for a person, outcome first, 20 lines maximum. The contributor writes them. When asked to draft one, follow the template.
- Full lane (`feat`, feature at `build`) or fast lane, per the workflow. Tests cite criterion IDs in their names.

## Commands

`node scripts/status.mjs`, `node scripts/check-docs.mjs`, `node --test scripts/*.test.mjs`. Add your build, lint, type-check and test commands here. Run them and `check-docs` before calling a task done.
