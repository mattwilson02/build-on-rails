#!/usr/bin/env node
// Stops a push that would land work where it can't be merged: straight to main, or onto a branch whose PR is
// already merged or closed. Run by the pre-push hook.
// Usage: node scripts/check-branch.mjs [branch]
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * What is wrong with pushing to this branch, from its PR. Empty when fine.
 * `pr` is `{ number, state }` from GitHub, or null when there is none.
 */
export function branchProblems({ branch, main = 'main', pr }) {
  if (branch === main)
    return [`${main} only changes through a merged PR. Push a branch.`];
  const problems = [];
  if (pr && pr.state !== 'OPEN')
    problems.push(
      `PR #${pr.number} for ${branch} is ${pr.state.toLowerCase()}. Start a new branch from ${main}.`,
    );
  return problems;
}

const gh = (...args) => {
  try {
    return JSON.parse(
      execFileSync('gh', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 8000,
      }),
    );
  } catch {
    return undefined;
  }
};

/** The newest PR whose head is this branch, or null. Undefined when GitHub can't be asked. */
const prFor = (branch) => {
  const list = gh(
    'pr',
    'list',
    '--head',
    branch,
    '--state',
    'all',
    '--limit',
    '1',
    '--json',
    'number,state',
  );
  return list === undefined ? undefined : (list[0] ?? null);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const branch =
    process.argv[2] ??
    execFileSync('git', ['branch', '--show-current'], {
      encoding: 'utf8',
    }).trim();
  const pr = branch === 'main' ? null : prFor(branch);
  if (pr === undefined) {
    console.warn(
      `check-branch: could not ask GitHub about ${branch}; pushing unchecked.`,
    );
    process.exit(0);
  }
  const problems = branchProblems({ branch, pr });
  if (problems.length) {
    for (const p of problems) console.error(`check-branch: ${p}`);
    process.exit(1);
  }
}
