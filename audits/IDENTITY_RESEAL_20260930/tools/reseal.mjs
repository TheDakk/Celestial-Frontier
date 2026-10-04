/* Mechanical re-seal after the identity rewrite (no identity strings in this file).
   usage: node reseal.mjs <backupRepo.git> <branch> <worktree> <rewrittenRepo.git>
   Fixed point over the worktree:
     (a) every file the rewrite changed maps sha256(backup bytes) -> sha256(current bytes);
     (b) JSON self-hash fields (a 64-hex top-level value that, in the BACKUP, equals hashJSON of the object without it)
         are recomputed from the current object;
     (c) every old 64-hex value found in any text file of the worktree is replaced by its new value, textually
         (no re-serialisation), and those files join the changed set.
   Writes receipt JSON: every (old -> new, kind, source file) pair and every file it edited. */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { execFileSync } from 'node:child_process'; import zlib from 'node:zlib';
const [backup, branch, wt, rewritten, receiptPath] = process.argv.slice(2);
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const stableJSON = (x) => JSON.stringify(x, (_, v) => v && !Array.isArray(v) && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v);
const hashJSON = (x) => sha(Buffer.from(stableJSON(x)));
const git = (repo, ...a) => execFileSync('git', ['-C', repo, ...a], { maxBuffer: 1 << 30 });
/* backup path for each current path: the rewrite's own commit-map is not per-path, so use the rename rule's inverse via ls-tree pairing by blob position */
const lsTree = (repo) => new Map(git(repo, 'ls-tree', '-r', '-z', branch).toString('utf8').split('\0').filter(Boolean).map((l) => l.split('\t')).filter(([meta]) => meta.startsWith('100')).map(([meta, p]) => [p, meta.split(' ')[2]]));  /* regular files only: no symlinks (120000) or submodules (160000) */
const bTree = lsTree(backup), wTree = lsTree(rewritten);
/* pair renamed paths: same directory depth and identical path after case-insensitive normalisation of the renamed token */
const norm = (p) => p.toLowerCase().replace(/(?<![a-z0-9])[a-z]{4}(?=[-_/.])/g, '#');
const bByNorm = new Map(); for (const p of bTree.keys()) { const k = norm(p); if (!bByNorm.has(k)) bByNorm.set(k, []); bByNorm.get(k).push(p); }
const backupPathOf = (p) => { if (bTree.has(p)) return p; const c = (bByNorm.get(norm(p)) ?? []).filter((q) => !wTree.has(q)); return c.length === 1 ? c[0] : null; };
const blobCache = new Map();
const catBlob = (repo, oid) => { const k = repo + oid; if (!blobCache.has(k)) blobCache.set(k, git(repo, 'cat-file', 'blob', oid)); return blobCache.get(k); };
const oldHash = new Map(); const lengths = new Map(); /* new gz/raw hash -> [[oldGzLen,newGzLen],[oldRawLen,newRawLen]] */
const map = new Map(); const receipt = { schema: 'cf.identity-reseal/v1', branch, pairs: [], edited: new Set() };
const origin = new Map(); /* original backup hash -> {kind,file}; the map chains intermediates to the latest value */
const add = (oldH, newH, kind, file) => {
  if (oldH === newH || map.get(oldH) === newH) return false;
  const prev = map.get(oldH);
  if (prev !== undefined && prev !== newH) { map.set(prev, newH); for (const [k, v] of map) if (v === prev) map.set(k, newH); }
  map.set(oldH, newH); if (!origin.has(oldH)) origin.set(oldH, { kind, file }); return true;
};
const isText = (b) => !b.includes(0);
const changed = new Set([...wTree].filter(([p, oid]) => { const bp = backupPathOf(p); return !bp || bTree.get(bp) !== oid; }).map(([p]) => p));
console.error('initially changed files:', changed.size);
const allFiles = [...wTree.keys()];
for (let round = 1; round < 20; round++) {
  let grew = false;
  /* (b) self-hash fields at any depth: in the BACKUP, a 64-hex field equals one of these formulas over its own object
     (without it) or over a sibling field; the SAME formula is recomputed on the current object. */
  const FORMULAS = [['hashJSON', (x) => hashJSON(x)], ['sha256(JSON.stringify)', (x) => sha(Buffer.from(JSON.stringify(x)))]];
  const selfHashes = (bo, co, trail, out) => {
    if (!bo || typeof bo !== 'object' || !co || typeof co !== 'object') return;
    if (Array.isArray(bo)) { bo.forEach((x, i) => selfHashes(x, co[i], trail + '[' + i + ']', out)); return; }
    for (const [k, v] of Object.entries(bo)) {
      if (typeof v === 'string' && /^[0-9a-f]{64}$/.test(v) && k in co) {
        const { [k]: _b, ...restB } = bo, { [k]: cur, ...restC } = co;
        const targets = [['self', restB, restC], ...Object.keys(bo).filter((y) => y !== k).map((y) => ['sibling ' + y, bo[y], co[y]])];
        for (const [tn, tb, tc] of targets) for (const [fn, f] of FORMULAS) {
          if (tb === undefined || tc === undefined) continue;
          if (f(tb) === v) { out.push({ field: trail + '.' + k, cur, old: v, next: f(tc), rule: fn + ' of ' + tn }); break; }
        }
      } else if (v && typeof v === 'object') selfHashes(v, co[k], trail + '.' + k, out);
    }
  };
  for (const p of changed) {
    if (!p.endsWith('.json')) continue;
    const bp = backupPathOf(p); if (!bp) continue;
    let b, c; try { b = JSON.parse(catBlob(backup, bTree.get(bp)).toString('utf8')); c = JSON.parse(fs.readFileSync(path.join(wt, p), 'utf8')); } catch { continue; }
    const found = []; selfHashes(b, c, '', found);
    for (const f of found) {
      if (f.cur !== f.next) { const txt = fs.readFileSync(path.join(wt, p), 'utf8'); fs.writeFileSync(path.join(wt, p), txt.split(f.cur).join(f.next)); receipt.edited.add(p); grew = true; }
      if (add(f.old, f.next, `self-hash ${f.field} (${f.rule})`, p)) grew = true;
    }
  }
  /* (a) file hashes */
  for (const p of changed) {
    const bp = backupPathOf(p); if (!bp) continue;
    if (!oldHash.has(p)) oldHash.set(p, sha(git(backup, 'cat-file', 'blob', bTree.get(bp))));
    const oldH = oldHash.get(p); const cur = fs.readFileSync(path.join(wt, p));
    if (add(oldH, sha(cur), 'file sha256', p)) grew = true;
    if (cur[0] === 0x1f && cur[1] === 0x8b) {
      const old = git(backup, 'cat-file', 'blob', bTree.get(bp));
      try {
        const ro = zlib.gunzipSync(old), rn = zlib.gunzipSync(cur);
        if (add(sha(ro), sha(rn), 'gzip raw sha256', p)) grew = true;
        lengths.set(sha(cur), [[old.length, cur.length], [ro.length, rn.length]]); lengths.set(sha(rn), [[old.length, cur.length], [ro.length, rn.length]]);
      } catch {}
    }
  }
  /* (c) textual replacement everywhere */
  let edits = 0;
  for (const p of allFiles) {
    const f = path.join(wt, p); let buf; try { buf = fs.readFileSync(f); } catch { continue; }
    if (!isText(buf) || buf.length > 64 << 20) continue;
    const t = buf.toString('latin1'); if (!/[0-9a-f]{64}/.test(t)) continue;
    const n = t.replace(/(?<![0-9a-f])[0-9a-f]{64}(?![0-9a-f])/g, (h) => map.get(h) ?? h);
    if (n !== t) { fs.writeFileSync(f, Buffer.from(n, 'latin1')); receipt.edited.add(p); if (!changed.has(p)) { changed.add(p); grew = true; } edits++; }
  }
  /* (d) gzip carrier byte lengths: in any JSON object that names a re-sealed gzip or raw hash, a numeric sibling equal to the old
     length is set to the new length; textual edit only when that exact key/value pair occurs once in the file. */
  for (const p of [...changed].filter((q) => q.endsWith('.json'))) {
    let c, txt; try { txt = fs.readFileSync(path.join(wt, p), 'utf8'); c = JSON.parse(txt); } catch { continue; }
    const edits2 = [];
    const walk = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(walk);
      const hs = Object.values(o).filter((v) => typeof v === 'string' && lengths.has(v));
      for (const h of hs) for (const [ol, nl] of lengths.get(h)) for (const [k, v] of Object.entries(o)) if (v === ol && ol !== nl) edits2.push([k, ol, nl]);
      Object.values(o).forEach(walk); };
    walk(c);
    for (const [k, ol, nl] of edits2) {
      const rx = new RegExp('("' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"\\s*:\\s*)' + ol + '(?![0-9])', 'g');
      const hits = txt.match(rx) ?? [];
      if (hits.length === 1) { txt = txt.replace(rx, '$1' + nl); receipt.lengthEdits = (receipt.lengthEdits ?? []).concat([{ file: p, key: k, old: ol, new: nl }]); grew = true; }
      else if (hits.length > 1) receipt.ambiguousLengths = (receipt.ambiguousLengths ?? []).concat([{ file: p, key: k, old: ol, new: nl, occurrences: hits.length }]);
    }
    if (edits2.length) { fs.writeFileSync(path.join(wt, p), txt); receipt.edited.add(p); }
  }
  console.error(`round ${round}: map ${map.size}, files edited this round ${edits}, changed set ${changed.size}`);
  if (!grew && edits === 0) break;
}
const intermediates = new Set([...map.values()]);
receipt.pairs = [...origin].map(([oldH, o]) => ({ old: oldH, new: map.get(oldH), ...o })).filter((x) => x.old !== x.new);
receipt.edited = [...receipt.edited].sort();
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 1) + '\n');
console.error('receipt pairs', receipt.pairs.length, 'edited files', receipt.edited.length);
