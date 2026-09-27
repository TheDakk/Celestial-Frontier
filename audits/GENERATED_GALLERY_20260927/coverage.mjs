/** Coverage ledger (Claude 2026-09-27): per Earth body family, how many of the game's pinned Earth fauna species have a GENERATED
 * creature passing the native harness (gallery-registry.json). Species names match the Earth fauna profiles exactly; "Cod + Perch"
 * style tiles count each species. Usage (repo root): node audits/GENERATED_GALLERY_20260927/coverage.mjs > .../coverage.json */
import fs from 'node:fs'; import path from 'node:path';
const src = fs.readFileSync('port/v2/apps/game/src/earth-fauna-profiles.ts', 'utf8'), roster = new Map();
for (const m of src.matchAll(/group\("([^"]+)",\[([^\]]*)\],\["([^"]+)"/g)) for (const n of m[2].matchAll(/"([^"]+)"/g)) roster.set(n[1], m[3]);
const reg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'gallery-registry.json'), 'utf8')), covered = new Set(), unmatched = [];
for (const e of reg) for (const raw of e.name.replace(/\s*\(.*?\)\s*/g, '').split('+').map((s) => s.trim())) { if (roster.has(raw)) covered.add(raw); else unmatched.push(e.name); }
const fam = {}; for (const [n, f] of roster) { fam[f] ??= { species: 0, covered: 0, names: [] }; fam[f].species++; if (covered.has(n)) { fam[f].covered++; fam[f].names.push(n); } }
const rows = Object.entries(fam).sort((a, b) => b[1].species - a[1].species).map(([f, v]) => ({ family: f, species: v.species, covered: v.covered, pct: +(100 * v.covered / v.species).toFixed(1), names: v.names }));
console.log(JSON.stringify({ schema: 'cf.generated-coverage/v1', roster: roster.size, covered: covered.size, pct: +(100 * covered.size / roster.size).toFixed(1), unmatchedRegistryNames: [...new Set(unmatched)], families: rows }, null, 1));
