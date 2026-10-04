/* Update gzip carrier byte-length literals in code (TS/JS/MJS) after the re-seal. No identity strings in this file.
   usage: node carrier-lengths.mjs <worktree> <receipt.json> <backupRepo.git> <branch>
   A carrier literal is a block holding gzipSha256 (+ optional rawSha256) and gzipBytes/rawBytes numbers. For every such block
   whose gzipSha256 is a re-sealed value, the matching tree file gives the true sizes; the OLD literal must equal the backup
   file's size (the receipt maps new -> old -> backup path), otherwise the block is reported and left alone. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import zlib from 'node:zlib'; import { execFileSync } from 'node:child_process';
const [wt, receiptPath, backup, branch] = process.argv.slice(2);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
const byNew = new Map(receipt.pairs.map((p) => [p.new, p]));
const files = execFileSync('git', ['-C', wt, 'ls-files', '-z'], { maxBuffer: 1 << 30 }).toString().split('\0').filter(Boolean);
const gzByHash = new Map();
for (const f of files.filter((x) => x.endsWith('.gz'))) { try { const b = fs.readFileSync(path.join(wt, f)); gzByHash.set(sha(b), { f, gz: b.length, raw: zlib.gunzipSync(b).length }); } catch {} }
const oldSizes = (newHash) => {
  const p = byNew.get(newHash); if (!p) return null;
  const bp = p.file.replace(/^/, '');
  try { const b = execFileSync('git', ['-C', backup, 'cat-file', 'blob', `${branch}:${bp}`], { maxBuffer: 1 << 30 }); return { gz: b.length, raw: zlib.gunzipSync(b).length }; } catch { return null; }
};
const num = (s) => Number(s.replace(/_/g, ''));
const fmt = (n, like) => like.includes('_') ? n.toLocaleString('en-US').replace(/,/g, '_') : String(n);
const report = { updated: [], refused: [] };
for (const f of files.filter((x) => /\.(ts|mts|mjs|js)$/.test(x))) {
  const full = path.join(wt, f); let t = fs.readFileSync(full, 'utf8'); if (!t.includes('gzipSha256')) continue;
  let changedFile = false;
  t = t.replace(/\{[^{}]*gzipSha256[^{}]*\}/g, (block) => {
    const h = /gzipSha256\s*:\s*['"]([0-9a-f]{64})['"]/.exec(block)?.[1]; if (!h || !gzByHash.has(h)) return block;
    const cur = gzByHash.get(h), old = oldSizes(h);
    let out = block;
    for (const [key, field] of [['gzipBytes', 'gz'], ['rawBytes', 'raw']]) {
      const m = new RegExp(key + '\\s*:\\s*([0-9_]+)').exec(out); if (!m) continue;
      const lit = num(m[1]); if (lit === cur[field]) continue;
      if (!old || old[field] !== lit) { report.refused.push({ file: f, key, literal: lit, current: cur[field], backup: old?.[field] ?? null }); continue; }
      out = out.replace(m[0], m[0].replace(m[1], fmt(cur[field], m[1]))); report.updated.push({ file: f, key, old: lit, new: cur[field], carrier: cur.f });
    }
    if (out !== block) changedFile = true; return out;
  });
  if (changedFile) fs.writeFileSync(full, t);
}
console.log(JSON.stringify({ updated: report.updated.length, refused: report.refused }, null, 1));
fs.writeFileSync(receiptPath.replace(/\.json$/, '.carrier-lengths.json'), JSON.stringify(report, null, 1) + '\n');
