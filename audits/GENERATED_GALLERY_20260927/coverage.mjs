/** Coverage ledger (Claude 2026-09-27): per Earth body family, how many of the game's pinned Earth fauna species have a GENERATED
 * creature passing the native harness AND accepted at full size (gallery-registry.json; held entries are listed, not counted). Species names match the Earth fauna profiles exactly; "Cod + Perch"
 * style tiles count each species. Usage (repo root): node audits/GENERATED_GALLERY_20260927/coverage.mjs > .../coverage.json */
import fs from 'node:fs'; import path from 'node:path';
const src = fs.readFileSync('port/v2/apps/game/src/earth-fauna-profiles.ts', 'utf8'), roster = new Map();
for (const m of src.matchAll(/group\("([^"]+)",\[([^\]]*)\],\["([^"]+)"/g)) for (const n of m[2].matchAll(/"([^"]+)"/g)) roster.set(n[1], m[3]);
const reg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'gallery-registry.json'), 'utf8')), covered = new Set(), unmatched = [];
/* only ACCEPTED entries count (Claude's full-size review); HELD / FRAGMENTED / unreviewed natives are listed, never counted */
const isHeld = (e) => /^(HELD|FRAGMENTED|unreviewed)/.test(e.note ?? 'unreviewed'), held = new Set();
for (const e of reg) for (const raw of e.name.replace(/\s*\(.*?\)\s*/g, '').split('+').map((s) => s.trim())) { if (!roster.has(raw)) { unmatched.push(e.name); continue; } (isHeld(e) ? held : covered).add(raw); }
for (const n of covered) held.delete(n);
const fam = {}; for (const [n, f] of roster) { fam[f] ??= { species: 0, covered: 0, names: [] }; fam[f].species++; if (covered.has(n)) { fam[f].covered++; fam[f].names.push(n); } }
const rows = Object.entries(fam).sort((a, b) => b[1].species - a[1].species).map(([f, v]) => ({ family: f, species: v.species, covered: v.covered, pct: +(100 * v.covered / v.species).toFixed(1), names: v.names }));
console.log(JSON.stringify({ schema: 'cf.generated-coverage/v1', roster: roster.size, covered: covered.size, pct: +(100 * covered.size / roster.size).toFixed(1), heldNotCounted: [...held].sort(), unmatchedRegistryNames: [...new Set(unmatched)], families: rows }, null, 1));
