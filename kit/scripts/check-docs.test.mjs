// Tests for check-docs. Each test builds a throwaway git repo. Run: node --test scripts/*.test.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const CHECK = new URL('./check-docs.mjs', import.meta.url).pathname;
const git = (dir, ...a) => execFileSync('git', a, { cwd: dir, stdio: 'pipe' });

const feature = (over = {}) => {
  const fm = {
    stage: 'build',
    'approved-requirements': '2026-10-01',
    'approved-design': '2026-10-02',
    'approved-spec': '2026-10-03',
    ...over,
  };
  return `---
feature: auth
prefix: DEMO
stage: ${fm.stage}
approved-requirements: ${fm['approved-requirements']}
approved-design: ${fm['approved-design']}
approved-spec: ${fm['approved-spec']}
design: https://example.com/design
adrs: [0001-provider]
---

# Auth

Sign in.

## Requirements

### DEMO-01 F: Sign in

- .1 Valid credentials open home.
- .2 [manual] The keyboard does not cover the button.
`;
};
const adr = `---
id: 0001
title: Provider
status: accepted
supersedes:
date: 2026-10-01
---

# 0001. Provider

Use X.
`;
const base = () => ({
  'docs/features/auth.md': feature(),
  'docs/adr/0001-provider.md': adr,
  'workflow.config.json': JSON.stringify({
    newSurface: [
      { pattern: '^src/screens/.+\\.tsx$', label: 'screen' },
    ],
  }),
  'src/auth.spec.ts': "it('DEMO-01.1 opens home', () => {});\n",
  'CHANGELOG.md': '# Changelog\n\n## Unreleased\n',
});

const changelogWith = (entry) =>
  `# Changelog\n\n## Unreleased\n\n### Added\n\n- ${entry}\n`;
const shipped = () => ({
  ...base(),
  'docs/features/auth.md': feature({ stage: 'shipped' }),
  'CHANGELOG.md': changelogWith('Add sign in (DEMO-01)'),
});

function write(dir, files) {
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), text);
  }
}
function repo(files = base()) {
  const dir = mkdtempSync(join(tmpdir(), 'check-docs-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 't@t');
  git(dir, 'config', 'user.name', 't');
  write(dir, files);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'base');
  return dir;
}
function change(dir, files) {
  git(dir, 'checkout', '-qb', `t${Math.random().toString(36).slice(2, 8)}`);
  write(dir, files);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'change');
}
function run(dir, { base: ref, title, body = '' } = {}) {
  const env = { ...process.env, GITHUB_ACTIONS: '' };
  delete env.PR_TITLE;
  delete env.PR_BODY;
  if (title !== undefined)
    Object.assign(env, { PR_TITLE: title, PR_BODY: body });
  const r = spawnSync(
    'node',
    [CHECK, '--root', dir, ...(ref ? ['--base', ref] : [])],
    { env, encoding: 'utf8' },
  );
  return { ok: r.status === 0, out: r.stdout + r.stderr };
}
const fails = (r, text) => {
  assert.equal(r.ok, false, r.out);
  assert.match(r.out, text);
};
const passes = (r) => assert.equal(r.ok, true, r.out);

const filled =
  '## What changed\nSign-in shows an error on a wrong password.\n\n## Why\nIt went blank.\n\n## How to check\nEnter a wrong password.';
const featBody = `${filled}\n\n## Requirement IDs\nDEMO-01.1\n\n## Proof\nDEMO-01.1 has a test.\nManual check: iPhone simulator, entered credentials, home opened\n\n## Verified by me\nRan it.`;

test('a valid repo passes', () => passes(run(repo())));

test('a leftover <Project> placeholder is a warning, not an error', () => {
  const r = run(repo({ ...base(), 'CLAUDE.md': '# <Project>\n' }));
  passes(r);
  assert.match(r.out, /placeholder/);
});

test('a stage ahead of its approvals fails', () => {
  fails(
    run(
      repo({
        ...base(),
        'docs/features/auth.md': feature({
          stage: 'spec',
          'approved-design': '',
        }),
      }),
    ),
    /requires approved-design/,
  );
});

test('a test citing an ID that does not exist fails', () => {
  fails(
    run(
      repo({
        ...base(),
        'src/x.spec.ts': "it('DEMO-09.1 ghost', () => {});\n",
      }),
    ),
    /DEMO-09\.1/,
  );
});

test('an end-to-end spec file counts as a test', () => {
  const files = shipped();
  delete files['src/auth.spec.ts'];
  files['test/auth.e2e-spec.ts'] =
    "it('DEMO-01.1 opens home', () => {});\n";
  passes(run(repo(files)));
});

test('a shipped feature needs a test for every non-manual criterion', () => {
  const files = { ...shipped(), 'src/auth.spec.ts': '' };
  fails(run(repo(files)), /DEMO-01\.1 has no test/);
  passes(run(repo(shipped())));
});

test('an accepted ADR cannot be edited', () => {
  const dir = repo();
  change(dir, { 'docs/adr/0001-provider.md': `${adr}\nUse Y instead.\n` });
  fails(run(dir, { base: 'main' }), /immutable/);
});

test('a requirement ID is never reused', () => {
  const dir = repo();
  change(dir, {
    'docs/features/auth.md': feature().replace(
      '### DEMO-01 F: Sign in',
      '### DEMO-01 F: Sign in\n\n- .3 x\n\n### DEMO-00 Q: Late',
    ),
  });
  fails(run(dir, { base: 'main' }), /never reused/);
});

test('the changelog must be latest first with groups in order', () => {
  const bad =
    '# Changelog\n\n## [0.1.0] - 2026-10-05\n\n### Added\n\n- One\n\n## [0.2.0] - 2026-10-06\n\n### Fixed\n\n- Two\n';
  fails(run(repo({ ...base(), 'CHANGELOG.md': bad })), /latest first/);
  const good =
    '# Changelog\n\n## Unreleased\n\n### Added\n\n- One (DEMO-01)\n\n## [0.1.0] - 2026-10-05\n\n### Changed\n\n- **Breaking:** Two\n\n### Added\n\n- Three\n';
  passes(run(repo({ ...base(), 'CHANGELOG.md': good })));
});

test('lanes: the title must be a conventional commit', () => {
  const dir = repo();
  change(dir, { 'note.txt': 'x' });
  fails(
    run(dir, { base: 'main', title: 'Strip stuff', body: filled }),
    /conventional commit/,
  );
  passes(run(dir, { base: 'main', title: 'chore: note', body: filled }));
});

test('lanes: a fast-lane type may not add a screen', () => {
  const dir = repo();
  change(dir, { 'src/screens/new.tsx': 'export default 1' });
  fails(
    run(dir, { base: 'main', title: 'fix(app): thing', body: filled }),
    /fast lane but adds screen/,
  );
});

test('lanes: a docs PR may only touch docs and repo config', () => {
  const dir = repo();
  change(dir, { 'src/other.ts': 'export {}' });
  fails(
    run(dir, { base: 'main', title: 'docs: x', body: filled }),
    /only touch docs/,
  );
});

test('descriptions: empty sections and an unedited template fail', () => {
  const dir = repo();
  change(dir, { 'note.txt': 'x' });
  fails(
    run(dir, {
      base: 'main',
      title: 'chore: x',
      body: '## What changed\n\n## Why\n\n## How to check\n',
    }),
    /"What changed" section is empty/,
  );
});

test('descriptions: more than 20 lines fails', () => {
  const dir = repo();
  change(dir, { 'note.txt': 'x' });
  const long = `## What changed\n${Array.from({ length: 22 }, (_, i) => `line ${i}`).join('\n')}\n\n## Why\nx`;
  fails(
    run(dir, { base: 'main', title: 'chore: x', body: long }),
    /limit is 20/,
  );
});

test('feat: needs IDs of a feature at build, a real manual check and the extra sections', () => {
  const dir = repo();
  change(dir, { 'note.txt': 'x' });
  passes(
    run(dir, { base: 'main', title: 'feat(auth): sign in', body: featBody }),
  );
  fails(
    run(dir, {
      base: 'main',
      title: 'feat(auth): sign in',
      body: featBody.replace(/Manual check:.*/, 'Manual check: n/a'),
    }),
    /real "Manual check:"/,
  );
  fails(
    run(dir, { base: 'main', title: 'feat(auth): sign in', body: filled }),
    /must cite requirement IDs/,
  );
  const early = repo({
    ...base(),
    'docs/features/auth.md': feature({ stage: 'design', 'approved-spec': '' }),
  });
  change(early, { 'note.txt': 'x' });
  fails(
    run(early, { base: 'main', title: 'feat(auth): sign in', body: featBody }),
    /not build/,
  );
});

test('a shipped feature needs a changelog entry citing its requirements', () => {
  fails(
    run(
      repo({
        ...shipped(),
        'CHANGELOG.md': changelogWith('Add something else (OTHER-01)'),
      }),
    ),
    /no entry citing DEMO-NN/,
  );
  passes(run(repo(shipped())));
});

test('a feat PR may ship the feature it delivers', () => {
  const dir = repo();
  change(dir, {
    'docs/features/auth.md': feature({ stage: 'shipped' }),
    'CHANGELOG.md': changelogWith('Add sign in (DEMO-01)'),
  });
  passes(
    run(dir, { base: 'main', title: 'feat(auth): sign in', body: featBody }),
  );
});

test('a feat PR cannot cite a feature that was shipped before it', () => {
  const dir = repo(shipped());
  change(dir, { 'note.txt': 'x' });
  fails(
    run(dir, { base: 'main', title: 'feat(auth): more', body: featBody }),
    /shipped, not build|which is at stage shipped/,
  );
});
