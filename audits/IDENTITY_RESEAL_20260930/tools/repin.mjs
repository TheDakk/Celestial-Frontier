/* Closure for the active Compendium certificate's pins (no identity strings).
   usage: node repin.mjs <worktree> <log.json>
   Repeat: every selector entry whose file hash differs maps pinned -> actual; apply across all text files; until stable. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { execFileSync } from 'node:child_process';
const [wt, log] = process.argv.slice(2);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const files = execFileSync('git', ['-C', wt, 'ls-files', '-z'], { maxBuffer: 1 << 30 }).toString().split('\0').filter(Boolean);
const SEL = path.join(wt, 'port/v2/budgets/compendium-memory-active.json'); const pairs = [];
for (let round = 1; round < 20; round++) {
  const sel = JSON.parse(fs.readFileSync(SEL, 'utf8')); const map = new Map();
  for (const [n, h] of Object.entries(sel.files)) { const a = sha(fs.readFileSync(path.join(wt, sel.epochDirectory, n))); if (a !== h) { map.set(h, a); pairs.push({ round, file: n, old: h, new: a }); } }
  if (!map.size) { console.error('stable after', round - 1, 'rounds'); break; }
  let edits = 0;
  for (const p of files) { const f = path.join(wt, p); let b; try { b = fs.readFileSync(f); } catch { continue; } if (b.includes(0)) continue;
    const t = b.toString('latin1'); const n = t.replace(/(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])/g, (h) => map.get(h) ?? h); if (n !== t) { fs.writeFileSync(f, Buffer.from(n, 'latin1')); edits++; } }
  console.error(`repin round ${round}: ${map.size} pin(s), ${edits} file(s) edited`);
}
fs.writeFileSync(log, JSON.stringify({ schema: 'cf.identity-reseal-repin/v1', pairs }, null, 1) + '\n');
