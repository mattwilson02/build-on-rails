#!/usr/bin/env node
// Where things stand: branch, PRs, issues, features, and the current feature's criteria against tests.
// Derived from git, GitHub and docs/. Nothing to keep up to date. Usage: node scripts/status.mjs [--root dir]
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { loadFeatures, testCitations } from './lib/docs.mjs';

const i = process.argv.indexOf('--root');
const root = resolve(i > -1 ? process.argv[i + 1] : process.cwd());
const run = (cmd, ...a) => {
  try {
    return execFileSync(cmd, a, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 8000,
    }).trimEnd();
  } catch {
    return null;
  }
};

const out = [];
const branch = run('git', 'branch', '--show-current') ?? '(not a git repo)';
const main =
  ['main', 'master'].find((b) =>
    run('git', 'rev-parse', '--verify', '--quiet', b),
  ) ?? 'main';
const ahead = run('git', 'rev-list', '--count', `${main}..HEAD`);
const dirty = (run('git', 'status', '--porcelain') ?? '')
  .split('\n')
  .filter(Boolean).length;
out.push(
  `Branch: ${branch}${ahead ? `, ${ahead} ahead of ${main}` : ''}${dirty ? `, ${dirty} uncommitted` : ''}`,
);
// Local work that would be lost with this laptop: branches never pushed, or ahead of what was.
const unpushed = (
  run(
    'git',
    'for-each-ref',
    '--format=%(refname:short)|%(upstream:short)|%(upstream:track)',
    'refs/heads',
  ) ?? ''
)
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('|'))
  .filter(([name]) => name !== main)
  .map(([name, upstream, track]) =>
    !upstream
      ? `${name} (never pushed)`
      : /ahead (\d+)/.test(track)
        ? `${name} (${track.match(/ahead (\d+)/)[1]} unpushed)`
        : null,
  )
  .filter(Boolean);
if (unpushed.length) out.push(`Unpushed: ${unpushed.join(', ')}`);
const log = run('git', 'log', '--oneline', '-5');
if (log)
  out.push(
    `Recent:\n${log
      .split('\n')
      .map((l) => `  ${l}`)
      .join('\n')}`,
  );

const prs = run(
  'gh',
  'pr',
  'list',
  '--state',
  'open',
  '--json',
  'number,title,headRefName',
  '--jq',
  '.[] | "  #\\(.number) \\(.title) [\\(.headRefName)]"',
);
if (prs) out.push(`Open PRs:\n${prs}`);
const issues = run(
  'gh',
  'issue',
  'list',
  '--state',
  'open',
  '--limit',
  '10',
  '--json',
  'number,title,labels',
  '--jq',
  '.[] | "  #\\(.number) \\(.title) [\\(.labels | map(.name) | join(", "))]"',
);
if (issues) out.push(`Open issues:\n${issues}`);

const features = loadFeatures(root).filter((f) => f.fm);
if (features.length === 0) out.push('Features: none yet');
else {
  out.push(
    'Features:\n' +
      features
        .map((f) => {
          const a = ['requirements', 'design', 'spec'].filter(
            (s) => f.fm[`approved-${s}`],
          ).length;
          return `  ${f.fm.feature}: ${f.fm.stage} (${a}/3 approved)`;
        })
        .join('\n'),
  );
}

const current = features.find((f) => branch.includes(f.fm.feature));
const next = {
  requirements: 'Draft requirements, then the contributor approves them.',
  design: 'Design it, then the contributor approves.',
  spec: 'Write the Spec section and any ADR, then the contributor approves.',
  build: 'Build against the criteria; tests cite criterion IDs.',
  shipped: 'Shipped. Only defects or a revision reopen it.',
};
if (current) {
  const cited = testCitations(root, new Set([current.fm.prefix]));
  const all = current.reqs.flatMap((r) => r.criteria);
  const testable = all.filter((c) => !c.manual);
  const missing = testable.filter((c) => !cited.has(c.id));
  out.push(
    `Current feature ${current.fm.feature} (${current.fm.stage}): ${current.reqs.length} requirements, ${all.length} criteria, ${testable.length - missing.length}/${testable.length} testable criteria have tests, ${all.length - testable.length} manual.`,
  );
  if (missing.length && ['build', 'shipped'].includes(current.fm.stage))
    out.push(`  No test yet: ${missing.map((c) => c.id).join(', ')}`);
  out.push(`Next: ${next[current.fm.stage]}`);
} else {
  const open = features.filter((f) => f.fm.stage !== 'shipped');
  out.push(
    open.length
      ? `Next: continue ${open[0].fm.feature}. ${next[open[0].fm.stage]}`
      : 'Next: nothing in flight. Ask the contributor.',
  );
}
console.log(out.join('\n'));
