import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const STAGES = ['requirements', 'design', 'spec', 'build', 'shipped'];
export const TYPES = ['F', 'BR', 'Q', 'C'];
export const APPROVALS = {
  design: 'requirements',
  spec: 'design',
  build: 'spec',
  shipped: 'spec',
};

const SKIP = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.expo',
  '.turbo',
]);
const TEST_FILE = /[.-](test|spec|cy)\.(ts|tsx|js|jsx|mjs)$/;

export function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, keep, out);
    else if (keep(full)) out.push(full);
  }
  return out;
}

export function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: null, body: text };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    data[kv[1]] = v;
  }
  return { data, body: text.slice(m[0].length) };
}

const HEADING = /^### ([A-Z][A-Z0-9]*)-(\d{2,}) (\S+): (.+)$/;
const CRITERION = /^- \.(\d+) (.+)$/;

export function parseFeature(file, text) {
  const { data, body } = parseFrontMatter(text);
  const reqs = [];
  const malformed = [];
  let current = null;
  for (const line of body.split('\n')) {
    if (line.startsWith('### ')) {
      const m = line.match(HEADING);
      if (!m) {
        malformed.push(line);
        current = null;
        continue;
      }
      current = {
        prefix: m[1],
        num: Number(m[2]),
        id: `${m[1]}-${m[2]}`,
        type: m[3],
        title: m[4],
        criteria: [],
      };
      reqs.push(current);
      continue;
    }
    if (line.startsWith('## ')) current = null;
    const c = current && line.match(CRITERION);
    if (c) {
      current.criteria.push({
        id: `${current.id}.${c[1]}`,
        n: Number(c[1]),
        manual: c[2].startsWith('[manual]'),
      });
    }
  }
  return { file, fm: data, reqs, malformed };
}

export function loadFeatures(root) {
  const dir = join(root, 'docs', 'features');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) =>
      parseFeature(
        join('docs', 'features', f),
        readFileSync(join(dir, f), 'utf8'),
      ),
    );
}

/** Map of criterion ID -> test files that cite it, for the given known prefixes. */
export function testCitations(root, prefixes) {
  const cited = new Map();
  if (prefixes.size === 0) return cited;
  const re = /\b([A-Z][A-Z0-9]*)-(\d{2,})(?:\.(\d+))?\b/g;
  for (const file of walk(root, (f) => TEST_FILE.test(f))) {
    for (const m of readFileSync(file, 'utf8').matchAll(re)) {
      if (!prefixes.has(m[1])) continue;
      const id = m[3] ? `${m[1]}-${m[2]}.${m[3]}` : `${m[1]}-${m[2]}`;
      if (!cited.has(id)) cited.set(id, new Set());
      cited.get(id).add(file.slice(root.length + 1));
    }
  }
  return cited;
}
