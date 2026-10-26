# Adopting it

1. Copy the contents of `kit/` into your repo root (including the dotfolders). Keep `docs/`, `scripts/`, `.github/`, `.githooks/`, `.claude/`, `CLAUDE.md`, `CHANGELOG.md` and `workflow.config.json`.
2. Edit `CLAUDE.md`: name the project, add your build, lint and test commands.
3. Edit `workflow.config.json`. `newSurface` lists path patterns a fast-lane PR may not add (routes, screens, controllers). Match your layout.
4. Fill in `docs/testing/strategy.md` for your stack, and add your install, lint and test steps to `.github/workflows/ci.yml`.
5. Enable the pre-push hook: `git config core.hooksPath .githooks`.
6. Create the labels: `bash scripts/setup-github.sh` (needs `gh`).
7. Read `docs/workflow.md`, change what you disagree with, and set `status: approved`. Until then the agent is told to ask before starting a feature.
8. Add your first feature from `docs/_templates/feature.md`. Run `node scripts/status.mjs` and `node scripts/check-docs.mjs`.

## Adapting

- **Test file patterns** are in `scripts/lib/docs.mjs` (`TEST_FILE`).
- **Stages** are in the same file. Adding one means adding its approval field and updating `workflow.md`.
- **Design tool**: the design stage only needs a link in the feature file. Use whatever you have.
- **Without GitHub**: check-docs works on a git repo alone. `status.mjs` and `check-branch.mjs` skip GitHub when `gh` is missing.
