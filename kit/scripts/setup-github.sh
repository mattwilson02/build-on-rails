#!/usr/bin/env bash
# Creates the GitHub labels the workflow uses. Safe to re-run. Needs `gh` logged in to the repo.
# Also create one `feature:<slug>` label per feature: gh label create "feature:auth" --color ededed
set -euo pipefail

label() { gh label create "$1" --description "$2" --color "$3" --force; }

label bug "Something isn't working" d73a4a
label revision "New or changed requirements for a shipped feature" 5319e7
label reenter:requirements "Work re-enters at requirements" b60205
label reenter:design "Work re-enters at design" 5319e7
label reenter:spec "Work re-enters at spec" 1d76db
label reenter:build "Work re-enters at build" 0e8a16
