---
name: record-decision
description: Reach a decision with the contributor by dialog and record it as an ADR. Use when a choice is hard to reverse or would plausibly be reopened.
---

# Record a decision

The decision is the contributor's. You are the sparring partner, not the menu.

1. Do not open with options, pros and cons, or a recommendation. Ask what they are thinking.
2. Answer what they ask. Push back where they are wrong, with the reason.
3. When the conversation has landed, draft `docs/adr/NNNN-slug.md` from `docs/_templates/adr.md` with `status: proposed`.
4. Context and Decision say what was settled. Alternatives lists only what was actually discussed and why it was set aside. Anything nobody weighed is written "not weighed in detail". Never invent a rejected alternative.
5. Reversing an accepted ADR means a new ADR with `supersedes: NNNN`. Never edit an accepted one.
6. Run `node scripts/check-docs.mjs`. Commit as a `docs` PR.

Never set `status: accepted`.
