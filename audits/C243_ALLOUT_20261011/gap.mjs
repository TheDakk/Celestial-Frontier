/** Gap ledger for the C243 all-out program (Claude 2026-10-11). Lists every Earth roster species that is neither certified-covered nor
 * accepted pending certification, with its pilot packets and their latest intake verdict and refusal classes, so both lanes work from one list.
 * Usage (repo root): node audits/C243_ALLOUT_20261011/gap.mjs [SUMMARY=audits/G1_AUTO_AUTHOR_20260926/auto-sweep7/summary.json] > audits/C243_ALLOUT_20261011/gap.json */
import fs from 'node:fs';
const src = fs.readFileSync('port/v2/apps/game/src/earth-fauna-profiles.ts', 'utf8'), roster = new Map();
for (const m of src.matchAll(/group\("([^"]+)",\[([^\]]*)\],\["([^"]+)"/g)) for (const n of m[2].matchAll(/"([^"]+)"/g)) roster.set(n[1], m[3]);
const reg = JSON.parse(fs.readFileSync('audits/GENERATED_GALLERY_20260927/gallery-registry.json', 'utf8')), done = new Set();
for (const e of reg) if (!/^(HELD|FRAGMENTED|unreviewed)/.test(e.note ?? 'unreviewed') || e.note.startsWith('HELD (PENDING-CERT)'))
  for (const r of e.name.replace(/\s*\(.*?\)\s*/g, '').split('+')) done.add(r.trim());
const pilot = JSON.parse(fs.readFileSync('audits/G1_AUTO_AUTHOR_20260926/pilots/sweep5.json', 'utf8'));
const summary = JSON.parse(fs.readFileSync(process.argv[2] ?? 'audits/G1_AUTO_AUTHOR_20260926/auto-sweep7/summary.json', 'utf8')), byId = new Map(summary.map((r) => [r.id, r]));
const cls = (reasons) => [...new Set((reasons ?? []).map((x) => x.split(':')[0]))];
const species = [...roster].filter(([n]) => !done.has(n)).map(([name, family]) => {
  const packets = pilot.filter((p) => p.name.split('+').some((s) => s.trim() === name)).map((p) => ({ id: p.id, master: p.master, verdict: byId.get(p.id)?.verdict ?? 'UNSCORED', classes: cls(byId.get(p.id)?.reasons) }));
  return { name, family, admitted: packets.some((p) => p.verdict === 'ADMIT'), packets }; });
const fam = {}; for (const s of species) { fam[s.family] ??= { species: 0, admittedNotAccepted: 0, intakeRefused: 0, noMaster: 0 }; const f = fam[s.family]; f.species++;
  if (!s.packets.length) f.noMaster++; else if (s.admitted) f.admittedNotAccepted++; else f.intakeRefused++; }
console.log(JSON.stringify({ schema: 'cf.c243-gap/v1', roster: roster.size, doneIncludingPending: roster.size - species.length, gap: species.length,
  families: Object.fromEntries(Object.entries(fam).sort((a, b) => b[1].species - a[1].species)), species }, null, 1));
