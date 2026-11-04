// FINISH F6 (D58, Dakk 2026-11-04 "Squash release branch"): build the release branch as a SHORT CHAIN of signed commits whose final
// tree is exactly the scrubbed release tree. One commit holding everything since develop (~16 M added lines) is beyond what the
// identity pre-push guard can scan (it was killed after 18 min), so the same tree is split into path batches of bounded size.
// Usage (repo root): node audits/FINISH_20261104/release-chain.mjs <base-commit> <target-tree> <title> [maxLinesPerCommit]
// Prints the final commit id. Uses a temporary index (never touches the worktree or HEAD); refs are not moved.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';

const [base, target, title, maxArg] = process.argv.slice(2);
if (!base || !target || !title) throw Error('usage: release-chain.mjs <base-commit> <target-tree> <title> [maxLines]');
const MAX = Number(maxArg ?? 1_500_000);
const index = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cf-release-')), 'index');
const git = (args, input) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 30, input, env: { ...process.env, GIT_INDEX_FILE: index } });

const want = new Map(); // path -> "mode sha" in the target tree
for (const line of git(['ls-tree', '-r', '-z', target]).split('\0')) { if (!line) continue; const tab = line.indexOf('\t'), [mode, , sha] = line.slice(0, tab).split(' '); want.set(line.slice(tab + 1), `${mode} ${sha}`); }
const changed = []; // [path, addedLines]
for (const rec of git(['diff', '--numstat', '-z', '--no-renames', base, target]).split('\0')) {
  if (!rec) continue; const [add, , p] = rec.split('\t'); changed.push([p, add === '-' ? 1 : Number(add)]);
}
changed.sort((a, b) => (a[0] < b[0] ? -1 : 1));
const batches = []; let cur = [], lines = 0;
for (const [p, n] of changed) { if (cur.length && lines + n > MAX) { batches.push(cur); cur = []; lines = 0; } cur.push(p); lines += n; }
if (cur.length) batches.push(cur);

git(['read-tree', base]);
let parent = base;
batches.forEach((batch, i) => {
  const info = batch.map((p) => (want.has(p) ? `${want.get(p)}\t${p}` : `0 ${'0'.repeat(40)}\t${p}`)).join('\n') + '\n';
  git(['update-index', '--index-info'], info);
  const tree = git(['write-tree']).trim();
  const msg = `${title} (${i + 1}/${batches.length})\n\nPaths ${batch[0]} … ${batch.at(-1)} (${batch.length} files). One release tree split into bounded commits so the\nidentity pre-push guard can scan each one (D58, FINISH F6).\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0189DXbYCaNAktC556fPsHUa\n`;
  parent = git(['commit-tree', '-S', tree, '-p', parent, '-F', '-'], msg).trim();
  process.stderr.write(`${i + 1}/${batches.length} ${parent.slice(0, 10)} files=${batch.length}\n`);
});
const finalTree = git(['rev-parse', parent + '^{tree}']).trim();
if (finalTree !== git(['rev-parse', target + '^{tree}']).trim()) throw Error('final tree differs from the target tree');
fs.rmSync(path.dirname(index), { recursive: true, force: true });
console.log(parent);
