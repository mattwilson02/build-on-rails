#!/usr/bin/env node
// Mechanical checks for docs/. Usage: node scripts/check-docs.mjs [--root dir] [--base ref]
// With --base, also checks ADR immutability and requirement ID reuse against that ref.
// With PR_TITLE (and PR_BODY) set, also enforces the fast and full lanes.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  APPROVALS,
  STAGES,
  TYPES,
  loadFeatures,
  parseFrontMatter,
  testCitations,
  walk,
} from './lib/docs.mjs';

const args = process.argv.slice(2);
const opt = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const root = resolve(opt('--root') ?? process.cwd());
const base = opt('--base');
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);
const git = (...a) =>
  execFileSync('git', a, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const read = (p) => readFileSync(join(root, p), 'utf8');
// workflow.config.json: `newSurface` lists what a fast-lane PR may not add. Each entry is { pattern, label }.
const config = existsSync(join(root, 'workflow.config.json'))
  ? JSON.parse(read('workflow.config.json'))
  : {};
const newSurface = (config.newSurface ?? []).map((s) => ({
  re: new RegExp(s.pattern),
  label: s.label,
}));

// ---- features ----
const features = loadFeatures(root);
const prefixes = new Map();
for (const f of features) {
  const { fm } = f;
  if (!fm) {
    err(f.file, 'missing front matter');
    continue;
  }
  const slug = f.file.split('/').pop().replace(/\.md$/, '');
  if (fm.feature !== slug)
    err(f.file, `feature "${fm.feature}" must equal the file name "${slug}"`);
  if (!/^[A-Z][A-Z0-9]*$/.test(fm.prefix ?? ''))
    err(f.file, 'prefix must be uppercase letters, e.g. AUTH');
  else if (prefixes.has(fm.prefix))
    err(
      f.file,
      `prefix ${fm.prefix} is already used by ${prefixes.get(fm.prefix)}`,
    );
  else prefixes.set(fm.prefix, f.file);
  if (!STAGES.includes(fm.stage)) {
    err(f.file, `stage "${fm.stage}" must be one of ${STAGES.join(', ')}`);
    continue;
  }
  const need = APPROVALS[fm.stage];
  if (need) {
    const order = ['requirements', 'design', 'spec'];
    for (const s of order.slice(0, order.indexOf(need) + 1)) {
      if (!fm[`approved-${s}`])
        err(f.file, `stage ${fm.stage} requires approved-${s}`);
    }
  }
  for (const s of ['requirements', 'design', 'spec']) {
    const v = fm[`approved-${s}`];
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v))
      err(f.file, `approved-${s} must be a date YYYY-MM-DD`);
  }
  if (fm['approved-design'] && !fm.design)
    err(f.file, 'design link is required once design is approved');
  for (const line of f.malformed)
    err(f.file, `malformed requirement heading: ${line}`);
  if (f.reqs.length === 0 && fm.stage !== 'requirements')
    err(f.file, 'no requirements found');
  const seen = new Set();
  for (const r of f.reqs) {
    if (r.prefix !== fm.prefix)
      err(f.file, `${r.id} does not use the feature prefix ${fm.prefix}`);
    if (!TYPES.includes(r.type))
      err(
        f.file,
        `${r.id} type "${r.type}" must be one of ${TYPES.join(', ')}`,
      );
    if (seen.has(r.id)) err(f.file, `${r.id} is duplicated`);
    seen.add(r.id);
    if (r.criteria.length === 0)
      err(f.file, `${r.id} has no acceptance criteria`);
    const nums = new Set();
    for (const c of r.criteria) {
      if (nums.has(c.n)) err(f.file, `${c.id} is duplicated`);
      nums.add(c.n);
    }
  }
}

// ---- tests vs criteria ----
const cited = testCitations(root, new Set(prefixes.keys()));
const known = new Set(
  features.flatMap((f) =>
    f.reqs.flatMap((r) => [r.id, ...r.criteria.map((c) => c.id)]),
  ),
);
for (const [id, files] of cited) {
  if (!known.has(id))
    err([...files][0], `cites ${id}, which is not in any feature file`);
}
// A shipped feature is in the changelog: some entry cites one of its requirements.
if (existsSync(join(root, 'CHANGELOG.md'))) {
  const changelog = read('CHANGELOG.md');
  for (const f of features) {
    if (f.fm?.stage !== 'shipped') continue;
    if (!new RegExp(`\\b${f.fm.prefix}-\\d{2,}`).test(changelog))
      err(
        f.file,
        `is shipped but CHANGELOG.md has no entry citing ${f.fm.prefix}-NN`,
      );
  }
}
for (const f of features) {
  if (!f.fm || !['build', 'shipped'].includes(f.fm.stage)) continue;
  for (const r of f.reqs) {
    for (const c of r.criteria) {
      if (c.manual || cited.has(c.id)) continue;
      (f.fm.stage === 'shipped' ? err : warn)(
        f.file,
        `${c.id} has no test citing it (tag it [manual] if it cannot be unit tested)`,
      );
    }
  }
}

// ---- ADRs ----
const adrDir = join(root, 'docs', 'adr');
const adrs = [];
if (existsSync(adrDir)) {
  for (const name of readdirSync(adrDir).filter((n) =>
    /^\d{4}-.+\.md$/.test(n),
  )) {
    const file = `docs/adr/${name}`;
    const { data } = parseFrontMatter(read(file));
    if (!data) {
      err(file, 'missing front matter');
      continue;
    }
    const id = name.slice(0, 4);
    if (data.id !== id)
      err(file, `id "${data.id}" must equal the file number ${id}`);
    if (!['proposed', 'accepted', 'superseded'].includes(data.status))
      err(file, `status "${data.status}" is invalid`);
    adrs.push({ file, id, data });
  }
  adrs.sort((a, b) => a.id.localeCompare(b.id));
  adrs.forEach((a, i) => {
    if (Number(a.id) !== i + 1)
      err(a.file, `ADR numbers must run 0001, 0002, ... without gaps`);
  });
  for (const a of adrs) {
    const s = a.data.supersedes;
    if (s && !adrs.some((o) => o.id === s))
      err(a.file, `supersedes ${s}, which does not exist`);
    if (
      a.data.status === 'superseded' &&
      !adrs.some((o) => o.data.supersedes === a.id)
    ) {
      err(a.file, 'is superseded but no ADR supersedes it');
    }
  }
}
for (const f of features) {
  const list = Array.isArray(f.fm?.adrs) ? f.fm.adrs : [];
  for (const ref of list) {
    if (!adrs.some((a) => a.file.slice(9, -3) === ref || a.id === ref))
      err(f.file, `adrs entry "${ref}" does not match an ADR`);
  }
}

// ---- workflow and testing status ----
for (const file of ['docs/workflow.md', 'docs/testing/strategy.md']) {
  if (!existsSync(join(root, file))) continue;
  const { data } = parseFrontMatter(read(file));
  if (!data || !['draft', 'approved'].includes(data.status))
    err(file, 'status must be draft or approved');
}

// ---- relative links ----
const mdFiles = [
  ...walk(join(root, 'docs'), (f) => f.endsWith('.md')),
  join(root, 'README.md'),
  join(root, 'CLAUDE.md'),
].filter(existsSync);
for (const abs of mdFiles) {
  const rel = abs.slice(root.length + 1);
  const text = readFileSync(abs, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1].split('#')[0];
    if (!target || /^[a-z]+:/.test(target)) continue;
    if (!existsSync(resolve(dirname(abs), target)))
      err(rel, `broken link ${m[1]}`);
  }
}

// ---- changelog (Common Changelog style, append-only, written for people) ----
const CHANGE_GROUPS = ['Changed', 'Added', 'Removed', 'Fixed'];
if (existsSync(join(root, 'CHANGELOG.md'))) {
  const lines = read('CHANGELOG.md').split('\n');
  if (lines[0] !== '# Changelog')
    err('CHANGELOG.md', 'must start with "# Changelog"');
  let release = null;
  let group = -1;
  let previous = null;
  let unreleasedSeen = false;
  const semver = (v) => v.split('.').map(Number);
  const newer = (a, b) => {
    const x = semver(a);
    const y = semver(b);
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
    return false;
  };
  lines.forEach((line, i) => {
    const at = `CHANGELOG.md:${i + 1}`;
    if (line.startsWith('## ')) {
      group = -1;
      if (line === '## Unreleased') {
        if (unreleasedSeen || previous)
          err(at, 'Unreleased must appear once, above every release');
        unreleasedSeen = true;
        release = 'Unreleased';
        return;
      }
      const m = line.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/);
      if (!m) {
        err(
          at,
          'release heading must be "## [x.y.z] - YYYY-MM-DD" or "## Unreleased"',
        );
        return;
      }
      if (previous && !newer(previous.version, m[1]))
        err(
          at,
          `${m[1]} must be older than ${previous.version}: releases are latest first`,
        );
      if (previous && previous.date < m[2])
        err(at, `${m[2]} is later than the release above it`);
      previous = { version: m[1], date: m[2] };
      release = m[1];
    } else if (line.startsWith('### ')) {
      const g = CHANGE_GROUPS.indexOf(line.slice(4));
      if (g === -1) err(at, `group must be one of ${CHANGE_GROUPS.join(', ')}`);
      else if (g <= group)
        err(
          at,
          `groups run ${CHANGE_GROUPS.join(', ')} and appear once per release`,
        );
      group = g;
    } else if (line.startsWith('- ')) {
      if (!release || group === -1)
        err(at, 'an entry must sit under a release and a group');
    }
  });
}

// ---- checks against a base ref ----
function changed() {
  return git('diff', '--name-status', '--no-renames', `${base}...HEAD`)
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [s, ...p] = l.split('\t');
      return { status: s, path: p.join('\t') };
    });
}
function baseFile(path) {
  try {
    return git('show', `${base}:${path}`);
  } catch {
    return null;
  }
}
if (base) {
  const files = changed();
  for (const { status, path } of files) {
    if (!/^docs\/adr\/\d{4}-.+\.md$/.test(path) || status === 'A') continue;
    const before = baseFile(path);
    if (!before || parseFrontMatter(before).data?.status !== 'accepted')
      continue;
    if (status === 'D') {
      err(path, 'an accepted ADR cannot be deleted');
      continue;
    }
    const strip = (t) => t.replace(/^status:.*$/m, 'status:');
    const nowText = read(path);
    const nowStatus = parseFrontMatter(nowText).data?.status;
    if (
      strip(before) !== strip(nowText) ||
      !['accepted', 'superseded'].includes(nowStatus)
    ) {
      err(
        path,
        'an accepted ADR is immutable. Write a new ADR that supersedes it, and only set status to superseded here',
      );
    }
  }
  for (const f of features) {
    const before = baseFile(f.file);
    if (!before) continue;
    const oldNums = [...before.matchAll(/^### [A-Z][A-Z0-9]*-(\d{2,}) /gm)].map(
      (m) => Number(m[1]),
    );
    const max = Math.max(0, ...oldNums);
    for (const r of f.reqs) {
      if (!oldNums.includes(r.num) && r.num <= max)
        err(
          f.file,
          `${r.id} is new but not above the highest existing ID (${max}). IDs are never reused`,
        );
    }
  }
}

// ---- PR templates ----
if (
  existsSync(join(root, '.github', 'pull_request_template.md')) &&
  existsSync(join(root, '.github', 'PULL_REQUEST_TEMPLATE', 'fast.md')) &&
  read('.github/pull_request_template.md') !==
    read('.github/PULL_REQUEST_TEMPLATE/fast.md')
) {
  err(
    '.github/pull_request_template.md',
    'must be a copy of .github/PULL_REQUEST_TEMPLATE/fast.md',
  );
}

// ---- lanes (pull requests) ----
const title = process.env.PR_TITLE;
if (title !== undefined && base) {
  const body = (process.env.PR_BODY ?? '').replace(/<!--[\s\S]*?-->/g, '');
  // Sections of the description: heading -> non-blank lines. Comments are already stripped.
  const sections = new Map();
  let heading = '';
  let budget = 0;
  for (const line of body.split('\n')) {
    const h = line.match(/^## (.+?)\s*$/);
    if (h) {
      heading = h[1];
      sections.set(heading, []);
      continue;
    }
    if (!line.trim() || line.startsWith('#')) continue;
    budget++;
    if (heading) sections.get(heading).push(line.trim());
  }
  const need = (name) => {
    if (!(sections.get(name) ?? []).length)
      err('PR', `the "${name}" section is empty`);
  };
  need('What changed');
  need('Why');
  if (budget > 20)
    err(
      'PR',
      `the description is ${budget} lines. The limit is 20, headings excluded`,
    );
  const t = title.match(/^(\w+)(\([^)]*\))?!?: \S/);
  if (!t)
    err(
      'PR title',
      'must be a conventional commit, e.g. "feat(auth): sign in"',
    );
  else {
    const type = t[1];
    const files = changed();
    const featureDiff = files.some(({ path }) =>
      /^docs\/features\/[^/]+\.md$/.test(path),
    );
    const structural = (path) => {
      const lines = git('diff', '-U0', `${base}...HEAD`, '--', path).split(
        '\n',
      );
      return lines.some((l) => /^[+-](### [A-Z]|- \.\d)/.test(l));
    };
    const reasons = [];
    for (const { status, path } of files) {
      if (status === 'A')
        for (const { re, label } of newSurface)
          if (re.test(path)) reasons.push(`adds ${label} ${path}`);
      if (status === 'A' && /^docs\/adr\/\d{4}-/.test(path))
        reasons.push(`adds ADR ${path}`);
      if (/^docs\/features\/[^/]+\.md$/.test(path) && structural(path))
        reasons.push(`changes requirements in ${path}`);
    }
    // Features this PR moves from build to shipped. The PR that proves a feature is the one that ships it.
    const shippedHere = new Set(
      files
        .filter(({ path }) => /^docs\/features\/[^/]+\.md$/.test(path))
        .filter(({ path }) => {
          const lines = git('diff', '-U0', `${base}...HEAD`, '--', path).split(
            '\n',
          );
          return (
            lines.includes('-stage: build') && lines.includes('+stage: shipped')
          );
        })
        .map(({ path }) => features.find((f) => f.file === path)?.fm?.feature),
    );
    if (type === 'feat') {
      const ids = [
        ...new Set(
          [...body.matchAll(/\b([A-Z][A-Z0-9]*-\d{2,})(?:\.\d+)?\b/g)].map(
            (m) => m[1],
          ),
        ),
      ].filter((id) => prefixes.has(id.split('-')[0]));
      if (ids.length === 0)
        err('PR', 'a feat PR must cite requirement IDs in its body');
      for (const id of ids) {
        const owner = features.find((f) => f.reqs.some((r) => r.id === id));
        if (!owner) err('PR', `${id} is not in any feature file`);
        else if (
          owner.fm.stage !== 'build' &&
          !(owner.fm.stage === 'shipped' && shippedHere.has(owner.fm.feature))
        )
          err(
            'PR',
            `${id} belongs to ${owner.fm.feature}, which is at stage ${owner.fm.stage}, not build`,
          );
      }
      need('Proof');
      need('Verified by me');
      const manual = body.match(/^Manual check:\s*(.*)$/m)?.[1]?.trim() ?? '';
      if (
        manual.startsWith('<') ||
        manual.length < 15 ||
        /^(n\/?a|none|todo|tbd)\b/i.test(manual)
      )
        err(
          'PR',
          'a feat PR needs a real "Manual check:" line: device or browser, build, what you tried, what happened',
        );
    } else if (type === 'docs') {
      const outside = files.filter(
        ({ path }) =>
          !/^(docs\/|\.github\/|CLAUDE\.md$|README\.md$|CHANGELOG\.md$)/.test(
            path,
          ),
      );
      if (outside.length)
        err(
          'PR',
          `a docs PR may only touch docs and repo config, not ${outside[0].path}`,
        );
    } else if (
      [
        'fix',
        'chore',
        'refactor',
        'style',
        'test',
        'perf',
        'build',
        'ci',
      ].includes(type)
    ) {
      for (const r of reasons.filter(
        (x) => !x.startsWith('changes requirements'),
      ))
        err('PR', `${type} is fast lane but ${r}. Use the full lane`);
      if (
        featureDiff &&
        reasons.some((x) => x.startsWith('changes requirements'))
      )
        err(
          'PR',
          `${type} is fast lane but changes requirements. Change docs in a docs PR first`,
        );
    } else warn('PR title', `unknown type "${type}"`);
  }
}

// On GitHub Actions, annotations put the reason on the PR checks page instead of only in the log.
const onGitHub = process.env.GITHUB_ACTIONS === 'true';
for (const w of warnings)
  console.warn(onGitHub ? `::warning title=check-docs::${w}` : `warn  ${w}`);
for (const e of errors)
  console.error(onGitHub ? `::error title=check-docs::${e}` : `error ${e}`);
console.log(
  `check-docs: ${features.length} feature(s), ${adrs.length} ADR(s), ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
