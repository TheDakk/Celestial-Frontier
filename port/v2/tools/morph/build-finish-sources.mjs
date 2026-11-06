// G5 finish SOURCES on the on-demand art library (Claude, 2026-09-26): the desktop finisher starts from an archetype's exact
// original master and its ownership labels, neither of which ships in the pack (masters left the pack on 2026-09-25). Each
// finishable archetype (a bundled master pin AND a supplementary labels pin, tools/morph/creature-finish-source-pins.mjs) gets
// `public/library/creature-finish-source/<creatureId>/{master.png,labels.png}`, copied byte for byte after both hashes are checked
// against the bundled pins. The library manifest pass (art-library-manifest.mjs) then pins them like every other library file;
// only a capable desktop that finishes ever fetches them. Deterministic; run by build-shipped-battle2.mjs before the manifest.
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
const R = path.resolve(import.meta.dirname, '../../../..');
export const FINISH_SOURCE_ROOT = 'port/v2/apps/game/public/library/creature-finish-source';
const sha = (b) => createHash('sha256').update(b).digest('hex');
export function finishSourceRows() {
  const masters = fs.readFileSync(path.join(R, 'port/v2/apps/game/src/battle2-master-pins.generated.ts'), 'utf8');
  const labels = fs.readFileSync(path.join(R, 'port/v2/apps/game/src/creature-finish-source-pins.generated.ts'), 'utf8');
  const rows = [];
  for (const m of masters.matchAll(/creatureId: '([^']+)', masterPath: '([^']+)', masterSha256: '([a-f0-9]{64})'/g)) {
    const [, id, masterPath, masterSha256] = m, l = labels.match(new RegExp(`"creatureId": "${id}",[^}]*"labelsPath": "([^"]+)",\\s*"labelsPngSha256": ("([a-f0-9]{64})"|null)`));
    rows.push({ id, masterPath, masterSha256, labelsPath: l?.[1] ?? null, labelsSha256: l?.[3] ?? null });
  }
  return rows;
}
export function writeFinishSources() {
  const root = path.join(R, FINISH_SOURCE_ROOT); fs.rmSync(root, { recursive: true, force: true });
  const written = [], skipped = [];
  for (const r of finishSourceRows()) {
    if (!r.labelsSha256) { skipped.push(`${r.id}: no pinned source labels (refuses finishing)`); continue; }
    const master = fs.readFileSync(path.join(R, r.masterPath)), labels = fs.readFileSync(path.join(R, r.labelsPath));
    if (sha(master) !== r.masterSha256) throw Error(`finish source ${r.id}: master bytes differ from the bundled pin`);
    if (sha(labels) !== r.labelsSha256) throw Error(`finish source ${r.id}: labels bytes differ from the bundled pin`);
    const dir = path.join(root, r.id); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'master.png'), master); fs.writeFileSync(path.join(dir, 'labels.png'), labels); written.push(r.id);
  }
  return { written: written.length, skipped };
}
if (import.meta.url === new URL(process.argv[1], 'file:').href) console.log(JSON.stringify(writeFinishSources()));
