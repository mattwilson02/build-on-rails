# Docs

The source of truth for how <Project> is built and how we work. If it is not here, it is not decided.

| What               | Where                                             |
| ------------------ | ------------------------------------------------- |
| Workflow           | `workflow.md`                                     |
| Feature            | `features/<slug>.md`                              |
| Decision           | `adr/NNNN-slug.md`                                |
| Runbook            | `runbooks/<topic>.md`, created with the first one |
| Testing strategy   | `testing/strategy.md`                             |
| Designs            | The design tool, linked from the feature          |
| Changelog          | `../CHANGELOG.md`                                 |
| Defects, revisions | GitHub issues labelled `feature:<slug>`           |

A feature file holds the requirements, the design link, the spec and the approvals for one feature. Templates are in `_templates/`.

## Rules

1. Edit in place. Docs state the current truth only. No dated addenda, "updated" lines, revision tables or struck-through text. Git and PRs are the history. The one exception is `CHANGELOG.md`, which is append-only and written for the people who use the product.
2. Write only what a reader needs. No padding, no restating another doc, no prose where a list or a table will do.
3. One home per fact. Link to it, do not copy it.
4. Changes flow upstream first: requirements, design, spec, code.
5. Only the contributor sets an approval date or an accepted, approved status.
6. If code and an approved doc disagree, stop and ask which is right.

`node scripts/check-docs.mjs` enforces what a script can. Status of everything in flight: `node scripts/status.mjs`.
