/* Follow-up hash fixed point after targeted edits (no identity strings).
   usage: node fixpoint.mjs <worktree> <receipt-out.json> <file> [<file> ...]
   Each listed file is first snapshotted at HEAD (its pre-edit bytes); after the caller's edit is on disk, sha256(pre) -> sha256(post)
   is replaced in every text file of the worktree, files that change join the set, and it repeats until stable. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { execFileSync } from 'node:child_process';
const [wt, out, ...seed] = process.argv.slice(2);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const head = (p) => execFileSync('git', ['-C', wt, 'show', `HEAD:${p}`], { maxBuffer: 1 << 30 });
const files = execFileSync('git', ['-C', wt, 'ls-files', '-z'], { maxBuffer: 1 << 30 }).toString().split('\0').filter(Boolean);
const map = new Map(), pairs = [], edited = new Set(seed);
const pre = new Map(seed.map((p) => [p, sha(head(p))]));
for (let round = 1; round < 20; round++) {
  let grew = false;
  for (const p of edited) {
    let h0; try { h0 = pre.has(p) ? pre.get(p) : sha(head(p)); } catch { continue; } pre.set(p, h0);
    const h1 = sha(fs.readFileSync(path.join(wt, p)));
    if (h0 !== h1 && map.get(h0) !== h1) { const prev = map.get(h0); if (prev) map.set(prev, h1); map.set(h0, h1); pairs.push({ old: h0, new: h1, file: p }); grew = true; }
  }
  let edits = 0;
  for (const p of files) {
    const f = path.join(wt, p); let b; try { b = fs.readFileSync(f); } catch { continue; }
    if (b.includes(0)) continue; const t = b.toString('latin1'); if (!/[0-9a-f]{64}/.test(t)) continue;
    const n = t.replace(/(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])/g, (h) => map.get(h) ?? h);
    if (n !== t) { fs.writeFileSync(f, Buffer.from(n, 'latin1')); if (!edited.has(p)) { edited.add(p); grew = true; } edits++; }
  }
  console.error(`fixpoint round ${round}: map ${map.size}, files edited ${edits}`);
  if (!grew && !edits) break;
}
fs.writeFileSync(out, JSON.stringify({ schema: 'cf.identity-reseal-followup/v1', pairs, edited: [...edited].sort() }, null, 1) + '\n');
