// D50: resolve every certified species to the EXACT fit its certifying native film used, by sha256 of record.json + binding.json
// (both are bound in the film's report.json). Read-only; writes resolved.json beside this script. Run from the repo root.
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto'; import { execFileSync } from 'node:child_process';
const sha = (f) => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const reg = JSON.parse(fs.readFileSync('audits/GENERATED_GALLERY_20260927/gallery-registry.json', 'utf8'));
const cert = reg.filter((e) => !/^HELD|^REFUSE/i.test(e.note || ''));
// index every on-disk fit (tracked or ignored) by its record.json sha
const recs = execFileSync('find', ['audits', '-name', 'record.json', '-not', '-path', '*/node_modules/*'], { maxBuffer: 1 << 28 }).toString().trim().split('\n');
const byRecord = new Map();
for (const r of recs) { const d = path.dirname(r); if (!['binding.json', 'parts/keyed.png', 'parts/manifest.json'].every((f) => fs.existsSync(path.join(d, f)))) continue;
  try { const m = JSON.parse(fs.readFileSync(path.join(d, 'parts/manifest.json'), 'utf8')); if (!fs.existsSync(path.join(d, 'parts/atlas', m.creatureId + '.png'))) continue; } catch { continue; }
  const k = sha(r); if (!byRecord.has(k)) byRecord.set(k, []); byRecord.get(k).push(d); }
// authentic masters by sha (the fits' packet/master.png copies are ignored regenerables): every TRACKED png that could be a master
const trackedPng = execFileSync('git', ['ls-files', '-z', 'audits/**/master.png', 'audits/**/original.png', 'audits/**/master*.png'], { maxBuffer: 1 << 28 }).toString().split('\0').filter(Boolean);
const masterBySha = new Map(); for (const f of trackedPng) { if (!fs.existsSync(f)) continue; const k = sha(f); if (!masterBySha.has(k)) masterBySha.set(k, f); }
const out = [], counts = {};
for (const e of cert) {
  const rep = path.join(e.nativeDir, 'report.json'); let row = { name: e.name, family: e.family, nativeDir: e.nativeDir, cert: e.cert ?? null };
  if (!fs.existsSync(rep)) { row.status = 'NO_REPORT'; } else {
    const hs = new Set(fs.readFileSync(rep, 'utf8').match(/[a-f0-9]{64}/g) ?? []);
    const hits = [...hs].flatMap((h) => byRecord.get(h) ?? []).filter((d) => hs.has(sha(path.join(d, 'binding.json'))));
    const uniq = [...new Set(hits)];
    if (!uniq.length) row.status = 'NO_FIT'; else { row.status = 'RESOLVED'; row.fit = uniq[0] + '/'; row.alternates = uniq.slice(1);
      row.recordSha256 = sha(path.join(uniq[0], 'record.json'));
      const rec = JSON.parse(fs.readFileSync(path.join(uniq[0], 'record.json'), 'utf8')), want = rec.geometry?.cutoutAssetHash;
      row.masterSha256 = want; row.master = masterBySha.get(want) ?? null; if (!row.master) row.status = 'NO_MASTER'; row.bindingSha256 = sha(path.join(uniq[0], 'binding.json')); }
  }
  counts[row.status] = (counts[row.status] ?? 0) + 1; out.push(row);
}
fs.writeFileSync('audits/D50_DELIVERY_20261103/resolved.json', JSON.stringify({ schema: 'cf.d50-resolved-fits/v1', fitsIndexed: byRecord.size, counts, rows: out }, null, 1) + '\n');
console.log(JSON.stringify({ certified: cert.length, fitsIndexed: byRecord.size, counts }));
