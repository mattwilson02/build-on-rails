import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { branchProblems } from './check-branch.mjs';

describe('branchProblems', () => {
  it('refuses a push to main', () => {
    assert.equal(branchProblems({ branch: 'main', pr: null }).length, 1);
  });

  it('allows a new branch with no PR yet', () => {
    assert.deepEqual(branchProblems({ branch: 'chore/x', pr: null }), []);
  });

  it('allows a branch whose PR is open against main', () => {
    const pr = { number: 3, state: 'OPEN' };
    assert.deepEqual(branchProblems({ branch: 'chore/x', pr }), []);
  });

  it('refuses a branch whose PR is merged', () => {
    const pr = { number: 8, state: 'MERGED' };
    const [problem] = branchProblems({ branch: 'fix/x', pr });
    assert.match(problem, /#8 .* merged\. Start a new branch from main/);
  });

  it('refuses a branch whose PR is closed', () => {
    const pr = { number: 5, state: 'CLOSED' };
    assert.equal(branchProblems({ branch: 'fix/x', pr }).length, 1);
  });

  it('allows a stacked branch even when its base PR has merged', () => {
    const pr = { number: 9, state: 'OPEN' };
    assert.deepEqual(branchProblems({ branch: 'docs/y', pr }), []);
  });
});
