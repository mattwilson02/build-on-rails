---
status: draft
---

# Testing strategy

Every acceptance criterion has proof. Proof is an automated test that cites the criterion ID, plus a manual confirmation in the PR. A criterion that cannot be unit tested is tagged `[manual]` in the feature file.

## Naming

Tests cite the criterion ID in their name: `it('AUTH-01.2 shows an error on a wrong password')`. `check-docs` matches these against the feature file. Files named `*.test.*`, `*.spec.*` or `*.cy.*` are scanned.

## By layer

| Layer | Automated | Manual |
| ----- | --------- | ------ |
|       |           |        |

## Manual confirmation

One `Manual check:` line in the PR: device or browser, build, what was tried, result.
