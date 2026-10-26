---
name: draft-pr
description: Draft a pull request description from the template. Use when asked to write or draft a PR description.
---

# Draft a PR description

1. Pick the template: `.github/PULL_REQUEST_TEMPLATE/feature.md` for `feat`, `fast.md` for everything else.
2. Outcome first: what is different for someone using or running the product. Not which files changed. Say what was left out if a reader would assume it was done.
3. First sentence of "What changed" is the changelog line, imperative, if people will notice.
4. On `feat`: list every requirement ID delivered, say what proves each, and give the `Manual check:` line only from what was actually run. If you did not run it, say so and leave it for the contributor.
5. "Verified by me" is the contributor's statement. Draft it from what you ran; they edit it.
6. 20 lines maximum, headings excluded. No "This PR", no "various".

The contributor owns the description. Hand it over as a draft.
